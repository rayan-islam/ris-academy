import { NextRequest } from 'next/server';
import { db } from '@ris-academy/db';
import { apiSuccess, apiError, requireAdmin, AuthError } from '@/lib/api-utils';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requireAdmin();

    const courseId = params.id;
    const existing = await db.course.findUnique({ where: { id: courseId } });
    if (!existing) return apiError('Course not found', 404);

    const body = await req.json();
    const { title, order } = body;

    if (!title || order === undefined) {
      return apiError('Title and order are required', 400);
    }

    const chapter = await db.chapter.create({
      data: {
        title,
        order,
        courseId,
      },
    });

    return apiSuccess(chapter, 201);
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    console.error('Admin create chapter error:', error);
    return apiError('Failed to create chapter', 500);
  }
}
