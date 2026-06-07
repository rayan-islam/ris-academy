'use client';

import { Card, CardContent, CardHeader, CardTitle, Skeleton, Badge } from '@ris-academy/ui';
import { Users, BookOpen, FileQuestion, Banknote, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { formatBDT, formatDate, cn } from '@/lib/utils';
import { toast } from 'sonner';

type AdminDashboardData = {
  totalStudents: number;
  totalCourses: number;
  totalExams: number;
  totalRevenue: number;
  activeStudents: number;
  recentEnrollments: { id: string; studentName: string; courseTitle: string; enrolledAt: string }[];
  monthlyRevenue: { month: string; revenue: number }[];
  popularCourses: { id: string; title: string; enrollments: number; revenue: number }[];
};

const statCards = [
  { key: 'totalStudents', label: 'Total Students', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950' },
  { key: 'totalCourses', label: 'Total Courses', icon: BookOpen, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950' },
  { key: 'totalExams', label: 'Total Exams', icon: FileQuestion, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950' },
  { key: 'totalRevenue', label: 'Total Revenue (BDT)', icon: Banknote, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950' },
  { key: 'activeStudents', label: 'Active Students', icon: TrendingUp, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-950' },
] as const;

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/admin/stats');
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error || 'Failed to load dashboard stats');
        }
        const json = await res.json();
        setData(json.data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Something went wrong';
        toast.error(message);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const maxRevenue = data?.monthlyRevenue
    ? Math.max(...data.monthlyRevenue.map((m) => m.revenue), 1)
    : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Overview of your academy&apos;s performance
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {statCards.map(({ key, label, icon: Icon, color, bg }) => (
          <Card key={key}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className={cn('flex h-12 w-12 items-center justify-center rounded-lg', bg, color)}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{label}</p>
                {loading ? (
                  <Skeleton className="mt-1 h-7 w-16" />
                ) : (
                  <p className="text-2xl font-bold">
                    {key === 'totalRevenue' && data
                      ? formatBDT(data.totalRevenue)
                      : data
                        ? (data[key as keyof AdminDashboardData] as number).toLocaleString()
                        : '0'}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-48 w-full" />
            ) : data?.monthlyRevenue ? (
              <div className="flex items-end justify-between gap-2 h-48 px-2">
                {data.monthlyRevenue.map((item) => (
                  <div key={item.month} className="flex flex-col items-center gap-1 flex-1">
                    <span className="text-xs font-medium tabular-nums">{formatBDT(item.revenue)}</span>
                    <div
                      className="w-full rounded-t bg-primary/80 transition-all"
                      style={{ height: `${(item.revenue / maxRevenue) * 140}px` }}
                    />
                    <span className="text-xs text-muted-foreground">{item.month}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">No revenue data available</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Popular Courses</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-3 p-6">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : data?.popularCourses && data.popularCourses.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="py-3 pl-6 text-left font-medium">#</th>
                    <th className="py-3 text-left font-medium">Course</th>
                    <th className="py-3 text-right font-medium">Enrollments</th>
                    <th className="py-3 pr-6 text-right font-medium">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {data.popularCourses.map((course, i) => (
                    <tr key={course.id} className="border-b last:border-0 text-sm">
                      <td className="py-3 pl-6 text-muted-foreground">{i + 1}</td>
                      <td className="py-3 font-medium">{course.title}</td>
                      <td className="py-3 text-right tabular-nums">{course.enrollments}</td>
                      <td className="py-3 pr-6 text-right tabular-nums">{formatBDT(course.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">No courses yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Enrollments</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : data?.recentEnrollments && data.recentEnrollments.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="py-3 pl-6 text-left font-medium">Student</th>
                  <th className="py-3 text-left font-medium">Course</th>
                  <th className="py-3 pr-6 text-right font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.recentEnrollments.map((enrollment) => (
                  <tr key={enrollment.id} className="border-b last:border-0 text-sm">
                    <td className="py-3 pl-6 font-medium">{enrollment.studentName}</td>
                    <td className="py-3">{enrollment.courseTitle}</td>
                    <td className="py-3 pr-6 text-right text-muted-foreground tabular-nums">
                      {formatDate(enrollment.enrolledAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="py-12 text-center text-sm text-muted-foreground">No recent enrollments</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
