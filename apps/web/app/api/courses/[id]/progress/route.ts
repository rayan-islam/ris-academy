import { NextRequest } from 'next/server';
import { db } from '@ris-academy/db';
import { apiSuccess, apiError, requireAuth, AuthError } from '@/lib/api-utils';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await requireAuth();

    const courseId = params.id;

    const enrollment = await db.enrollment.findUnique({
      where: { userId_courseId: { userId: user.id, courseId } },
      include: {
        course: {
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
                    duration: true,
                    order: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!enrollment) {
      return apiError('Not enrolled in this course', 404);
    }

    const videoProgress = await db.videoProgress.findMany({
      where: {
        userId: user.id,
        video: { chapter: { courseId } },
      },
    });

    const totalVideos = enrollment.course.chapters.reduce(
      (sum, ch) => sum + ch.videos.length,
      0,
    );
    const watchedVideos = videoProgress.filter((vp) => vp.completed).length;

    const progressPercent =
      totalVideos > 0 ? Math.round((watchedVideos / totalVideos) * 100) : 0;

    return apiSuccess({
      enrollment: {
        id: enrollment.id,
        progress: enrollment.progress,
        completed: enrollment.completed,
        enrolledAt: enrollment.enrolledAt,
        completedAt: enrollment.completedAt,
      },
      totalVideos,
      watchedVideos,
      progressPercent,
      videoProgress: videoProgress.map((vp) => ({
        videoId: vp.videoId,
        watchedSeconds: vp.watchedSeconds,
        completed: vp.completed,
        updatedAt: vp.updatedAt,
      })),
    });
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    console.error('Progress error:', error);
    return apiError('Failed to fetch progress', 500);
  }
}
