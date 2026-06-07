import { NextRequest } from 'next/server';
import { db } from '@ris-academy/db';
import { apiSuccess, apiError, requireAdmin, AuthError } from '@/lib/api-utils';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requireAdmin();

    const chapterId = params.id;
    const existing = await db.chapter.findUnique({ where: { id: chapterId } });
    if (!existing) return apiError('Chapter not found', 404);

    const body = await req.json();
    const { title, description, videoUrl, duration, order } = body;

    if (!title || !videoUrl || order === undefined) {
      return apiError('Title, videoUrl, and order are required', 400);
    }

    const video = await db.video.create({
      data: {
        title,
        description,
        videoUrl,
        duration,
        order,
        chapterId,
      },
    });

    return apiSuccess(video, 201);
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    console.error('Admin create video error:', error);
    return apiError('Failed to create video', 500);
  }
}
