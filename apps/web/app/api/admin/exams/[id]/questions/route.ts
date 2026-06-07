import { NextRequest } from 'next/server';
import { db } from '@ris-academy/db';
import { apiSuccess, apiError, requireAdmin, AuthError } from '@/lib/api-utils';
import { questionCreateSchema } from '@/lib/validators';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requireAdmin();

    const examId = params.id;
    const existing = await db.exam.findUnique({ where: { id: examId } });
    if (!existing) return apiError('Exam not found', 404);

    const body = await req.json();

    const questionList = body.questions || (body.stem ? [body] : null);

    if (!questionList || !Array.isArray(questionList) || questionList.length === 0) {
      return apiError('Questions array is required', 400);
    }

    const maxOrderResult = await db.question.findFirst({
      where: { examId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    let nextOrder = (maxOrderResult?.order ?? -1) + 1;

    const createdQuestions = [];
    for (const q of questionList) {
      const parsed = questionCreateSchema.safeParse({
        ...q,
        order: q.order !== undefined ? q.order : nextOrder,
      });
      if (!parsed.success) {
        return apiError(
          `Invalid question: ${parsed.error.errors.map((e) => e.message).join(', ')}`,
          422,
        );
      }

      const question = await db.question.create({
        data: {
          ...parsed.data,
          examId,
        },
      });
      createdQuestions.push(question);
      nextOrder++;
    }

    return apiSuccess(createdQuestions, 201);
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    console.error('Admin create questions error:', error);
    return apiError('Failed to create questions', 500);
  }
}
