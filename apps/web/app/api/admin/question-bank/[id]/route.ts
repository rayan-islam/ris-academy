import { NextRequest } from 'next/server';
import { db } from '@ris-academy/db';
import { apiSuccess, apiError, requireAdmin, AuthError } from '@/lib/api-utils';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();

    const body = await req.json();
    const { stem, optionA, optionB, optionC, optionD, correctAnswer, explanation, difficulty, subject, chapter } = body;

    const existing = await db.questionBank.findUnique({ where: { id: params.id } });
    if (!existing) return apiError('Question not found', 404);

    const question = await db.questionBank.update({
      where: { id: params.id },
      data: {
        ...(stem !== undefined && { stem }),
        ...(optionA !== undefined && { optionA }),
        ...(optionB !== undefined && { optionB }),
        ...(optionC !== undefined && { optionC }),
        ...(optionD !== undefined && { optionD }),
        ...(correctAnswer !== undefined && { correctAnswer }),
        ...(explanation !== undefined && { explanation }),
        ...(difficulty !== undefined && { difficulty }),
        ...(subject !== undefined && { subject }),
        ...(chapter !== undefined && { chapter }),
      },
    });

    return apiSuccess(question);
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    console.error('Question Bank update error:', error);
    return apiError('Failed to update question', 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();

    const existing = await db.questionBank.findUnique({ where: { id: params.id } });
    if (!existing) return apiError('Question not found', 404);

    await db.questionBank.delete({ where: { id: params.id } });

    return apiSuccess({ deleted: true });
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    console.error('Question Bank delete error:', error);
    return apiError('Failed to delete question', 500);
  }
}
