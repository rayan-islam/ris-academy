import { NextRequest } from 'next/server';
import { db } from '@ris-academy/db';
import { apiSuccess, apiError } from '@/lib/api-utils';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  const user = await db.user.findUnique({ where: { email: session.user.email } });
  return user;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError('Authentication required', 401);
    }

    const exam = await db.exam.findUnique({
      where: { id: params.id },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            stem: true,
            optionA: true,
            optionB: true,
            optionC: true,
            optionD: true,
            difficulty: true,
            marks: true,
            order: true,
          },
        },
      },
    });

    if (!exam || !exam.isPublished) {
      return apiError('Exam not found', 404);
    }

    const existingAttempt = await db.examAttempt.findUnique({
      where: { userId_examId: { userId: user.id, examId: params.id } },
    });

    return apiSuccess({
      ...exam,
      existingAttempt: existingAttempt
        ? {
            id: existingAttempt.id,
            status: existingAttempt.status,
            score: existingAttempt.score,
            startTime: existingAttempt.startTime,
            endTime: existingAttempt.endTime,
          }
        : null,
    });
  } catch (error) {
    console.error('Exam detail error:', error);
    return apiError('Failed to fetch exam', 500);
  }
}
