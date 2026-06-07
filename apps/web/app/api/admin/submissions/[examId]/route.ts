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
