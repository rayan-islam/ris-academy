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
} from '@ris-academy/ui';
import {
  Clock,
  Flag,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type Question = {
  id: string;
  stem: string;
  imageUrl: string | null;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  difficulty: string | null;
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
  negativeMarking: number | null;
  allowRetake: boolean;
  questions: Question[];
};

type ExamResponse = {
  success: boolean;
  data: ExamData;
  error?: string;
};

const OPTIONS = ['A', 'B', 'C', 'D'] as const;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function ExamTakePage() {
  const params = useParams();
  const id = params.id as string;
  const [exam, setExam] = useState<ExamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fullscreenDenied, setFullscreenDenied] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);

  const initializedRef = useRef(false);
  const tabSwitchesRef = useRef(0);
  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
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
        if (data.examType !== 'MCQ') {
          throw new Error('Only MCQ exams are supported in this view');
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
          window.location.href = `/exams/${id}/result`;
        }
      } catch {
        // silently fail
      }
    }, 30000);

    return () => {
      if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
      if (timeCheckIntervalRef.current)
        clearInterval(timeCheckIntervalRef.current);
    };
  }, [totalQuestions, id]);

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
        selectedAnswer: currentAnswers[q.id] ?? null,
      }));
      await fetch(`/api/exams/${id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: payload, endTime: new Date().toISOString() }),
      });
      window.location.href = `/exams/${id}/result`;
    } catch {
      toast.error('Failed to submit exam');
    } finally {
      setSubmitting(false);
    }
  }, [exam, id]);

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
        selectedAnswer: answers[q.id] ?? null,
      }));
      const res = await fetch(`/api/exams/${id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: payload, endTime: new Date().toISOString() }),
      });
      const json: { success: boolean; error?: string } = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to submit');
      }
      setSubmitted(true);
      window.location.href = `/exams/${id}/result`;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to submit exam';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }, [exam, id, answers]);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => Math.min(prev + 1, totalQuestions - 1));
  }, [totalQuestions]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const selectAnswer = useCallback(
    (questionId: string, answer: string) => {
      setAnswers((prev) => ({ ...prev, [questionId]: answer }));
    },
    [],
  );

  const clearAnswer = useCallback((questionId: string) => {
    setAnswers((prev) => {
      const { [questionId]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const toggleFlag = useCallback((questionId: string) => {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  }, []);

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
        <Button onClick={() => (window.location.href = `/exams/${id}`)}>
          Go Back
        </Button>
      </div>
    );
  }

  if (!exam) return null;

  const questions = exam.questions;
  const currentQuestion = questions[currentIndex];
  if (!currentQuestion) return null;
  const answeredCount = Object.keys(answers).length;
  const flaggedCount = flagged.size;
  const unansweredCount = totalQuestions - answeredCount;

  const isLowTime = timeRemaining < 300;
  const isCritical = timeRemaining < 60;

  const getQuestionStatus = (q: Question) => {
    if (answers[q.id]) return 'answered';
    if (flagged.has(q.id)) return 'flagged';
    return 'unanswered';
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-navy-dark text-parchment/90">
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
          'flex items-center justify-between border-b border-parchment/10 px-6 py-3',
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

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col border-r">
          <div className="flex-1 overflow-auto p-6">
            <Card>
              <CardContent className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      Q{currentIndex + 1} of {totalQuestions}
                    </span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                      {currentQuestion.marks}{' '}
                      {currentQuestion.marks === 1 ? 'mark' : 'marks'}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleFlag(currentQuestion.id)}
                    className={cn(
                      'flex items-center gap-1 rounded-md px-3 py-1 text-sm font-medium transition-colors',
                      flagged.has(currentQuestion.id)
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                        : 'text-muted-foreground hover:bg-muted',
                    )}
                  >
                    <Flag
                      className={cn(
                        'h-4 w-4',
                        flagged.has(currentQuestion.id) && 'fill-current',
                      )}
                    />
                    {flagged.has(currentQuestion.id)
                      ? 'Flagged'
                      : 'Flag for Review'}
                  </button>
                </div>

                {currentQuestion.imageUrl && (
                  <div className="rounded-lg border overflow-hidden mb-4">
                    <img
                      src={currentQuestion.imageUrl}
                      alt="Question"
                      className="max-h-64 w-full object-contain bg-muted"
                    />
                  </div>
                )}

                <p className="text-lg leading-relaxed">
                  {currentQuestion.stem}
                </p>

                <div className="space-y-3">
                  {OPTIONS.map((opt) => {
                    const optionKey = `option${opt}` as keyof Question;
                    const optionText = currentQuestion[optionKey] as string;
                    const isSelected = answers[currentQuestion.id] === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => selectAnswer(currentQuestion.id, opt)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-colors',
                          isSelected
                            ? 'border-primary bg-primary/10 ring-1 ring-primary'
                            : 'border-border hover:bg-muted/50',
                        )}
                      >
                        <span
                          className={cn(
                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold',
                            isSelected
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-muted-foreground/30 text-muted-foreground',
                          )}
                        >
                          {opt}
                        </span>
                        <span className="text-sm">{optionText}</span>
                      </button>
                    );
                  })}
                </div>

                {answers[currentQuestion.id] && (
                  <button
                    onClick={() => clearAnswer(currentQuestion.id)}
                    className="text-sm text-muted-foreground hover:text-foreground underline"
                  >
                    Clear Selection
                  </button>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center justify-between border-t px-6 py-3">
            <Button
              variant="outline"
              onClick={goPrev}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={goNext}
              disabled={currentIndex >= totalQuestions - 1}
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="hidden w-64 shrink-0 flex-col border-l xl:flex">
          <div className="border-b px-4 py-3">
            <h3 className="text-sm font-semibold">Question Navigator</h3>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, i) => {
                const isCurrent = i === currentIndex;
                const status = getQuestionStatus(q);
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(i)}
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-full text-xs font-medium transition-colors',
                      isCurrent && 'ring-2 ring-primary ring-offset-2',
                      status === 'answered' &&
                        'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
                      status === 'flagged' &&
                        'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
                      status === 'unanswered' &&
                        'bg-muted text-muted-foreground',
                    )}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="space-y-2 border-t p-4">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-green-500" />
                <span className="text-muted-foreground">Answered</span>
              </span>
              <span className="font-medium">{answeredCount}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-amber-500" />
                <span className="text-muted-foreground">Flagged</span>
              </span>
              <span className="font-medium">{flaggedCount}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-muted-foreground/30" />
                <span className="text-muted-foreground">Unanswered</span>
              </span>
              <span className="font-medium">{unansweredCount}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t px-6 py-3">
        <div className="flex items-center gap-4 text-sm text-muted-foreground xl:hidden">
          <span>
            {answeredCount}/{totalQuestions} Answered
          </span>
          <span>{flaggedCount} Flagged</span>
        </div>

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
                    <span className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded-full bg-green-500" />
                      Answered
                    </span>
                    <span className="font-semibold">{answeredCount}</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded-full bg-amber-500" />
                      Flagged
                    </span>
                    <span className="font-semibold">{flaggedCount}</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded-full bg-muted-foreground/30" />
                      Unanswered
                    </span>
                    <span className="font-semibold text-destructive">
                      {unansweredCount}
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
