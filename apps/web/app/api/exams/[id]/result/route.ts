import { NextRequest } from 'next/server';
import { db } from '@ris-academy/db';
import { apiSuccess, apiError, requireAuth, AuthError } from '@/lib/api-utils';

export async function GET(
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
            },
          },
        },
        answers: {
          include: {
            question: {
              select: {
                id: true,
                stem: true,
                optionA: true,
                optionB: true,
                optionC: true,
                optionD: true,
                correctAnswer: true,
                explanation: true,
                marks: true,
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      return apiError('No attempt found for this exam', 404);
    }

    if (attempt.status === 'IN_PROGRESS') {
      return apiError('Exam is still in progress', 400);
    }

    const allAttempts = await db.examAttempt.findMany({
      where: {
        examId: params.id,
        status: { in: ['COMPLETED', 'TIMEOUT'] },
      },
      orderBy: { score: 'desc' },
    });

    const rank =
      allAttempts.findIndex((a) => a.id === attempt.id) + 1;

    return apiSuccess({
      attempt: {
        id: attempt.id,
        status: attempt.status,
        score: attempt.score,
        totalMarks: attempt.totalMarks,
        correctCount: attempt.correctCount,
        wrongCount: attempt.wrongCount,
        unattempted: attempt.unattempted,
        startTime: attempt.startTime,
        endTime: attempt.endTime,
        submittedAt: attempt.submittedAt,
      },
      exam: {
        id: attempt.exam.id,
        title: attempt.exam.title,
        subject: attempt.exam.subject,
        totalMarks: attempt.exam.totalMarks,
        passPercentage: attempt.exam.passPercentage,
        negativeMarking: attempt.exam.negativeMarking,
      },
      answers: attempt.answers.map((a) => ({
        questionId: a.questionId,
        stem: a.question.stem,
        options: {
          A: a.question.optionA,
          B: a.question.optionB,
          C: a.question.optionC,
          D: a.question.optionD,
        },
        selectedAnswer: a.selectedAnswer,
        correctAnswer: a.question.correctAnswer,
        isCorrect: a.isCorrect,
        explanation: a.question.explanation,
        marks: a.question.marks,
        isFlagged: a.isFlagged,
      })),
      rank,
      totalParticipants: allAttempts.length,
      passed:
        attempt.score !== null &&
        attempt.totalMarks > 0 &&
        (attempt.score / attempt.totalMarks) * 100 >= attempt.exam.passPercentage,
    });
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    console.error('Exam result error:', error);
    return apiError('Failed to fetch exam result', 500);
  }
}
