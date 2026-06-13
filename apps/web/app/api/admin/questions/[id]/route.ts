import { NextRequest } from 'next/server';
import { db } from '@ris-academy/db';
import { apiSuccess, apiError, requireAdmin, AuthError } from '@/lib/api-utils';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requireAdmin();

    const body = await req.json();
    const { stem, imageUrl, optionA, optionB, optionC, optionD, correctAnswer, explanation, difficulty, marks, order, questionType } = body;

    const existing = await db.question.findUnique({ where: { id: params.id } });
    if (!existing) return apiError('Question not found', 404);

    const question = await db.question.update({
      where: { id: params.id },
      data: {
        ...(stem !== undefined && { stem }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(optionA !== undefined && { optionA }),
        ...(optionB !== undefined && { optionB }),
        ...(optionC !== undefined && { optionC }),
        ...(optionD !== undefined && { optionD }),
        ...(correctAnswer !== undefined && { correctAnswer }),
        ...(explanation !== undefined && { explanation }),
        ...(difficulty !== undefined && { difficulty }),
        ...(questionType !== undefined && { questionType }),
        ...(marks !== undefined && { marks }),
        ...(order !== undefined && { order }),
      },
    });

    return apiSuccess(question);
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    console.error('Admin update question error:', error);
    return apiError('Failed to update question', 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requireAdmin();

    const existing = await db.question.findUnique({ where: { id: params.id } });
    if (!existing) return apiError('Question not found', 404);

    await db.question.delete({ where: { id: params.id } });

    return apiSuccess({ message: 'Question deleted' });
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    console.error('Admin delete question error:', error);
    return apiError('Failed to delete question', 500);
  }
}
