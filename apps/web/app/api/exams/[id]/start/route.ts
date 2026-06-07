import { NextRequest } from 'next/server';
import { db } from '@ris-academy/db';
import { apiSuccess, apiError, requireAuth, AuthError } from '@/lib/api-utils';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await requireAuth();

    const examId = params.id;

    const exam = await db.exam.findUnique({
      where: { id: examId },
      include: { _count: { select: { questions: true } } },
    });

    if (!exam || !exam.isPublished) {
      return apiError('Exam not found', 404);
    }

    const existingAttempt = await db.examAttempt.findUnique({
      where: { userId_examId: { userId: user.id, examId } },
    });

    if (existingAttempt) {
      if (existingAttempt.status === 'IN_PROGRESS') {
        return apiError(
          'You have an active exam attempt in progress',
          409,
        );
      }

      if (!exam.allowRetake) {
        return apiError('You have already completed this exam', 409);
      }
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + exam.timeLimit * 60 * 1000);

    const attempt = await (existingAttempt
      ? db.examAttempt.update({
          where: { id: existingAttempt.id },
          data: {
            startTime: now,
            expiresAt,
            status: 'IN_PROGRESS',
            score: null,
            correctCount: null,
            wrongCount: null,
            unattempted: null,
            tabSwitches: 0,
            submittedAt: null,
            totalMarks: exam.totalMarks,
          },
        })
      : db.examAttempt.create({
          data: {
            userId: user.id,
            examId,
            startTime: now,
            expiresAt,
            totalMarks: exam.totalMarks,
          },
        }));

    return apiSuccess(
      {
        attemptId: attempt.id,
        timeLimit: exam.timeLimit,
        expiresAt: attempt.expiresAt,
        totalQuestions: exam._count.questions,
        totalMarks: exam.totalMarks,
        message: 'Exam started successfully',
      },
      201,
    );
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    console.error('Start exam error:', error);
    return apiError('Failed to start exam', 500);
  }
}
