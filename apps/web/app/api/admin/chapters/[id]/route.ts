import { NextRequest } from 'next/server';
import { db } from '@ris-academy/db';
import { apiSuccess, apiError, requireAdmin, AuthError } from '@/lib/api-utils';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();

    const body = await req.json();
    const { title, order } = body;

    const existing = await db.chapter.findUnique({ where: { id: params.id } });
    if (!existing) return apiError('Chapter not found', 404);

    const chapter = await db.chapter.update({
      where: { id: params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(order !== undefined && { order }),
      },
    });

    return apiSuccess(chapter);
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    console.error('Admin update chapter error:', error);
    return apiError('Failed to update chapter', 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();

    const existing = await db.chapter.findUnique({ where: { id: params.id } });
    if (!existing) return apiError('Chapter not found', 404);

    await db.chapter.delete({ where: { id: params.id } });

    return apiSuccess({ message: 'Chapter deleted' });
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    console.error('Admin delete chapter error:', error);
    return apiError('Failed to delete chapter', 500);
  }
}
