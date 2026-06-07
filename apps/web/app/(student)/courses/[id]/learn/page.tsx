'use client';

import {
  Button,
  Skeleton,
  Card,
  CardContent,
  CardTitle,
  CardDescription,
  Progress,
  Separator,
  Badge,
} from '@ris-academy/ui';
import {
  Play,
  CheckCircle,
  Lock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useRef, Suspense } from 'react';
import { formatDuration, cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@radix-ui/react-accordion';

type VideoItem = {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  duration: number;
  order: number;
  chapterId: string;
  isPublished: boolean;
};

type ChapterItem = {
  id: string;
  title: string;
  order: number;
  courseId: string;
  videos: VideoItem[];
};

type CourseLearnData = {
  id: string;
  title: string;
  subject: string;
  chapters: ChapterItem[];
  enrollment: {
    id: string;
    progress: number;
    completed: boolean;
    enrolledAt: string;
  } | null;
};

type ProgressData = {
  enrollment: {
    id: string;
    progress: number;
    completed: boolean;
    enrolledAt: string;
    completedAt: string | null;
  };
  totalVideos: number;
  watchedVideos: number;
  progressPercent: number;
  videoProgress: {
    videoId: string;
    watchedSeconds: number;
    completed: boolean;
    updatedAt: string;
  }[];
};

const REPORT_INTERVAL = 5000;

export default function LearnPage() {
  return (
    <Suspense fallback={<LearnPageSkeleton />}>
      <LearnContent />
    </Suspense>
  );
}

function LearnContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [course, setCourse] = useState<CourseLearnData | null>(null);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [watchedThresholdMet, setWatchedThresholdMet] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const allVideos = course?.chapters.flatMap((ch) => ch.videos) ?? [];
  const currentVideo = allVideos.find((v) => v.id === currentVideoId);
  const currentVideoIndex = allVideos.findIndex((v) => v.id === currentVideoId);

  const videoProgressMap = new Map(
    progress?.videoProgress.map((vp) => [vp.videoId, vp]) ?? [],
  );

  const isVideoUnlocked = useCallback(
    (video: VideoItem, index: number) => {
      if (index === 0) return true;
      const prevVideo = allVideos[index - 1];
      if (!prevVideo) return false;
      const prevProgress = videoProgressMap.get(prevVideo.id);
      return prevProgress?.completed === true;
    },
    [allVideos, videoProgressMap],
  );

  const isCurrentVideoUnlocked = currentVideo
    ? isVideoUnlocked(currentVideo, currentVideoIndex)
    : false;

  useEffect(() => {
    async function fetchData() {
      try {
        const [courseRes, progressRes] = await Promise.all([
          fetch(`/api/courses/${params.id}`),
          fetch(`/api/courses/${params.id}/progress`),
        ]);

        const courseJson = await courseRes.json();
        if (!courseRes.ok || !courseJson.success) {
          throw new Error(courseJson.error || 'Failed to load course');
        }

        const progressJson = await progressRes.json();
        const progressData =
          progressRes.ok && progressJson.success ? progressJson.data : null;

        setCourse(courseJson.data);
        setProgress(progressData);

        const videoId = searchParams.get('video');
        if (videoId) {
          setCurrentVideoId(videoId);
        } else if (courseJson.data?.chapters?.[0]?.videos?.[0]) {
          setCurrentVideoId(courseJson.data.chapters[0].videos[0].id);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Something went wrong';
        toast.error(message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [params.id, searchParams]);

  const reportProgress = useCallback(async () => {
    if (!currentVideoId || !videoRef.current) return;

    const watchedSeconds = Math.floor(videoRef.current.currentTime);

    try {
      const res = await fetch(`/api/videos/${currentVideoId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ watchedSeconds }),
      });
      const json = await res.json();

      if (res.ok && json.success) {
        const completed = json.data.videoProgress.completed;
        setWatchedThresholdMet(completed);

        if (completed && progress) {
          const totalVideos = allVideos.length;
          const updatedCount = progress.videoProgress.filter(
            (vp) =>
              vp.completed ||
              (vp.videoId === currentVideoId && completed),
          ).length;
          if (!progress.videoProgress.some((vp) => vp.videoId === currentVideoId)) {
            updatedCount + 1;
          }
          const newProgress =
            totalVideos > 0
              ? Math.round((updatedCount / totalVideos) * 100)
              : 0;

          setProgress((prev) =>
            prev
              ? {
                  ...prev,
                  watchedVideos: updatedCount,
                  progressPercent: newProgress,
                  enrollment: {
                    ...prev.enrollment,
                    progress: newProgress,
                  },
                }
              : prev,
          );
        }
      }
    } catch {
      // silently fail for periodic progress reports
    }
  }, [currentVideoId, progress, allVideos]);

  useEffect(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    if (currentVideoId && isPlaying) {
      progressIntervalRef.current = setInterval(reportProgress, REPORT_INTERVAL);
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [currentVideoId, isPlaying, reportProgress]);

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handlePause = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleVideoSwitch = (videoId: string) => {
    const video = allVideos.find((v) => v.id === videoId);
    const index = allVideos.findIndex((v) => v.id === videoId);
    if (video && isVideoUnlocked(video, index)) {
      setCurrentVideoId(videoId);
      setWatchedThresholdMet(false);
      setIsPlaying(false);
      router.replace(
        `/courses/${params.id}/learn?video=${videoId}`,
        { scroll: false },
      );
    }
  };

  const goToPrevious = () => {
    if (currentVideoIndex > 0) {
      const prev = allVideos[currentVideoIndex - 1];
      if (prev) handleVideoSwitch(prev.id);
    }
  };

  const goToNext = () => {
    if (currentVideoIndex < allVideos.length - 1) {
      const next = allVideos[currentVideoIndex + 1];
      if (next) handleVideoSwitch(next.id);
    }
  };

  const isYouTube = currentVideo?.videoUrl?.includes('youtube');
  const youtubeId = isYouTube
    ? currentVideo?.videoUrl?.match(
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?#]+)/,
      )?.[1]
    : null;

  if (loading) {
    return <LearnPageSkeleton />;
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-lg font-medium">Course not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {progress && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Course Progress</span>
            <span className="font-medium">
              {Math.round(progress.progressPercent)}%
            </span>
          </div>
          <Progress value={progress.progressPercent} className="h-2" />
        </div>
      )}

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1 space-y-4 lg:w-2/3">
          <Card className="overflow-hidden">
            <div className="relative bg-black">
              {currentVideo ? (
                isYouTube && youtubeId ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${youtubeId}?rel=0`}
                    className="aspect-video w-full"
                    allowFullScreen
                    title={currentVideo.title}
                  />
                ) : (
                  <video
                    ref={videoRef}
                    src={currentVideo.videoUrl}
                    className="aspect-video w-full"
                    controls
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => {
                      setIsPlaying(false);
                      reportProgress();
                    }}
                  />
                )
              ) : (
                <div className="flex aspect-video w-full items-center justify-center bg-muted">
                  <Play className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              {watchedThresholdMet && (
                <Badge className="absolute left-3 top-3 bg-green-500 text-white hover:bg-green-500">
                  80% Watched
                </Badge>
              )}
            </div>
            <CardContent className="space-y-2 p-4">
              {currentVideo && (
                <>
                  <CardTitle className="text-lg">
                    {currentVideo.title}
                  </CardTitle>
                  {currentVideo.description && (
                    <CardDescription>
                      {currentVideo.description}
                    </CardDescription>
                  )}
                </>
              )}
              {!currentVideo && (
                <p className="text-sm text-muted-foreground">
                  Select a video from the syllabus to start learning.
                </p>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevious}
              disabled={currentVideoIndex <= 0}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>
            <span className="text-xs text-muted-foreground">
              {currentVideoIndex >= 0
                ? `${currentVideoIndex + 1} of ${allVideos.length}`
                : '—'}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNext}
              disabled={currentVideoIndex >= allVideos.length - 1}
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="lg:w-1/3">
          <Card>
            <CardContent className="p-4">
              <h3 className="mb-3 text-sm font-semibold">Course Content</h3>
              <Accordion
                type="multiple"
                defaultValue={currentVideo ? [currentVideo.chapterId] : []}
                className="space-y-1"
              >
                {course.chapters.map((chapter) => (
                  <AccordionItem
                    key={chapter.id}
                    value={chapter.id}
                    className="rounded-lg border"
                  >
                    <AccordionTrigger className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-medium hover:bg-muted/50">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded bg-muted text-[10px] font-bold">
                          {chapter.order}
                        </span>
                        <span className="line-clamp-1">{chapter.title}</span>
                      </div>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {chapter.videos.length} videos
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="divide-y px-3 pb-1">
                      {chapter.videos.map((video, idx) => {
                        const globalIdx = allVideos.findIndex(
                          (v) => v.id === video.id,
                        );
                        const unlocked = isVideoUnlocked(video, globalIdx);
                        const isCurrent = video.id === currentVideoId;
                        const vp = videoProgressMap.get(video.id);
                        const completed = vp?.completed;

                        return (
                          <button
                            key={video.id}
                            onClick={() => handleVideoSwitch(video.id)}
                            disabled={!unlocked}
                            className={cn(
                              'flex w-full items-center gap-2 py-2 text-left text-xs transition-colors',
                              isCurrent
                                ? 'bg-accent text-accent-foreground'
                                : unlocked
                                  ? 'hover:bg-muted/50'
                                  : 'cursor-not-allowed opacity-50',
                            )}
                          >
                            {completed ? (
                              <CheckCircle className="h-3.5 w-3.5 shrink-0 text-green-500" />
                            ) : unlocked ? (
                              <Play className="h-3.5 w-3.5 shrink-0" />
                            ) : (
                              <Lock className="h-3.5 w-3.5 shrink-0" />
                            )}
                            <span className="flex-1 truncate">
                              {video.title}
                            </span>
                            {video.duration && (
                              <span className="shrink-0 text-[10px] text-muted-foreground">
                                {formatDuration(video.duration)}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function LearnPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-8" />
        </div>
        <Skeleton className="h-2 w-full" />
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1 space-y-4 lg:w-2/3">
          <Skeleton className="aspect-video w-full rounded-lg" />
          <Card>
            <CardContent className="space-y-2 p-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
          <div className="flex items-center justify-between">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>

        <div className="lg:w-1/3">
          <Card>
            <CardContent className="space-y-2 p-4">
              <Skeleton className="h-5 w-32" />
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full rounded-lg" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
