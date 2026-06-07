import { NextRequest } from 'next/server';
import { db } from '@ris-academy/db';
import { apiSuccess, apiError, requireAuth, AuthError } from '@/lib/api-utils';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await requireAuth();

    const videoId = params.id;
    const body = await req.json();
    const { watchedSeconds } = body;

    if (typeof watchedSeconds !== 'number' || watchedSeconds < 0) {
      return apiError('Invalid watchedSeconds', 400);
    }

    const video = await db.video.findUnique({ where: { id: videoId } });
    if (!video) {
      return apiError('Video not found', 404);
    }

    const completed =
      video.duration
        ? watchedSeconds >= video.duration * 0.8
        : false;

    const videoProgress = await db.videoProgress.upsert({
      where: { userId_videoId: { userId: user.id, videoId } },
      update: {
        watchedSeconds,
        completed,
      },
      create: {
        userId: user.id,
        videoId,
        watchedSeconds,
        completed,
      },
    });

    const chapter = await db.chapter.findUnique({
      where: { id: video.chapterId },
      include: {
        videos: {
          where: { isPublished: true },
          select: { id: true },
        },
      },
    });

    if (chapter) {
      const allVideoProgress = await db.videoProgress.findMany({
        where: {
          userId: user.id,
          videoId: { in: chapter.videos.map((v) => v.id) },
        },
      });

      const completedVideos = allVideoProgress.filter((vp) => vp.completed).length;
      const chapterProgress =
        chapter.videos.length > 0
          ? (completedVideos / chapter.videos.length) * 100
          : 0;

      const course = await db.course.findUnique({
        where: { id: chapter.courseId },
        include: {
          chapters: {
            include: {
              videos: {
                where: { isPublished: true },
                select: { id: true },
              },
            },
          },
        },
      });

      if (course) {
        const allVideoIds = course.chapters.flatMap((ch) =>
          ch.videos.map((v) => v.id),
        );

        const allProgress = await db.videoProgress.findMany({
          where: {
            userId: user.id,
            videoId: { in: allVideoIds },
          },
        });

        const totalVideos = allVideoIds.length;
        const totalCompleted = allProgress.filter((vp) => vp.completed).length;
        const totalProgress =
          totalVideos > 0 ? (totalCompleted / totalVideos) * 100 : 0;

        await db.enrollment.upsert({
          where: {
            userId_courseId: { userId: user.id, courseId: chapter.courseId },
          },
          update: { progress: totalProgress },
          create: {
            userId: user.id,
            courseId: chapter.courseId,
            progress: totalProgress,
          },
        });
      }
    }

    return apiSuccess({
      videoProgress: {
        id: videoProgress.id,
        videoId: videoProgress.videoId,
        watchedSeconds: videoProgress.watchedSeconds,
        completed: videoProgress.completed,
        updatedAt: videoProgress.updatedAt,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    console.error('Video progress error:', error);
    return apiError('Failed to update video progress', 500);
  }
}
