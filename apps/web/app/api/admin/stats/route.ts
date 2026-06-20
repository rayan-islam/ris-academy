import { NextRequest } from 'next/server';
import { db } from '@ris-academy/db';
import { apiSuccess, apiError, requireAdmin, AuthError } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const [
      totalUsers,
      totalStudents,
      totalCourses,
      totalExams,
      aggregatePayment,
      activeStudents,
      recentEnrollments,
      popularCourses,
      paymentByMonth,
      totalCertificates,
    ] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { role: 'STUDENT' } }),
      db.course.count(),
      db.exam.count(),
      db.payment.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      db.user.count({ where: { role: 'STUDENT', isActive: true } }),
      db.enrollment.findMany({
        take: 10,
        orderBy: { enrolledAt: 'desc' },
        select: {
          id: true,
          user: { select: { name: true } },
          course: { select: { title: true } },
          enrolledAt: true,
        },
      }),
      db.course.findMany({
        take: 5,
        orderBy: { enrollments: { _count: 'desc' } },
        select: {
          id: true,
          title: true,
          subject: true,
          type: true,
          _count: { select: { enrollments: true } },
        },
      }),
      db.payment.findMany({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) },
        },
        select: { amount: true, createdAt: true },
      }),
      db.certificate.count(),
    ]);

    const monthlyRevenue: Record<string, number> = {};
    for (const payment of paymentByMonth) {
      const key = `${payment.createdAt.getFullYear()}-${String(payment.createdAt.getMonth() + 1).padStart(2, '0')}`;
      monthlyRevenue[key] = (monthlyRevenue[key] || 0) + payment.amount;
    }

    const monthlyRevenueArray = Object.entries(monthlyRevenue)
      .map(([month, revenue]) => ({ month, revenue }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return apiSuccess({
      totalUsers,
      totalStudents,
      totalCourses,
      totalExams,
      totalRevenue: aggregatePayment._sum.amount ?? 0,
      activeStudents,
      totalCertificates,
      recentEnrollments: recentEnrollments.map((e) => ({
        id: e.id,
        studentName: e.user.name ?? 'Unknown',
        courseTitle: e.course.title,
        enrolledAt: e.enrolledAt.toISOString(),
      })),
      popularCourses: popularCourses.map((c) => ({
        id: c.id,
        title: c.title,
        enrollments: c._count.enrollments,
        revenue: 0,
      })),
      monthlyRevenue: monthlyRevenueArray,
    });
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    console.error('Admin stats error:', error);
    return apiError('Failed to fetch stats', 500);
  }
}
