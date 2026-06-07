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
    const { title, description, videoUrl, duration, order, isPublished } = body;

    const existing = await db.video.findUnique({ where: { id: params.id } });
    if (!existing) return apiError('Video not found', 404);

    const video = await db.video.update({
      where: { id: params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(videoUrl !== undefined && { videoUrl }),
        ...(duration !== undefined && { duration }),
        ...(order !== undefined && { order }),
        ...(isPublished !== undefined && { isPublished }),
      },
    });

    return apiSuccess(video);
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    console.error('Admin update video error:', error);
    return apiError('Failed to update video', 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requireAdmin();

    const existing = await db.video.findUnique({ where: { id: params.id } });
    if (!existing) return apiError('Video not found', 404);

    await db.video.delete({ where: { id: params.id } });

    return apiSuccess({ message: 'Video deleted' });
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    console.error('Admin delete video error:', error);
    return apiError('Failed to delete video', 500);
  }
}
