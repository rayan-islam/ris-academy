import { NextRequest } from 'next/server';
import { db } from '@ris-academy/db';
import { apiSuccess, apiError } from '@/lib/api-utils';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  return db.user.findUnique({ where: { email: session.user.email } });
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;
    const user = await getCurrentUser();

    const course = await db.course.findUnique({
      where: { id },
      include: {
        chapters: {
          orderBy: { order: 'asc' },
          include: {
            videos: {
              orderBy: { order: 'asc' },
              where: { isPublished: true },
              select: {
                id: true,
                title: true,
                description: true,
                videoUrl: true,
                duration: true,
                order: true,
                chapterId: true,
              },
            },
          },
        },
      },
    });

    if (!course) {
      return apiError('Course not found', 404);
    }

    let enrollment = null;
    if (user) {
      enrollment = await db.enrollment.findUnique({
        where: { userId_courseId: { userId: user.id, courseId: id } },
      });
    }

    return apiSuccess({
      ...course,
      enrollment: enrollment
        ? {
            id: enrollment.id,
            progress: enrollment.progress,
            completed: enrollment.completed,
            enrolledAt: enrollment.enrolledAt,
          }
        : null,
    });
  } catch (error) {
    console.error('Course detail error:', error);
    return apiError('Failed to fetch course', 500);
  }
}
