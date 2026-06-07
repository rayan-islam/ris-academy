import { NextRequest } from 'next/server';
import { db } from '@ris-academy/db';
import { apiSuccess, apiError, requireAuth, AuthError } from '@/lib/api-utils';

export async function GET() {
  try {
    const user = await requireAuth();

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      enrollments,
      upcomingExams,
      recentActivity,
      averageScoreResult,
      certificatesCount,
      totalStudyTimeResult,
      weeklyVideoProgress,
    ] =
      await Promise.all([
        db.enrollment.findMany({
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
        }),

        db.exam.findMany({
          where: {
            isPublished: true,
            attempts: {
              none: {
                userId: user.id,
                status: { in: ['COMPLETED', 'TIMEOUT'] },
              },
            },
          },
          select: {
            id: true,
            title: true,
            subject: true,
            timeLimit: true,
            totalMarks: true,
            passPercentage: true,
            _count: { select: { questions: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),

        (async () => {
          const [recentExams, recentNotifications] = await Promise.all([
            db.examAttempt.findMany({
              where: { userId: user.id },
              orderBy: { startTime: 'desc' },
              take: 5,
              include: {
                exam: {
                  select: { id: true, title: true, subject: true },
                },
              },
            }),
            db.notification.findMany({
              where: { userId: user.id },
              orderBy: { createdAt: 'desc' },
              take: 5,
            }),
          ]);

          const activities: {
            type: string;
            title: string;
            description: string;
            timestamp: Date;
            link?: string;
          }[] = [];

          for (const attempt of recentExams) {
            activities.push({
              type: 'exam',
              title: 'Exam Attempt',
              description:
                attempt.status === 'COMPLETED'
                  ? `Scored ${attempt.score}/${attempt.totalMarks} in ${attempt.exam.title}`
                  : `Attempted ${attempt.exam.title}`,
              timestamp: attempt.startTime,
              link: `/exams/${attempt.examId}`,
            });
          }

          for (const notif of recentNotifications) {
            activities.push({
              type: 'notification',
              title: notif.title,
              description: notif.message,
              timestamp: notif.createdAt,
              link: notif.link || undefined,
            });
          }

          return activities
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, 10);
        })(),

        db.examAttempt.aggregate({
          where: {
            userId: user.id,
            status: { in: ['COMPLETED', 'TIMEOUT'] },
            score: { not: null },
          },
          _avg: { score: true },
        }),

        db.certificate.count({ where: { userId: user.id } }),

        db.videoProgress.aggregate({
          where: { userId: user.id },
          _sum: { watchedSeconds: true },
        }),

        db.videoProgress.findMany({
          where: {
            userId: user.id,
            updatedAt: { gte: sevenDaysAgo },
          },
          select: { updatedAt: true, watchedSeconds: true },
        }),
      ]);

    const enrolledCoursesCount = enrollments.length;
    const completedCoursesCount = enrollments.filter((e) => e.completed).length;

    const totalStudySeconds = totalStudyTimeResult._sum.watchedSeconds ?? 0;
    const totalStudyTime = Math.round(totalStudySeconds / 60);

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyActivityMap: Record<string, number> = {};

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      weeklyActivityMap[key] = 0;
    }

    for (const vp of weeklyVideoProgress) {
      const key = vp.updatedAt.toISOString().slice(0, 10);
      if (key in weeklyActivityMap) {
        const current = weeklyActivityMap[key];
        if (current !== undefined) {
          weeklyActivityMap[key] = current + vp.watchedSeconds;
        }
      }
    }

    const weeklyActivity = Object.entries(weeklyActivityMap).map(([dateKey, seconds]) => {
      const d = new Date(dateKey + 'T00:00:00');
      return {
        day: dayNames[d.getDay()],
        date: dateKey,
        minutes: Math.round(seconds / 60),
      };
    });

    let studyStreak = 0;
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const val = weeklyActivityMap[key];
      if (val !== undefined && val > 0) {
        studyStreak++;
      }
    }

    const enrolledCoursesList = enrollments.map((e) => ({
      id: e.course.id,
      title: e.course.title,
      subject: e.course.subject,
      thumbnail: e.course.thumbnail,
      type: e.course.type,
      progress: e.progress,
      completed: e.completed,
      enrolledAt: e.enrolledAt,
    }));

    return apiSuccess({
      enrolledCourses: enrolledCoursesCount,
      completedCourses: completedCoursesCount,
      upcomingExams: upcomingExams.map((ex) => ({
        ...ex,
        totalQuestions: ex._count.questions,
        _count: undefined,
      })),
      averageScore: averageScoreResult._avg.score
        ? Math.round(averageScoreResult._avg.score * 100) / 100
        : 0,
      recentActivity,
      enrolledCoursesList,
      certificatesEarned: certificatesCount,
      totalStudyTime,
      studyStreak,
      weeklyActivity,
    });
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    console.error('Dashboard error:', error);
    return apiError('Failed to fetch dashboard data', 500);
  }
}
