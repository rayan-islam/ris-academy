'use client';

import {
  Card,
  CardContent,
  Skeleton,
  Badge,
  Button,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@ris-academy/ui';
import {
  Clock,
  Award,
  FileQuestion,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  XCircle,
  MinusCircle,
  ArrowLeft,
  Target,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type AttemptInfo = {
  id: string;
  status: string;
  score: number | null;
  startTime: string;
  endTime: string | null;
};

type ExamDetail = {
  id: string;
  title: string;
  description: string | null;
  subject: string;
  examType: 'MCQ' | 'WRITTEN';
  totalMarks: number;
  passPercentage: number | null;
  timeLimit: number;
  negativeMarking: number | null;
  allowRetake: boolean;
  instructions: string | null;
  isPublished: boolean;
  courseId: string | null;
  createdAt: string;
  questions: {
    id: string;
    stem: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    difficulty: string | null;
    marks: number;
    order: number;
  }[];
  existingAttempt: AttemptInfo | null;
};

type ExamResponse = {
  success: boolean;
  data: ExamDetail;
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

export default function ExamDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [exam, setExam] = useState<ExamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDialogOpen, setStartDialogOpen] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchExam() {
      try {
        const res = await fetch(`/api/exams/${id}`);
        const json: ExamResponse = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Failed to fetch exam');
        }

        setExam(json.data);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Something went wrong';
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    }
    fetchExam();
  }, [id]);

  const handleStartExam = async () => {
    setStarting(true);
    try {
      const res = await fetch(`/api/exams/${id}/start`, {
        method: 'POST',
      });
      const json: { success: boolean; error?: string; date?: unknown } = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to start exam');
      }

      setStartDialogOpen(false);

      if (exam?.examType === 'WRITTEN') {
        window.location.href = `/exams/${id}/write`;
      } else {
        window.location.href = `/exams/${id}/take`;
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong';
      toast.error(message);
    } finally {
      setStarting(false);
    }
  };

  if (error) {
    return (
      <div className="mx-auto max-w-3xl">
        <Link
          href="/exams"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Exams
        </Link>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-lg font-medium text-destructive">{error}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Please try again or go back to the exam list.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-8">
        <Skeleton className="h-5 w-28" />
        <Card>
          <CardContent className="space-y-6 p-6">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <Skeleton className="h-7 w-3/4" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
            <div className="space-y-2">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!exam) return null;

  const existingAttempt = exam.existingAttempt;
  const isCompleted =
    existingAttempt?.status === 'COMPLETED' ||
    existingAttempt?.status === 'TIMEOUT';
  const subjectColor =
    subjectGradients[exam.subject] || 'from-gray-500 to-gray-700';

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <Link
        href="/exams"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Exams
      </Link>

      <Card>
        <CardContent className="space-y-6 p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              className={cn(
                'bg-gradient-to-br text-white border-0',
                subjectColor,
              )}
            >
              {exam.subject}
            </Badge>
            <Badge
              variant={exam.examType === 'MCQ' ? 'success' : 'secondary'}
            >
              {exam.examType === 'MCQ' ? 'MCQ' : 'Written'}
            </Badge>
            {isCompleted && (
              <Badge variant={existingAttempt?.status === 'TIMEOUT' ? 'warning' : 'outline'}>
                {existingAttempt?.status === 'TIMEOUT' ? 'Timed Out' : 'Completed'}
              </Badge>
            )}
          </div>

          <h1 className="text-2xl font-bold">{exam.title}</h1>

          {exam.description && (
            <p className="text-sm text-muted-foreground">{exam.description}</p>
          )}

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="flex items-center gap-2 rounded-lg border p-3">
              <Clock className="h-5 w-5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Time</p>
                <p className="text-sm font-semibold">{exam.timeLimit} mins</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border p-3">
              <Award className="h-5 w-5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Marks</p>
                <p className="text-sm font-semibold">{exam.totalMarks}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border p-3">
              <Target className="h-5 w-5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Pass %</p>
                <p className="text-sm font-semibold">
                  {exam.passPercentage ?? 40}%
                </p>
              </div>
            </div>
            {exam.negativeMarking != null && exam.negativeMarking > 0 ? (
              <div className="flex items-center gap-2 rounded-lg border p-3">
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Negative</p>
                  <p className="text-sm font-semibold text-destructive">
                    -{exam.negativeMarking}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-lg border p-3">
                <RotateCcw className="h-5 w-5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Retake</p>
                  <p className="text-sm font-semibold">
                    {exam.allowRetake ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {exam.instructions && (
            <div>
              <h2 className="mb-2 text-sm font-semibold">Instructions</h2>
              <div className="rounded-lg border bg-muted/50 p-4 text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                {exam.instructions}
              </div>
            </div>
          )}

          {isCompleted ? (
            <div className="space-y-4">
              <Card className="border-2">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="font-semibold">
                      {existingAttempt?.status === 'TIMEOUT'
                        ? 'Exam Timed Out'
                        : 'Exam Completed'}
                    </span>
                  </div>
                  {existingAttempt?.score !== null &&
                    existingAttempt?.score !== undefined && (
                      <p className="text-2xl font-bold">
                        Score: {existingAttempt.score}/{exam.totalMarks}
                      </p>
                    )}
                </CardContent>
              </Card>
              <div className="flex gap-3">
                <Link href={`/exams/${id}/result`}>
                  <Button size="lg" asChild>
                    <span>View Result</span>
                  </Button>
                </Link>
                {exam.allowRetake && (
                  <AlertDialog
                    open={startDialogOpen}
                    onOpenChange={setStartDialogOpen}
                  >
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => setStartDialogOpen(true)}
                    >
                      Retake Exam
                    </Button>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Retake Exam?</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2">
                          <p>Are you sure you want to retake this exam? Your previous attempt will be overwritten.</p>
                          <div className="mt-3 space-y-2 rounded-lg border p-3 text-sm">
                            <p className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              This exam is timed ({exam.timeLimit} minutes)
                            </p>
                            <p className="flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                              Do not switch tabs - it will be logged
                            </p>
                            <p className="flex items-center gap-2">
                              <Target className="h-4 w-4 text-muted-foreground" />
                              The exam will auto-submit when time expires
                            </p>
                            <p className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              Once started, you cannot pause the timer
                            </p>
                          </div>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleStartExam}
                          disabled={starting}
                        >
                          {starting ? 'Starting...' : 'Confirm Retake'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          ) : (
            <AlertDialog
              open={startDialogOpen}
              onOpenChange={setStartDialogOpen}
            >
              <Button
                size="lg"
                className="w-full"
                onClick={() => setStartDialogOpen(true)}
              >
                {exam.examType === 'WRITTEN' ? 'Start Written Exam' : 'Start Exam'}
              </Button>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you ready to start?</AlertDialogTitle>
                  <AlertDialogDescription className="space-y-2">
                    <p>
                      Please review the rules before you begin.
                    </p>
                    <div className="mt-3 space-y-2 rounded-lg border p-3 text-sm">
                      <p className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        This exam is timed ({exam.timeLimit} minutes)
                      </p>
                      <p className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                        Do not switch tabs - it will be logged
                      </p>
                      <p className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        The exam will auto-submit when time expires
                      </p>
                      <p className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        Once started, you cannot pause the timer
                      </p>
                      {exam.examType === 'WRITTEN' && (
                        <>
                          <p className="flex items-center gap-2">
                            <FileQuestion className="h-4 w-4 text-muted-foreground" />
                            Type your answers or upload PDF files
                          </p>
                          <p className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            Your answers are auto-saved every 45 seconds
                          </p>
                          <p className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                            PDF uploads: max 20MB, PDF format only
                          </p>
                        </>
                      )}
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleStartExam}
                    disabled={starting}
                  >
                    {starting ? 'Starting...' : 'Confirm'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
