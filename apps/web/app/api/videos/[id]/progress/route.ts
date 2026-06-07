import { NextRequest } from 'next/server';
import { db } from '@ris-academy/db';
import { apiSuccess, apiError, requireAuth, AuthError } from '@/lib/api-utils';
import { generateCertificateHTML, generateCertificateNumber, saveCertificate } from '@/lib/certificates';
import { formatDate } from '@/lib/utils';

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

      let courseProgress = 0;
      let courseCompleted = false;

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

        courseProgress = totalProgress;

        await db.course.update({
          where: { id: course.id },
          data: { totalVideos },
        });

        const enrollment = await db.enrollment.upsert({
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

        if (totalProgress >= 100 && !enrollment.completed) {
          await db.enrollment.update({
            where: { id: enrollment.id },
            data: { completed: true, completedAt: new Date() },
          });

          courseCompleted = true;

          const certificateNumber = generateCertificateNumber();
          const completionDate = formatDate(new Date());
          const certificateHtml = generateCertificateHTML({
            studentName: user.name || 'Student',
            courseName: course.title,
            completionDate,
            certificateNumber,
          });
          const certificateUrl = await saveCertificate(certificateHtml, certificateNumber);

          await db.certificate.create({
            data: {
              userId: user.id,
              courseId: course.id,
              certificateNumber,
              pdfUrl: certificateUrl,
            },
          });

          await db.notification.createMany({
            data: [
              {
                userId: user.id,
                title: 'Course Completed!',
                message: `Congratulations! You have successfully completed "${course.title}".`,
                type: 'EXAM_RESULT',
                link: `/certificates`,
              },
              {
                userId: user.id,
                title: 'Certificate Earned',
                message: `You've earned a certificate for completing "${course.title}"! View it in your certificates.`,
                type: 'GENERAL',
                link: certificateUrl,
              },
            ],
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
        courseProgress: {
          percentage: Math.round(courseProgress * 100) / 100,
          courseCompleted,
        },
      });
    }
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    console.error('Video progress error:', error);
    return apiError('Failed to update video progress', 500);
  }
}
