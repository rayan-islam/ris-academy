import { NextRequest } from 'next/server';
import { db } from '@ris-academy/db';
import { apiSuccess, apiError, requireAuth, AuthError } from '@/lib/api-utils';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await requireAuth();

    const courseId = params.id;

    const course = await db.course.findUnique({ where: { id: courseId } });
    if (!course || !course.isPublished) {
      return apiError('Course not found', 404);
    }

    const existingEnrollment = await db.enrollment.findUnique({
      where: { userId_courseId: { userId: user.id, courseId } },
    });

    if (existingEnrollment) {
      return apiError('Already enrolled in this course', 409);
    }

    if (course.type === 'FREE') {
      const enrollment = await db.enrollment.create({
        data: {
          userId: user.id,
          courseId,
        },
      });

      return apiSuccess(
        {
          enrollment: {
            id: enrollment.id,
            progress: enrollment.progress,
            completed: enrollment.completed,
            enrolledAt: enrollment.enrolledAt,
          },
          message: 'Successfully enrolled in the course',
        },
        201,
      );
    }

    return apiSuccess(
      {
        message: 'This is a paid course. Please complete the payment to enroll.',
        courseId,
        price: course.price,
        requiresPayment: true,
      },
    );
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    console.error('Enroll error:', error);
    return apiError('Failed to enroll in course', 500);
  }
}
