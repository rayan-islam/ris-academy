import { NextRequest } from 'next/server';
import { db } from '@ris-academy/db';
import { apiSuccess, apiError, requireAdmin, AuthError } from '@/lib/api-utils';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requireAdmin();

    const course = await db.course.findUnique({
      where: { id: params.id },
      include: {
        chapters: {
          orderBy: { order: 'asc' },
          include: {
            videos: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });

    if (!course) return apiError('Course not found', 404);

    return apiSuccess(course);
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    console.error('Admin course detail error:', error);
    return apiError('Failed to fetch course', 500);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requireAdmin();

    const body = await req.json();
    const existing = await db.course.findUnique({ where: { id: params.id } });
    if (!existing) return apiError('Course not found', 404);

    const course = await db.course.update({
      where: { id: params.id },
      data: {
        ...(body.isPublished !== undefined && { isPublished: body.isPublished }),
        ...(body.title !== undefined && { title: body.title }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.thumbnail !== undefined && { thumbnail: body.thumbnail }),
        ...(body.subject !== undefined && { subject: body.subject }),
        ...(body.type !== undefined && { type: body.type }),
        ...(body.price !== undefined && { price: body.price }),
        ...(body.instructorName !== undefined && { instructorName: body.instructorName }),
        ...(body.instructorBio !== undefined && { instructorBio: body.instructorBio }),
      },
    });

    return apiSuccess(course);
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    console.error('Admin patch course error:', error);
    return apiError('Failed to update course', 500);
  }
}

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
