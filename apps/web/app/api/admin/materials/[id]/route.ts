import { NextRequest } from 'next/server';
import { db } from '@ris-academy/db';
import { apiSuccess, apiError, requireAdmin, AuthError } from '@/lib/api-utils';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();

    const body = await req.json();
    const { title, fileUrl, fileType, fileSize, subject, chapter } = body;

    const existing = await db.material.findUnique({ where: { id: params.id } });
    if (!existing) return apiError('Material not found', 404);

    const material = await db.material.update({
      where: { id: params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(fileUrl !== undefined && { fileUrl }),
        ...(fileType !== undefined && { fileType }),
        ...(fileSize !== undefined && { fileSize }),
        ...(subject !== undefined && { subject }),
        ...(chapter !== undefined && { chapter }),
      },
      include: {
        user: { select: { name: true } },
      },
    });

    return apiSuccess(material);
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    console.error('Materials update error:', error);
    return apiError('Failed to update material', 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();

    const existing = await db.material.findUnique({ where: { id: params.id } });
    if (!existing) return apiError('Material not found', 404);

    await db.material.delete({ where: { id: params.id } });

    return apiSuccess({ deleted: true });
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    console.error('Materials delete error:', error);
    return apiError('Failed to delete material', 500);
  }
}
