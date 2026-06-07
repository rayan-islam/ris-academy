import { NextRequest } from 'next/server';
import { db } from '@ris-academy/db';
import { apiSuccess, apiError, requireAuth, AuthError } from '@/lib/api-utils';

export async function GET() {
  try {
    const user = await requireAuth();

    const [enrollments, upcomingExams, recentActivity, averageScoreResult] =
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
      ]);

    const enrolledCoursesCount = enrollments.length;
    const completedCoursesCount = enrollments.filter((e) => e.completed).length;

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
    });
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    console.error('Dashboard error:', error);
    return apiError('Failed to fetch dashboard data', 500);
  }
}
