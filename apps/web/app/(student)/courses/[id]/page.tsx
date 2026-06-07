'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Badge,
  Skeleton,
  Separator,
  Progress,
} from '@ris-academy/ui';
import {
  BookOpen,
  Clock,
  Play,
  Users,
  Award,
  CheckCircle,
  ChevronRight,
  DollarSign,
} from 'lucide-react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { formatBDT, formatDuration, cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@radix-ui/react-accordion';

type CourseVideo = {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  duration: number;
  order: number;
  chapterId: string;
  isPublished: boolean;
};

type CourseChapter = {
  id: string;
  title: string;
  order: number;
  courseId: string;
  videos: CourseVideo[];
};

type CourseDetail = {
  id: string;
  title: string;
  description: string;
  thumbnail: string | null;
  subject: string;
  type: 'FREE' | 'PAID';
  price: number;
  instructorName: string;
  instructorBio: string;
  chapters: CourseChapter[];
  enrollment: {
    id: string;
    progress: number;
    completed: boolean;
    enrolledAt: string;
  } | null;
};

type CourseDetailResponse = {
  success: boolean;
  data: CourseDetail;
  error?: string;
};

const subjectGradients: Record<string, string> = {
  Physics: 'from-indigo-500 to-purple-600',
  Chemistry: 'from-emerald-500 to-teal-600',
  Biology: 'from-green-500 to-lime-600',
  Math: 'from-blue-500 to-cyan-600',
  English: 'from-rose-500 to-pink-600',
  ICT: 'from-orange-500 to-amber-600',
  Bangla: 'from-red-500 to-rose-600',
};

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    async function fetchCourse() {
      try {
        const res = await fetch(`/api/courses/${params.id}`);
        const json: CourseDetailResponse = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Failed to fetch course');
        }

        setCourse(json.data);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Something went wrong';
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    }
    fetchCourse();
  }, [params.id]);

  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    if (paymentStatus === 'failed') {
      toast.error('Payment failed. Please try again.');
    } else if (paymentStatus === 'cancelled') {
      toast.info('Payment cancelled.');
    }
  }, [searchParams]);

  const handleEnroll = async () => {
    if (!session) {
      toast.error('Please sign in to enroll');
      return;
    }

    setEnrolling(true);
    try {
      const res = await fetch(`/api/courses/${params.id}/enroll`, {
        method: 'POST',
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to enroll');
      }

      toast.success('Successfully enrolled!');
      router.push(`/courses/${params.id}/learn`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong';
      toast.error(message);
    } finally {
      setEnrolling(false);
    }
  };

  const handleCheckout = async () => {
    if (!session) {
      toast.error('Please sign in to enroll');
      return;
    }

    setCheckingOut(true);
    try {
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: params.id }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Payment checkout failed');
      }

      if (json.data?.paymentUrl) {
        window.location.href = json.data.paymentUrl;
      } else {
        throw new Error('No payment URL received');
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong';
      toast.error(message);
      setCheckingOut(false);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-lg font-medium text-destructive">{error}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Please try refreshing the page.
        </p>
      </div>
    );
  }

  if (loading) {
    return <CourseDetailSkeleton />;
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <BookOpen className="mb-4 h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-medium">Course not found</p>
      </div>
    );
  }

  const totalVideos = course.chapters.reduce(
    (sum, ch) => sum + ch.videos.length,
    0,
  );
  const totalDuration = course.chapters.reduce(
    (sum, ch) =>
      sum + ch.videos.reduce((vSum, v) => vSum + (v.duration || 0), 0),
    0,
  );

  const bullets = course.description
    ?.split('\n')
    .filter((line) => line.trim());

  return (
    <div className="space-y-8">
      <div
        className={cn(
          'relative overflow-hidden rounded-xl bg-gradient-to-br p-8 text-white',
          subjectGradients[course.subject] || 'from-gray-500 to-gray-700',
        )}
      >
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-white/20 text-white hover:bg-white/20">
              {course.subject}
            </Badge>
            <Badge
              className={cn(
                course.type === 'FREE'
                  ? 'bg-green-500 text-white hover:bg-green-500'
                  : 'bg-amber-500 text-white hover:bg-amber-500',
              )}
            >
              {course.type === 'FREE'
                ? 'FREE'
                : `PAID ${formatBDT(course.price)}`}
            </Badge>
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
            {course.title}
          </h1>
        </div>
        <div className="absolute inset-0 bg-black/10" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              <Play className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Videos</p>
              <p className="text-lg font-bold">{totalVideos}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Duration</p>
              <p className="text-lg font-bold">
                {formatDuration(totalDuration)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Instructor</p>
              <p className="text-lg font-bold">
                {course.instructorName || 'N/A'}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Chapters</p>
              <p className="text-lg font-bold">{course.chapters.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {course.description && (
        <section>
          <h2 className="mb-3 text-xl font-semibold">About This Course</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {course.description}
          </p>
        </section>
      )}

      {bullets && bullets.length > 0 && (
        <section>
          <h2 className="mb-3 text-xl font-semibold">What You&apos;ll Learn</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {bullets.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                <span>{item.replace(/^[•\-\s]+/, '')}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {course.chapters.length > 0 && (
        <section>
          <h2 className="mb-3 text-xl font-semibold">Syllabus</h2>
          <Accordion type="multiple" className="space-y-2">
            {course.chapters.map((chapter) => (
              <AccordionItem
                key={chapter.id}
                value={chapter.id}
                className="rounded-lg border"
              >
                <AccordionTrigger className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded bg-muted text-xs font-bold">
                      {chapter.order}
                    </span>
                    <span>{chapter.title}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {chapter.videos.length} videos
                  </span>
                </AccordionTrigger>
                <AccordionContent className="divide-y px-4 pb-2">
                  {chapter.videos.map((video) => (
                    <button
                      key={video.id}
                      onClick={() =>
                        router.push(
                          `/courses/${course.id}/learn?video=${video.id}`,
                        )
                      }
                      className="flex w-full items-center gap-3 py-2.5 text-left text-sm hover:bg-muted/50"
                    >
                      <Play className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="flex-1 truncate">{video.title}</span>
                      {video.duration && (
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {formatDuration(video.duration)}
                        </span>
                      )}
                    </button>
                  ))}
                  {chapter.videos.length === 0 && (
                    <p className="py-3 text-center text-xs text-muted-foreground">
                      No videos in this chapter yet.
                    </p>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      )}

      <Separator />

      <section className="flex flex-col items-center text-center">
        {course.enrollment ? (
          <div className="w-full max-w-md space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Your Progress</span>
                <span className="font-medium">
                  {Math.round(course.enrollment.progress)}%
                </span>
              </div>
              <Progress
                value={course.enrollment.progress}
                className="h-2"
              />
            </div>
            <Button
              className="w-full"
              onClick={() =>
                router.push(`/courses/${course.id}/learn`)
              }
            >
              Continue Learning
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        ) : course.type === 'FREE' ? (
          <div className="w-full max-w-md space-y-3">
            <Button
              size="lg"
              className="w-full"
              onClick={handleEnroll}
              disabled={enrolling}
            >
              {enrolling ? 'Enrolling...' : 'Enroll Now'}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
            {!session && (
              <p className="text-xs text-muted-foreground">
                You will need to sign in to enroll.
              </p>
            )}
          </div>
        ) : (
          <div className="w-full max-w-md space-y-4">
            <div className="flex items-center justify-center gap-2 text-2xl font-bold">
              <DollarSign className="h-6 w-6 text-amber-500" />
              {formatBDT(course.price)}
            </div>
            <Button
              size="lg"
              className="w-full"
              onClick={handleCheckout}
              disabled={checkingOut}
            >
              {checkingOut ? 'Redirecting to payment...' : `Buy for ${formatBDT(course.price)}`}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
            <p className="text-xs text-muted-foreground">
              You will be redirected to our secure payment gateway.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function CourseDetailSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-48 w-full rounded-xl" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center gap-4 p-4">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="space-y-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-12" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <section className="space-y-3">
        <Skeleton className="h-6 w-44" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </section>

      <section className="space-y-3">
        <Skeleton className="h-6 w-40" />
        <div className="grid gap-2 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-full" />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <Skeleton className="h-6 w-28" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </section>

      <Skeleton className="h-px w-full" />

      <div className="flex flex-col items-center space-y-3">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
    </div>
  );
}
