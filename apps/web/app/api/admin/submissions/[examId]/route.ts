import { NextRequest } from 'next/server';
import { db } from '@ris-academy/db';
import { apiSuccess, apiError, requireAdmin, AuthError } from '@/lib/api-utils';

export async function GET(
  req: NextRequest,
  { params }: { params: { examId: string } },
) {
  try {
    await requireAdmin();

    const { searchParams } = req.nextUrl;
    const status = searchParams.get('status');

    const existing = await db.exam.findUnique({ where: { id: params.examId } });
    if (!existing) return apiError('Exam not found', 404);

    const where: Record<string, unknown> = { examId: params.examId };
    if (status) {
      where.status = status;
    }

    const attempts = await db.examAttempt.findMany({
      where: where as any,
      orderBy: { startTime: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            institution: true,
            hscYear: true,
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
                marks: true,
              },
            },
          },
        },
        writtenSubmission: true,
      },
    });

    return apiSuccess(attempts);
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    console.error('Admin submissions error:', error);
    return apiError('Failed to fetch submissions', 500);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { examId: string } },
) {
  try {
    const admin = await requireAdmin();

    const attemptId = params.examId;

    const body = await req.json();
    const { awardedMarks, teacherNotes } = body as {
      awardedMarks: number;
      teacherNotes?: string;
    };

    if (awardedMarks === undefined || typeof awardedMarks !== 'number') {
      return apiError('awardedMarks is required', 400);
    }

    const existing = await db.writtenSubmission.findUnique({
      where: { attemptId },
      include: {
        attempt: {
          include: {
            exam: true,
            user: true,
          },
        },
      },
    });

    if (!existing) {
      return apiError('Submission not found', 404);
    }

    const awardedScore = awardedMarks;

    await db.writtenSubmission.update({
      where: { attemptId },
      data: {
        awardedMarks: awardedScore,
        teacherNotes: teacherNotes || null,
        reviewedBy: admin.id,
        reviewedAt: new Date(),
      },
    });

    await db.examAttempt.update({
      where: { id: attemptId },
      data: {
        score: awardedScore,
      },
    });

    await db.notification.create({
      data: {
        userId: existing.attempt.userId,
        title: 'Exam Graded',
        message: `Your exam "${existing.attempt.exam.title}" has been graded. You scored ${awardedScore}/${existing.attempt.exam.totalMarks}.`,
        type: 'EXAM_RESULT',
        link: `/exams/${existing.attempt.examId}/result`,
      },
    });

    return apiSuccess({ message: 'Grades saved' });
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    console.error('Grade submission error:', error);
    return apiError('Failed to save grades', 500);
  }
}
