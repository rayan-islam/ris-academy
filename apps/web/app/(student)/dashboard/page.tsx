'use client';

import {
  Card,
  CardContent,
  Skeleton,
  Badge,
  Progress,
  Button,
} from '@ris-academy/ui';
import { useSession } from 'next-auth/react';
import {
  BookOpen,
  FileQuestion,
  Award,
  TrendingUp,
  Clock,
  ArrowRight,
  ScrollText,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { cn, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

type DashboardResponse = {
  enrolledCourses: number;
  completedCourses: number;
  upcomingExams: {
    id: string;
    title: string;
    subject: string;
    timeLimit: number;
    totalMarks: number;
    passPercentage: number | null;
    totalQuestions: number;
  }[];
  averageScore: number;
  recentActivity: {
    type: string;
    title: string;
    description: string;
    timestamp: Date;
    link?: string;
  }[];
  enrolledCoursesList: {
    id: string;
    title: string;
    subject: string;
    thumbnail: string | null;
    type: string;
    progress: number;
    completed: boolean;
    enrolledAt: Date;
  }[];
  certificatesEarned: number;
  totalStudyTime: number;
  studyStreak: number;
  weeklyActivity: { day: string; date: string; minutes: number }[];
};

const statConfig = [
  { key: 'enrolledCourses', label: 'Enrolled Courses', icon: BookOpen, bg: 'bg-blue-50 dark:bg-blue-950', text: 'text-blue-600 dark:text-blue-400' },
  { key: 'completedCourses', label: 'Completed Courses', icon: Award, bg: 'bg-green-50 dark:bg-green-950', text: 'text-green-600 dark:text-green-400' },
  { key: 'upcomingExams', label: 'Upcoming Exams', icon: FileQuestion, bg: 'bg-amber-50 dark:bg-amber-950', text: 'text-amber-600 dark:text-amber-400' },
  { key: 'averageScore', label: 'Avg. Score', icon: TrendingUp, bg: 'bg-purple-50 dark:bg-purple-950', text: 'text-purple-600 dark:text-purple-400', suffix: '%' },
  { key: 'totalStudyTime', label: 'Study Time', icon: Clock, bg: 'bg-cyan-50 dark:bg-cyan-950', text: 'text-cyan-600 dark:text-cyan-400' },
  { key: 'certificatesEarned', label: 'Certificates', icon: ScrollText, bg: 'bg-rose-50 dark:bg-rose-950', text: 'text-rose-600 dark:text-rose-400' },
] as const;

const activityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  exam: FileQuestion,
  notification: Clock,
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch('/api/dashboard');
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error || 'Failed to load dashboard');
        }
        const json = await res.json();
        setData(json.data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Something went wrong';
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-lg font-medium text-destructive">{error}</p>
        <p className="mt-2 text-sm text-muted-foreground">Please try refreshing the page.</p>
      </div>
    );
  }

  const user = session?.user;
  const hscYear = (user as Record<string, unknown> | undefined)?.hscYear as string | undefined;
  const institution = (user as Record<string, unknown> | undefined)?.institution as string | undefined;

  const statValues: Record<string, string> = {
    enrolledCourses: String(data?.enrolledCourses ?? 0),
    completedCourses: String(data?.completedCourses ?? 0),
    upcomingExams: String(data?.upcomingExams?.length ?? 0),
    averageScore: `${Math.round(data?.averageScore ?? 0)}%`,
    totalStudyTime:
      data?.totalStudyTime
        ? data.totalStudyTime >= 60
          ? `${Math.floor(data.totalStudyTime / 60)}h ${data.totalStudyTime % 60}m`
          : `${data.totalStudyTime}m`
        : '0m',
    certificatesEarned: String(data?.certificatesEarned ?? 0),
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {loading ? (
            <Skeleton className="h-8 w-64" />
          ) : (
            <>Welcome back, {user?.name?.split(' ')[0] || 'Student'}!</>
          )}
        </h1>
        {loading ? (
          <Skeleton className="mt-2 h-5 w-48" />
        ) : (
          hscYear && institution && (
            <p className="mt-1 text-sm text-muted-foreground">
              {hscYear === '1st' ? 'HSC 1st Year' : 'HSC 2nd Year'} &middot; {institution}
            </p>
          )
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        {statConfig.map(({ key, label, icon: Icon, bg, text }, i) => (
          <Card key={key}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className={cn('flex h-12 w-12 items-center justify-center rounded-lg', bg, text)}>
                {loading ? (
                  <Skeleton className="h-12 w-12 rounded-lg" />
                ) : (
                  <Icon className="h-6 w-6" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{label}</p>
                {loading ? (
                  <Skeleton className="mt-1 h-7 w-16" />
                ) : (
                  <p className="text-2xl font-bold">{statValues[key]}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Your Courses</h2>
          <Link
            href="/courses"
            className="flex items-center gap-1 text-sm font-medium text-navy hover:underline"
          >
            Browse Courses
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-0">
                  <Skeleton className="h-40 w-full rounded-t-lg" />
                  <div className="space-y-3 p-4">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-2 w-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : data?.enrolledCoursesList && data.enrolledCoursesList.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.enrolledCoursesList.map((course) => (
              <Card key={course.id} className="overflow-hidden">
                <CardContent className="p-0">
                  {course.thumbnail ? (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="h-40 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-40 w-full items-center justify-center bg-muted">
                      <BookOpen className="h-10 w-10 text-muted-foreground" />
                    </div>
                  )}
                  <div className="space-y-3 p-4">
                    <div>
                      <h3 className="font-semibold leading-tight">{course.title}</h3>
                      <Badge variant="secondary" className="mt-1">
                        {course.subject}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Progress</span>
                        <span>{course.progress}%</span>
                      </div>
                      <Progress value={course.progress} className="h-2" />
                    </div>
                    <Link
                      href={`/courses/${course.id}`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-navy hover:underline"
                    >
                      {course.progress > 0 ? 'Continue Learning' : 'View Course'}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center py-12 text-center">
              <BookOpen className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium">You haven&apos;t enrolled in any courses yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Browse our catalog and start learning today.
              </p>
              <Link
                href="/courses"
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-navy hover:underline"
              >
                Browse Courses
                <ArrowRight className="h-4 w-4" />
              </Link>
            </CardContent>
          </Card>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Upcoming Exams</h2>
          <Link
            href="/exams"
            className="flex items-center gap-1 text-sm font-medium text-navy hover:underline"
          >
            View All Exams
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="space-y-3 p-6">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-20" />
                  <div className="flex gap-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-9 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : data?.upcomingExams && data.upcomingExams.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.upcomingExams.map((exam) => (
              <Card key={exam.id}>
                <CardContent className="space-y-3 p-6">
                  <div>
                    <h3 className="font-semibold leading-tight">{exam.title}</h3>
                    <Badge variant="secondary" className="mt-1">
                      {exam.subject}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <FileQuestion className="h-3.5 w-3.5" />
                      {exam.totalQuestions} questions
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {exam.timeLimit} mins
                    </span>
                  </div>
                  <Link
                    href={`/exams/${exam.id}`}
                    className="inline-flex items-center gap-1 rounded-md bg-saffron px-4 py-2 text-sm font-medium text-white hover:bg-saffron/90"
                  >
                    Start Exam
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center py-12 text-center">
              <FileQuestion className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium">No upcoming exams</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Check back later for new exams.
              </p>
            </CardContent>
          </Card>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Recent Activity</h2>

        {loading ? (
          <Card>
            <CardContent className="space-y-4 p-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-72" />
                  </div>
                  <Skeleton className="h-3 w-20" />
                </div>
              ))}
            </CardContent>
          </Card>
        ) : data?.recentActivity && data.recentActivity.length > 0 ? (
          <Card>
            <CardContent className="divide-y p-0">
              {data.recentActivity.map((activity, i) => {
                const Icon = activityIcons[activity.type] || Clock;
                return (
                  <div key={i} className="flex items-center gap-4 px-6 py-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">{activity.title}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatDate(activity.timestamp)}
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center py-12 text-center">
              <Clock className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium">No recent activity</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Your learning activity will appear here.
              </p>
            </CardContent>
          </Card>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Study Activity</h2>

        {loading ? (
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        ) : data?.weeklyActivity && data.weeklyActivity.length > 0 ? (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-end justify-between gap-2" style={{ height: '128px' }}>
                {data.weeklyActivity.map((item) => {
                  const maxMinutes = Math.max(...data.weeklyActivity.map((w) => w.minutes), 1);
                  const heightPercent = (item.minutes / maxMinutes) * 100;
                  const hasActivity = item.minutes > 0;
                  return (
                    <div key={item.date} className="flex flex-col items-center gap-1 flex-1">
                      <span className="text-xs font-medium tabular-nums text-muted-foreground">
                        {item.minutes}m
                      </span>
                      <div
                        className={cn(
                          'w-full max-w-[32px] rounded-t transition-all',
                          hasActivity
                            ? 'bg-navy'
                            : 'bg-muted',
                        )}
                        style={{ height: `${Math.max(heightPercent, hasActivity ? 8 : 4)}px` }}
                      />
                      <span className="text-xs text-muted-foreground">{item.day}</span>
                    </div>
                  );
                })}
              </div>
              {data.studyStreak > 0 && (
                <p className="mt-4 text-center text-sm text-muted-foreground">
                  <span className="font-medium text-navy">{data.studyStreak}-day</span> study streak this week
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center py-8 text-center">
              <Clock className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium">No activity yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Start watching course videos to track your study activity.
              </p>
            </CardContent>
          </Card>
        )}
      </section>

      {data && data.certificatesEarned > 0 && (
        <section>
          <Link
            href="/certificates"
            className="inline-flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-400 dark:hover:bg-amber-900"
          >
            <Award className="h-5 w-5" />
            View My Certificates ({data.certificatesEarned})
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      )}
    </div>
  );
}
