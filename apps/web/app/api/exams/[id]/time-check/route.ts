import { NextRequest } from 'next/server';
import { db } from '@ris-academy/db';
import { apiSuccess, apiError, requireAuth, AuthError } from '@/lib/api-utils';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await requireAuth();

    const attempt = await db.examAttempt.findUnique({
      where: { userId_examId: { userId: user.id, examId: params.id } },
      include: {
        exam: {
          include: {
            questions: {
              orderBy: { order: 'asc' },
              select: { id: true, correctAnswer: true, marks: true },
            },
          },
        },
      },
    });

    if (!attempt || attempt.status !== 'IN_PROGRESS') {
      return apiError('No active exam attempt found', 404);
    }

    const now = new Date();
    const expired = now > attempt.expiresAt;
    const remainingMs = attempt.expiresAt.getTime() - now.getTime();
    const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));

    if (expired) {
      if (attempt.exam.examType === 'WRITTEN') {
        await db.examAttempt.update({
          where: { id: attempt.id },
          data: {
            status: 'TIMEOUT',
            score: 0,
            submittedAt: now,
            endTime: now,
          },
        });
      } else {
        await db.examAttempt.update({
          where: { id: attempt.id },
          data: {
            status: 'TIMEOUT',
            score: 0,
            correctCount: 0,
            wrongCount: 0,
            unattempted: attempt.exam.questions.length,
            submittedAt: now,
            endTime: now,
          },
        });
      }

      return apiSuccess({
        remainingSeconds: 0,
        expired: true,
        autoSubmitted: true,
        message: 'Time expired. Exam auto-submitted with score 0.',
        attemptId: attempt.id,
      });
    }

    return apiSuccess({
      remainingSeconds,
      expired: false,
      autoSubmitted: false,
      attemptId: attempt.id,
    });
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    console.error('Time check error:', error);
    return apiError('Failed to check time', 500);
  }
}
