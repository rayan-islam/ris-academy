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
    });

    if (!attempt || attempt.status !== 'IN_PROGRESS') {
      return apiError('No active exam attempt found', 404);
    }

    const body = await req.json();
    const { answers } = body as {
      answers: { questionId: string; content: string }[];
    };

    if (!Array.isArray(answers)) {
      return apiError('Invalid answers format', 400);
    }

    const answersJson = JSON.stringify(answers);

    await db.writtenSubmission.upsert({
      where: { attemptId: attempt.id },
      create: {
        attemptId: attempt.id,
        content: answersJson,
      },
      update: {
        content: answersJson,
      },
    });

    return apiSuccess({ saved: true });
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    console.error('Auto-save error:', error);
    return apiError('Failed to auto-save', 500);
  }
}
