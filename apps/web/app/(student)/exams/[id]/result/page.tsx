'use client';

import {
  Card,
  CardContent,
  Badge,
  Button,
  Skeleton,
} from '@ris-academy/ui';
import {
  CheckCircle2,
  XCircle,
  MinusCircle,
  Clock,
  Award,
  ArrowLeft,
  Trophy,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn, formatDuration } from '@/lib/utils';
import { toast } from 'sonner';

type AnswerItem = {
  questionId: string;
  stem: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  selectedAnswer: string | null;
  correctAnswer: string;
  isCorrect: boolean | null;
  explanation: string | null;
  marks: number;
  isFlagged: boolean;
};

type ResultData = {
  attempt: {
    id: string;
    status: string;
    score: number;
    totalMarks: number;
    correctCount: number;
    wrongCount: number;
    unattempted: number;
    startTime: string;
    endTime: string;
    submittedAt: string;
  };
  exam: {
    id: string;
    title: string;
    subject: string;
    totalMarks: number;
    passPercentage: number;
    negativeMarking: number | null;
  };
  answers: AnswerItem[];
  rank: number;
  totalParticipants: number;
  passed: boolean;
};

type ResultResponse = {
  success: boolean;
  data: ResultData;
  error?: string;
};

const OPTIONS = ['A', 'B', 'C', 'D'] as const;

export default function ExamResultPage() {
  const params = useParams();
  const id = params.id as string;
  const [result, setResult] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchResult() {
      try {
        const res = await fetch(`/api/exams/${id}/result`);
        const json: ResultResponse = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Failed to fetch result');
        }

        setResult(json.data);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Something went wrong';
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    }
    fetchResult();
  }, [id]);

  if (error) {
    return (
      <div className="mx-auto max-w-4xl">
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
      <div className="mx-auto max-w-4xl space-y-8">
        <Skeleton className="h-5 w-28" />
        <Card>
          <CardContent className="flex flex-col items-center space-y-4 p-8">
            <Skeleton className="h-36 w-36 rounded-full" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </CardContent>
        </Card>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="mt-2 h-6 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="space-y-4 p-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!result) return null;

  const { attempt, exam, answers, rank, totalParticipants, passed } = result;
  const percentage =
    attempt.totalMarks > 0
      ? Math.round((attempt.score / attempt.totalMarks) * 100)
      : 0;

  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (percentage / 100) * circumference;
  const isPassed = passed;

  const timeTakenSeconds =
    attempt.startTime && attempt.endTime
      ? Math.round(
          (new Date(attempt.endTime).getTime() -
            new Date(attempt.startTime).getTime()) /
            1000,
        )
      : 0;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <Link
        href="/exams"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Exams
      </Link>

      <h1 className="text-2xl font-bold">{exam.title} - Results</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardContent className="flex flex-col items-center p-8">
            <div className="relative">
              <svg width="160" height="160" className="-rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-muted/20"
                />
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="none"
                  strokeWidth="8"
                  strokeLinecap="round"
                  stroke="currentColor"
                  className={cn(
                    isPassed ? 'text-green-500' : 'text-red-500',
                  )}
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  style={{ transition: 'stroke-dashoffset 1s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className={cn(
                    'text-3xl font-bold',
                    isPassed ? 'text-green-600' : 'text-red-600',
                  )}
                >
                  {percentage}%
                </span>
              </div>
            </div>
            <p className="mt-4 text-sm font-medium text-muted-foreground">
              Score {attempt.score}/{attempt.totalMarks}
            </p>
            <Badge
              variant={isPassed ? 'success' : 'destructive'}
              className="mt-2"
            >
              {isPassed ? 'PASSED' : 'FAILED'}
            </Badge>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <CheckCircle2 className="h-8 w-8 text-green-500 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Correct</p>
                  <p className="text-xl font-bold">{attempt.correctCount}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <XCircle className="h-8 w-8 text-red-500 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Wrong</p>
                  <p className="text-xl font-bold">{attempt.wrongCount}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <MinusCircle className="h-8 w-8 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Unattempted</p>
                  <p className="text-xl font-bold">{attempt.unattempted}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <Clock className="h-8 w-8 text-blue-500 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Time</p>
                  <p className="text-xl font-bold">
                    {formatDuration(timeTakenSeconds)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {rank != null && totalParticipants > 0 && (
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <Trophy className="h-8 w-8 text-amber-500 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Your Rank</p>
                  <p className="text-lg font-semibold">
                    You ranked #{rank} out of {totalParticipants} students
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-xl font-semibold">Answer Review</h2>
        <div className="space-y-4">
          {answers.map((item, i) => {
            const isCorrect = item.isCorrect === true;
            const isWrong = item.isCorrect === false;
            const isUnattempted = item.selectedAnswer === null;

            return (
              <Card key={item.questionId}>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        Q{i + 1}
                      </span>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                        {item.marks}{' '}
                        {item.marks === 1 ? 'mark' : 'marks'}
                      </span>
                    </div>
                    {isCorrect && (
                      <Badge variant="success">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Correct
                      </Badge>
                    )}
                    {isWrong && (
                      <Badge variant="destructive">
                        <XCircle className="mr-1 h-3 w-3" />
                        Wrong
                      </Badge>
                    )}
                    {isUnattempted && (
                      <Badge variant="secondary">
                        <MinusCircle className="mr-1 h-3 w-3" />
                        Unattempted
                      </Badge>
                    )}
                  </div>

                  <p className="text-base leading-relaxed font-medium">
                    {item.stem}
                  </p>

                  <div className="space-y-2">
                    {OPTIONS.map((opt) => {
                      const text = item.options[opt];
                      const isCorrectOpt = item.correctAnswer === opt;
                      const isSelected = item.selectedAnswer === opt;
                      const isWrongSelected = isSelected && !isCorrectOpt;

                      return (
                        <div
                          key={opt}
                          className={cn(
                            'flex items-center gap-3 rounded-lg border p-3',
                            isCorrectOpt &&
                              'border-green-500 bg-green-50 dark:bg-green-950/30',
                            isWrongSelected &&
                              'border-red-500 bg-red-50 dark:bg-red-950/30',
                          )}
                        >
                          <span
                            className={cn(
                              'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold',
                              isCorrectOpt &&
                                'border-green-500 bg-green-500 text-white',
                              isWrongSelected &&
                                'border-red-500 bg-red-500 text-white',
                              !isCorrectOpt &&
                                !isWrongSelected &&
                                'border-muted-foreground/30 text-muted-foreground',
                            )}
                          >
                            {opt}
                          </span>
                          <span
                            className={cn(
                              'text-sm',
                              isWrongSelected && 'line-through text-red-600',
                              isCorrectOpt && 'font-bold text-green-700 dark:text-green-400',
                            )}
                          >
                            {text}
                          </span>
                          {isSelected && <span className="ml-auto text-xs text-muted-foreground">Your answer</span>}
                          {isCorrectOpt && !isSelected && (
                            <span className="ml-auto text-xs font-medium text-green-600">
                              Correct answer
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {item.explanation && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
                      <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">
                        Explanation
                      </p>
                      <p className="text-sm text-blue-800 dark:text-blue-300">
                        {item.explanation}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="flex justify-center pb-8">
        <Link href="/exams">
          <Button size="lg" variant="outline" asChild>
            <span>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Exams
            </span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
