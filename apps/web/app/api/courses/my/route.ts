import { NextRequest } from 'next/server';
import { db } from '@ris-academy/db';
import { apiSuccess, apiError, requireAuth, AuthError } from '@/lib/api-utils';

export async function GET() {
  try {
    const user = await requireAuth();

    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      const courses = await db.course.findMany({
        select: {
          id: true,
          title: true,
          subject: true,
          type: true,
          price: true,
          isPublished: true,
          thumbnail: true,
          _count: { select: { enrollments: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      return apiSuccess({ courses, role: user.role });
    }

    const enrollments = await db.enrollment.findMany({
      where: { userId: user.id },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            subject: true,
            thumbnail: true,
            type: true,
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    });

    const courses = enrollments.map((e) => ({
      id: e.course.id,
      title: e.course.title,
      subject: e.course.subject,
      thumbnail: e.course.thumbnail,
      type: e.course.type,
      progress: e.progress,
      completed: e.completed,
      enrolledAt: e.enrolledAt,
    }));

    return apiSuccess({ courses, role: user.role });
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    console.error('My Courses error:', error);
    return apiError('Failed to fetch courses', 500);
  }
}
