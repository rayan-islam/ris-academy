'use client';

import {
  Card,
  CardContent,
  Button,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Skeleton,
} from '@ris-academy/ui';
import {
  Clock,
  AlertTriangle,
  Upload,
  FileText,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type Question = {
  id: string;
  stem: string;
  imageUrl: string | null;
  questionType: 'MCQ_OPTION' | 'TEXT' | 'FILE_UPLOAD';
  marks: number;
  order: number;
};

type ExamData = {
  id: string;
  title: string;
  subject: string;
  examType: 'MCQ' | 'WRITTEN';
  totalMarks: number;
  timeLimit: number;
  passPercentage: number | null;
  allowRetake: boolean;
  questions: Question[];
};

type ExamResponse = {
  success: boolean;
  data: ExamData;
  error?: string;
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export default function WrittenExamPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [exam, setExam] = useState<ExamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fullscreenDenied, setFullscreenDenied] = useState(false);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string>>({});
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);

  const initializedRef = useRef(false);
  const tabSwitchesRef = useRef(0);
  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoSaveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const visibilityRef = useRef(true);
  const answersRef = useRef<Record<string, string>>({});
  const submittedRef = useRef(false);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    submittedRef.current = submitted;
  }, [submitted]);

  const requestFullscreen = useCallback(() => {
    const el = document.documentElement;
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => setFullscreenDenied(true));
    }
    setFullscreenDenied(false);
  }, []);

  useEffect(() => {
    async function fetchExam() {
      try {
        const res = await fetch(`/api/exams/${id}`);
        const json: ExamResponse = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Failed to fetch exam');
        }

        const data = json.data;
        if (data.examType !== 'WRITTEN') {
          throw new Error('Only written exams are supported in this view');
        }

        setExam(data);

        if (!initializedRef.current) {
          initializedRef.current = true;
          setTimeRemaining(data.timeLimit * 60);
        }
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

  useEffect(() => {
    if (!exam) return;

    requestFullscreen();

    const preventDefault = (e: Event) => e.preventDefault();
    document.addEventListener('contextmenu', preventDefault);
    document.addEventListener('selectstart', preventDefault);

    return () => {
      document.removeEventListener('contextmenu', preventDefault);
      document.removeEventListener('selectstart', preventDefault);
    };
  }, [exam, requestFullscreen]);

  const totalQuestions = exam?.questions.length ?? 0;

  useEffect(() => {
    if (totalQuestions === 0 || !initializedRef.current) return;

    tickIntervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    timeCheckIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/exams/${id}/time-check`, {
          method: 'POST',
        });
        const json = await res.json();
        if (json.data?.expired) {
          setSubmitted(true);
          toast.error('Time has expired. Exam auto-submitted.');
          router.push(`/exams/${id}/result`);
        }
      } catch {
        // silently fail
      }
    }, 30000);

    autoSaveIntervalRef.current = setInterval(async () => {
      try {
        const currentAnswers = answersRef.current;
        const payload = Object.entries(currentAnswers).map(([questionId, content]) => ({
          questionId,
          content,
        }));
        await fetch(`/api/exams/${id}/auto-save`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers: payload }),
        });
      } catch {
        // silently fail
      }
    }, 45000);

    return () => {
      if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
      if (timeCheckIntervalRef.current) clearInterval(timeCheckIntervalRef.current);
      if (autoSaveIntervalRef.current) clearInterval(autoSaveIntervalRef.current);
    };
  }, [totalQuestions, id, router]);

  useEffect(() => {
    if (!exam) return;

    const handleVisibilityChange = () => {
      if (document.hidden && visibilityRef.current) {
        visibilityRef.current = false;
        tabSwitchesRef.current += 1;

        toast.warning('Tab switch detected! This has been logged.');

        fetch(`/api/exams/${id}/tab-switch`, { method: 'POST' })
          .then((r) => r.json())
          .then((json) => {
            if (json.data?.warning) {
              toast.error(json.data.warning);
            }
            if (tabSwitchesRef.current >= 3) {
              toast.error(
                `Warning: ${tabSwitchesRef.current} tab switches detected. This may affect your exam integrity.`,
                { duration: 8000 },
              );
            }
          })
          .catch(() => {});

        setTimeout(() => {
          visibilityRef.current = true;
        }, 1000);
      } else if (!document.hidden) {
        visibilityRef.current = true;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [exam, id]);

  const handleAutoSubmit = useCallback(async () => {
    if (submittedRef.current) return;
    setSubmitted(true);
    submittedRef.current = true;
    setSubmitting(true);
    try {
      const currentAnswers = answersRef.current;
      const payload = exam!.questions.map((q) => ({
        questionId: q.id,
        content: currentAnswers[q.id] ?? '',
      }));
      await fetch(`/api/exams/${id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: payload }),
      });
      router.push(`/exams/${id}/result`);
    } catch {
      toast.error('Failed to submit exam');
    } finally {
      setSubmitting(false);
    }
  }, [exam, id, router]);

  useEffect(() => {
    if (timeRemaining === 0 && !submitted && exam && initializedRef.current) {
      handleAutoSubmit();
    }
  }, [timeRemaining, submitted, exam, handleAutoSubmit]);

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    setSubmitDialogOpen(false);
    try {
      const payload = exam!.questions.map((q) => ({
        questionId: q.id,
        content: answers[q.id] ?? '',
      }));
      const res = await fetch(`/api/exams/${id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: payload }),
      });
      const json: { success: boolean; error?: string } = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to submit');
      }
      setSubmitted(true);
      router.push(`/exams/${id}/result`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to submit exam';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }, [exam, id, answers, router]);

  const handleFileUpload = useCallback(
    async (questionId: string, file: File) => {
      if (file.type !== 'application/pdf') {
        toast.error('Only PDF files are allowed');
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        toast.error('File size must be under 20MB');
        return;
      }

      setUploadingFiles((prev) => new Set(prev).add(questionId));
      try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch(`/api/exams/${id}/upload`, {
          method: 'POST',
          body: formData,
        });
        const json: { success: boolean; data?: { url: string }; error?: string } =
          await res.json();

        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Upload failed');
        }

        setUploadedFiles((prev) => ({
          ...prev,
          [questionId]: json.data!.url,
        }));
        toast.success('File uploaded');
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Upload failed';
        toast.error(message);
      } finally {
        setUploadingFiles((prev) => {
          const next = new Set(prev);
          next.delete(questionId);
          return next;
        });
      }
    },
    [id],
  );

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-lg text-muted-foreground">Loading exam...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-lg font-medium text-destructive">{error}</p>
        <Button onClick={() => router.push(`/exams/${id}`)}>
          Go Back
        </Button>
      </div>
    );
  }

  if (!exam) return null;

  const questions = exam.questions;
  const isLowTime = timeRemaining < 300;
  const isCritical = timeRemaining < 60;
  const answeredCount = Object.values(answers).filter((v) => v.trim().length > 0).length;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {fullscreenDenied && (
        <div className="flex items-center justify-center gap-2 bg-yellow-100 dark:bg-yellow-950 px-4 py-3 text-sm font-medium text-yellow-800 dark:text-yellow-200">
          <AlertTriangle className="h-4 w-4" />
          Please enter fullscreen mode for the best exam experience
          <Button size="sm" variant="outline" onClick={requestFullscreen}>
            Enter Fullscreen
          </Button>
        </div>
      )}

      <div
        className={cn(
          'flex items-center justify-between border-b px-6 py-3',
          isCritical && 'animate-pulse',
        )}
      >
        <h2 className="text-lg font-semibold truncate max-w-[200px] sm:max-w-none">
          {exam.title}
        </h2>
        <div
          className={cn(
            'flex items-center gap-2 rounded-lg px-4 py-2 text-lg font-mono font-bold tabular-nums',
            isCritical
              ? 'bg-red-600 text-white'
              : isLowTime
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                : 'bg-muted text-foreground',
          )}
        >
          <Clock className="h-5 w-5" />
          {formatTime(timeRemaining)}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {questions.map((q, i) => (
            <Card key={q.id}>
              <CardContent className="space-y-4 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      Q{i + 1}
                    </span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                      {q.marks} {q.marks === 1 ? 'mark' : 'marks'}
                    </span>
                    {q.questionType === 'FILE_UPLOAD' && (
                      <span className="rounded-full bg-blue-100 dark:bg-blue-950 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-400">
                        File Upload
                      </span>
                    )}
                  </div>
                </div>

                {q.imageUrl && (
                  <div className="rounded-lg border overflow-hidden mb-3">
                    <img
                      src={q.imageUrl}
                      alt="Question"
                      className="max-h-48 w-full object-contain bg-muted"
                    />
                  </div>
                )}

                <p className="text-base leading-relaxed">{q.stem}</p>

                {q.questionType === 'TEXT' && (
                  <div className="space-y-2">
                    <textarea
                      value={answers[q.id] ?? ''}
                      onChange={(e) =>
                        setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                      }
                      rows={6}
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Type your answer here..."
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {countWords(answers[q.id] ?? '')} words
                    </p>
                  </div>
                )}

                {q.questionType === 'FILE_UPLOAD' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 cursor-pointer rounded-md border border-dashed border-muted-foreground/30 px-4 py-3 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                        <Upload className="h-4 w-4" />
                        {uploadingFiles.has(q.id) ? 'Uploading...' : 'Upload PDF'}
                        <input
                          type="file"
                          accept=".pdf"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(q.id, file);
                          }}
                          disabled={uploadingFiles.has(q.id)}
                        />
                      </label>
                      {uploadingFiles.has(q.id) && (
                        <span className="text-sm text-muted-foreground animate-pulse">
                          Uploading...
                        </span>
                      )}
                    </div>
                    {uploadedFiles[q.id] && (
                      <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 text-sm">
                        <FileText className="h-4 w-4 text-blue-500" />
                        <a
                          href={uploadedFiles[q.id]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline truncate"
                        >
                          {uploadedFiles[q.id]?.split('/').pop() ?? 'Uploaded file'}
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {q.questionType === 'MCQ_OPTION' && (
                  <textarea
                    value={answers[q.id] ?? ''}
                    onChange={(e) =>
                      setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                    }
                    rows={4}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="Type your answer here..."
                  />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between border-t px-6 py-3">
        <span className="text-sm text-muted-foreground">
          {answeredCount}/{totalQuestions} answered
        </span>

        <AlertDialog
          open={submitDialogOpen}
          onOpenChange={setSubmitDialogOpen}
        >
          <Button
            variant="destructive"
            size="lg"
            onClick={() => setSubmitDialogOpen(true)}
            className="ml-auto"
          >
            Submit Exam
          </Button>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Submit Exam?</AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                <p>Are you sure? You cannot undo this action.</p>
                <div className="rounded-lg border p-3 text-sm">
                  <div className="flex items-center justify-between py-1">
                    <span>Answered</span>
                    <span className="font-semibold">{answeredCount}</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span>Unanswered</span>
                    <span className="font-semibold text-destructive">
                      {totalQuestions - answeredCount}
                    </span>
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Exam'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
