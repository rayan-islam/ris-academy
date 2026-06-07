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

    const attempt = await db.examAttempt.findUnique({
      where: { userId_examId: { userId: user.id, examId } },
      include: {
        exam: {
          include: {
            questions: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
                correctAnswer: true,
                marks: true,
              },
            },
          },
        },
      },
    });

    if (!attempt || attempt.status !== 'IN_PROGRESS') {
      return apiError('No active exam attempt found', 404);
    }

    const body = await req.json();
    const { answers } = body as {
      answers: { questionId: string; selectedAnswer: string | null }[];
    };

    if (!Array.isArray(answers)) {
      return apiError('Invalid answers format', 400);
    }

    const now = new Date();
    const isTimeout = now > attempt.expiresAt;
    const status = isTimeout ? 'TIMEOUT' : 'COMPLETED';

    let correctCount = 0;
    let wrongCount = 0;
    let unattempted = 0;
    let totalEarned = 0;

    const questionMap = new Map(
      attempt.exam.questions.map((q) => [q.id, q]),
    );

    for (const answer of answers) {
      const question = questionMap.get(answer.questionId);

      if (!answer.selectedAnswer || answer.selectedAnswer === null) {
        unattempted++;

        await db.mCQAnswer.upsert({
          where: {
            attemptId_questionId: {
              attemptId: attempt.id,
              questionId: answer.questionId,
            },
          },
          update: {
            selectedAnswer: null,
            isCorrect: null,
          },
          create: {
            attemptId: attempt.id,
            questionId: answer.questionId,
            selectedAnswer: null,
            isCorrect: null,
          },
        });
        continue;
      }

      const isCorrect =
        question && answer.selectedAnswer === question.correctAnswer;

      totalEarned += isCorrect && question ? question.marks : 0;

      if (isCorrect) {
        correctCount++;
      } else {
        wrongCount++;
      }

      await db.mCQAnswer.upsert({
        where: {
          attemptId_questionId: {
            attemptId: attempt.id,
            questionId: answer.questionId,
          },
        },
        update: {
          selectedAnswer: answer.selectedAnswer,
          isCorrect,
        },
        create: {
          attemptId: attempt.id,
          questionId: answer.questionId,
          selectedAnswer: answer.selectedAnswer,
          isCorrect,
        },
      });
    }

    const negativeDeduction =
      attempt.exam.negativeMarking
        ? wrongCount * attempt.exam.negativeMarking
        : 0;
    const score = isTimeout ? 0 : Math.max(0, totalEarned - negativeDeduction);

    await db.examAttempt.update({
      where: { id: attempt.id },
      data: {
        status,
        score,
        correctCount,
        wrongCount,
        unattempted,
        submittedAt: now,
        endTime: now,
        ...(isTimeout && { status: 'TIMEOUT' as const }),
      },
    });

    return apiSuccess({
      attemptId: attempt.id,
      status,
      totalMarks: attempt.exam.totalMarks,
      score,
      correctCount,
      wrongCount,
      unattempted,
      message: isTimeout
        ? 'Time is up! Your exam was submitted with a score of 0.'
        : 'Exam submitted successfully',
    });
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    console.error('Submit exam error:', error);
    return apiError('Failed to submit exam', 500);
  }
}
