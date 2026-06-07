'use client';

import {
  Card,
  CardContent,
  Button,
  Input,
  Label,
  Badge,
  Skeleton,
} from '@ris-academy/ui';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Save,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { formatDate, cn } from '@/lib/utils';
import { toast } from 'sonner';

type AttemptItem = {
  id: string;
  score: number | null;
  totalMarks: number;
  status: string;
  submittedAt: string;
  startTime: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  writtenSubmission: {
    id: string;
    content: string | null;
    awardedMarks: number | null;
    teacherNotes: string | null;
    reviewedBy: string | null;
    reviewedAt: string | null;
  } | null;
};

export default function GradeExamPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.id as string;
  const [attempts, setAttempts] = useState<AttemptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [grading, setGrading] = useState<Record<string, boolean>>({});
  const [marksInput, setMarksInput] = useState<Record<string, number>>({});
  const [notesInput, setNotesInput] = useState<Record<string, string>>({});
  const [examTitle, setExamTitle] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const examRes = await fetch(`/api/admin/exams/${examId}`);
        if (examRes.ok) {
          const examJson = await examRes.json();
          setExamTitle(examJson.data?.title || '');
        }

        const res = await fetch(`/api/admin/submissions/${examId}?status=COMPLETED`);
        const json = await res.json();
        if (json.success) {
          setAttempts(json.data);

          const initialMarks: Record<string, number> = {};
          const initialNotes: Record<string, string> = {};
          for (const a of json.data) {
            initialMarks[a.id] = a.writtenSubmission?.awardedMarks ?? 0;
            initialNotes[a.id] = a.writtenSubmission?.teacherNotes || '';
          }
          setMarksInput(initialMarks);
          setNotesInput(initialNotes);
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [examId]);

  const handleSaveGrades = async (attemptId: string) => {
    setGrading((prev) => ({ ...prev, [attemptId]: true }));
    try {
      const res = await fetch(`/api/admin/submissions/${attemptId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          awardedMarks: marksInput[attemptId] ?? 0,
          teacherNotes: notesInput[attemptId] || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to save grades');
      }
      toast.success('Grades saved');

      setAttempts((prev) =>
        prev.map((a) =>
          a.id === attemptId
            ? {
                ...a,
                score: marksInput[attemptId] ?? null,
                writtenSubmission: {
                  ...a.writtenSubmission!,
                  awardedMarks: marksInput[attemptId] ?? null,
                  teacherNotes: notesInput[attemptId] || null,
                },
              }
            : a,
        ),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save grades');
    } finally {
      setGrading((prev) => ({ ...prev, [attemptId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-md" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Card>
          <CardContent className="p-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/exams">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Grade Submissions</h1>
          {examTitle && (
            <p className="mt-1 text-sm text-muted-foreground">{examTitle}</p>
          )}
        </div>
      </div>

      {attempts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No submissions to grade yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {attempts.map((attempt) => {
            const isGraded = attempt.writtenSubmission?.awardedMarks != null;
            const isExpanded = expandedId === attempt.id;

            let parsedAnswers: { questionId: string; content: string }[] = [];
            if (attempt.writtenSubmission?.content) {
              try {
                parsedAnswers = JSON.parse(attempt.writtenSubmission.content);
              } catch {
                // ignore
              }
            }

            return (
              <Card key={attempt.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium">{attempt.user.name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">{attempt.user.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={isGraded ? 'success' : 'secondary'}>
                          {isGraded ? 'Graded' : 'Pending'}
                        </Badge>
                        {isGraded && (
                          <span className="text-sm font-medium text-green-600">
                            {attempt.writtenSubmission!.awardedMarks}/{attempt.totalMarks}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        Submitted {formatDate(attempt.submittedAt || attempt.startTime)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedId(isExpanded ? null : attempt.id)}
                      >
                        {isExpanded ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 space-y-4 border-t pt-4">
                      {parsedAnswers.length > 0 ? (
                        <div className="space-y-3">
                          {parsedAnswers.map((answer, i) => (
                            <div
                              key={answer.questionId}
                              className="rounded-lg border bg-muted/50 p-4"
                            >
                              <p className="text-xs font-semibold text-muted-foreground mb-2">
                                Answer {i + 1}
                              </p>
                              <p className="text-sm whitespace-pre-line">
                                {answer.content || '(No answer provided)'}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No written answers submitted.
                        </p>
                      )}

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor={`marks-${attempt.id}`}>
                            Awarded Marks (max {attempt.totalMarks})
                          </Label>
                          <Input
                            id={`marks-${attempt.id}`}
                            type="number"
                            min={0}
                            max={attempt.totalMarks}
                            step={0.5}
                            value={marksInput[attempt.id] ?? 0}
                            onChange={(e) =>
                              setMarksInput((prev) => ({
                                ...prev,
                                [attempt.id]: Number(e.target.value),
                              }))
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`notes-${attempt.id}`}>Teacher Notes</Label>
                        <textarea
                          id={`notes-${attempt.id}`}
                          value={notesInput[attempt.id] ?? ''}
                          onChange={(e) =>
                            setNotesInput((prev) => ({
                              ...prev,
                              [attempt.id]: e.target.value,
                            }))
                          }
                          rows={3}
                          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          placeholder="Optional feedback for the student"
                        />
                      </div>

                      <div className="flex justify-end">
                        <Button
                          onClick={() => handleSaveGrades(attempt.id)}
                          disabled={grading[attempt.id]}
                        >
                          <Save className="mr-2 h-4 w-4" />
                          {grading[attempt.id] ? 'Saving...' : 'Save Grades'}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
