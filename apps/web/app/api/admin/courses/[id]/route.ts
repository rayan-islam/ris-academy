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
    const { title, description, thumbnail, subject, type, price, instructorName, instructorBio, isPublished } = body;

    const existing = await db.course.findUnique({ where: { id: params.id } });
    if (!existing) return apiError('Course not found', 404);

    const course = await db.course.update({
      where: { id: params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(thumbnail !== undefined && { thumbnail }),
        ...(subject !== undefined && { subject }),
        ...(type !== undefined && { type }),
        ...(price !== undefined && { price }),
        ...(instructorName !== undefined && { instructorName }),
        ...(instructorBio !== undefined && { instructorBio }),
        ...(isPublished !== undefined && { isPublished }),
      },
    });

    return apiSuccess(course);
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    console.error('Admin update course error:', error);
    return apiError('Failed to update course', 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requireAdmin();

    const existing = await db.course.findUnique({ where: { id: params.id } });
    if (!existing) return apiError('Course not found', 404);

    await db.course.delete({ where: { id: params.id } });

    return apiSuccess({ message: 'Course deleted' });
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    console.error('Admin delete course error:', error);
    return apiError('Failed to delete course', 500);
  }
}
