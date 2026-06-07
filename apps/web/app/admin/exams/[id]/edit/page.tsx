'use client';

import {
  Card,
  CardContent,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Switch,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@ris-academy/ui';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Pencil,
  ChevronUp,
  ChevronDown,
  Eye,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { examCreateSchema } from '@/lib/validators';
import { z } from 'zod';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { formatDate, cn } from '@/lib/utils';

type FormData = z.infer<typeof examCreateSchema>;

type ExamDetails = {
  id: string;
  title: string;
  description: string | null;
  subject: string;
  chapter: string | null;
  examType: 'MCQ' | 'WRITTEN';
  totalMarks: number;
  passPercentage: number | null;
  timeLimit: number;
  negativeMarking: number | null;
  allowRetake: boolean;
  instructions: string | null;
  courseId: string | null;
  isPublished: boolean;
  questions: QuestionItem[];
};

type QuestionItem = {
  id: string;
  stem: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  explanation: string | null;
  difficulty: string | null;
  marks: number;
  order: number;
};

type SubmissionItem = {
  id: string;
  studentName: string;
  studentEmail: string;
  score: number;
  totalMarks: number;
  status: string;
  submittedAt: string;
};

const SUBJECTS = ['Physics', 'Chemistry', 'Biology', 'Math', 'English', 'ICT', 'Bangla'] as const;

const difficultyVariant: Record<string, 'success' | 'warning' | 'destructive'> = {
  EASY: 'success',
  MEDIUM: 'warning',
  HARD: 'destructive',
};

export default function EditExamPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;

  const [exam, setExam] = useState<ExamDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null);

  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionItem | null>(null);
  const [savingQuestion, setSavingQuestion] = useState(false);

  const [newStem, setNewStem] = useState('');
  const [newOptionA, setNewOptionA] = useState('');
  const [newOptionB, setNewOptionB] = useState('');
  const [newOptionC, setNewOptionC] = useState('');
  const [newOptionD, setNewOptionD] = useState('');
  const [newCorrect, setNewCorrect] = useState('A');
  const [newExplanation, setNewExplanation] = useState('');
  const [newDifficulty, setNewDifficulty] = useState('MEDIUM');
  const [newMarks, setNewMarks] = useState(1);
  const [newOrder, setNewOrder] = useState(0);

  const {
    register,
    handleSubmit,
    watch,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(examCreateSchema),
  });

  const examType = watch('examType');

  const fetchExam = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/exams/${examId}`);
      if (!res.ok) throw new Error('Failed to fetch exam');
      const json = await res.json();
      const e = json.data as ExamDetails;
      setExam(e);
      reset({
        title: e.title,
        description: e.description || '',
        subject: e.subject,
        chapter: e.chapter || '',
        examType: e.examType,
        totalMarks: e.totalMarks,
        passPercentage: e.passPercentage || 33,
        timeLimit: e.timeLimit,
        negativeMarking: e.negativeMarking || 0,
        allowRetake: e.allowRetake,
        instructions: e.instructions || '',
        courseId: e.courseId || '',
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [examId, reset]);

  useEffect(() => {
    fetchExam();
  }, [fetchExam]);

  const fetchSubmissions = async () => {
    setSubmissionsLoading(true);
    try {
      const res = await fetch(`/api/admin/submissions/${examId}`);
      if (!res.ok) throw new Error('Failed to fetch submissions');
      const json = await res.json();
      setSubmissions(json.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const onSubmit = async (formData: FormData) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/exams/${examId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || 'Failed to update exam');
      }
      toast.success('Exam updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (value: boolean) => {
    try {
      const res = await fetch(`/api/admin/exams/${examId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: value }),
      });
      if (!res.ok) throw new Error('Failed to update');
      toast.success(value ? 'Exam published' : 'Exam unpublished');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    }
  };

  const handleAddQuestion = async () => {
    if (!newStem.trim()) return;
    setSavingQuestion(true);
    try {
      const res = await fetch(`/api/admin/exams/${examId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stem: newStem,
          optionA: newOptionA,
          optionB: newOptionB,
          optionC: newOptionC,
          optionD: newOptionD,
          correctAnswer: newCorrect,
          explanation: newExplanation || undefined,
          difficulty: newDifficulty || 'MEDIUM',
          marks: newMarks,
          order: newOrder,
        }),
      });
      if (!res.ok) throw new Error('Failed to add question');
      toast.success('Question added');
      setQuestionDialogOpen(false);
      resetQuestionForm();
      fetchExam();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSavingQuestion(false);
    }
  };

  const handleUpdateQuestion = async () => {
    if (!editingQuestion || !newStem.trim()) return;
    setSavingQuestion(true);
    try {
      const res = await fetch(`/api/admin/questions/${editingQuestion.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stem: newStem,
          optionA: newOptionA,
          optionB: newOptionB,
          optionC: newOptionC,
          optionD: newOptionD,
          correctAnswer: newCorrect,
          explanation: newExplanation || undefined,
          difficulty: newDifficulty || 'MEDIUM',
          marks: newMarks,
          order: newOrder,
        }),
      });
      if (!res.ok) throw new Error('Failed to update question');
      toast.success('Question updated');
      setQuestionDialogOpen(false);
      setEditingQuestion(null);
      resetQuestionForm();
      fetchExam();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSavingQuestion(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    try {
      const res = await fetch(`/api/admin/questions/${questionId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete question');
      toast.success('Question deleted');
      fetchExam();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    }
  };

  const handleReorder = async (questionId: string, newOrder: number) => {
    try {
      const res = await fetch(`/api/admin/questions/${questionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: newOrder }),
      });
      if (!res.ok) throw new Error('Failed to reorder');
      fetchExam();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    }
  };

  const openEditQuestion = (q: QuestionItem) => {
    setEditingQuestion(q);
    setNewStem(q.stem);
    setNewOptionA(q.optionA);
    setNewOptionB(q.optionB);
    setNewOptionC(q.optionC);
    setNewOptionD(q.optionD);
    setNewCorrect(q.correctAnswer);
    setNewExplanation(q.explanation || '');
    setNewDifficulty(q.difficulty || 'MEDIUM');
    setNewMarks(q.marks);
    setNewOrder(q.order);
    setQuestionDialogOpen(true);
  };

  const openAddQuestion = () => {
    setEditingQuestion(null);
    resetQuestionForm();
    setNewOrder(exam?.questions?.length ?? 0);
    setQuestionDialogOpen(true);
  };

  const resetQuestionForm = () => {
    setNewStem('');
    setNewOptionA('');
    setNewOptionB('');
    setNewOptionC('');
    setNewOptionD('');
    setNewCorrect('A');
    setNewExplanation('');
    setNewDifficulty('MEDIUM');
    setNewMarks(1);
    setNewOrder(0);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-md" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="h-10 w-96" />
        <Card>
          <CardContent className="p-6 space-y-5">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-24 w-full" />
            <div className="flex gap-3">
              <Skeleton className="h-10 w-40" />
              <Skeleton className="h-10 w-20" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const questions = exam?.questions || [];
  const sortedQuestions = [...questions].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/exams">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Edit Exam</h1>
            {exam && (
              <p className="mt-1 text-sm text-muted-foreground">{exam.title}</p>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="submissions" onClick={fetchSubmissions}>
            Submissions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4 max-w-2xl">
          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" {...register('title')} />
                  {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    {...register('description')}
                    rows={3}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Controller
                      name="subject"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SUBJECTS.map((s) => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="examType">Exam Type</Label>
                    <Controller
                      name="examType"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MCQ">MCQ</SelectItem>
                            <SelectItem value="WRITTEN">Written</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="chapter">Chapter</Label>
                  <Input id="chapter" {...register('chapter')} />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="totalMarks">Total Marks</Label>
                    <Input
                      id="totalMarks"
                      type="number"
                      {...register('totalMarks', { valueAsNumber: true })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="passPercentage">Pass %</Label>
                    <Input
                      id="passPercentage"
                      type="number"
                      {...register('passPercentage', { valueAsNumber: true })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timeLimit">Time Limit (mins)</Label>
                    <Input
                      id="timeLimit"
                      type="number"
                      {...register('timeLimit', { valueAsNumber: true })}
                    />
                  </div>
                </div>

                {examType === 'MCQ' && (
                  <div className="space-y-2">
                    <Label htmlFor="negativeMarking">Negative Marking</Label>
                    <Input
                      id="negativeMarking"
                      type="number"
                      step="0.25"
                      {...register('negativeMarking', { valueAsNumber: true })}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="instructions">Instructions</Label>
                  <textarea
                    id="instructions"
                    {...register('instructions')}
                    rows={3}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Controller
                      name="allowRetake"
                      control={control}
                      render={({ field }) => (
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      )}
                    />
                    <Label>Allow Retake</Label>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={exam?.isPublished ?? false}
                      onCheckedChange={togglePublish}
                    />
                    <Label>Published</Label>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={saving}>
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="questions" className="mt-4">
          <div className="space-y-4 max-w-3xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Questions ({sortedQuestions.length})
              </h2>
              <Button size="sm" onClick={openAddQuestion}>
                <Plus className="mr-1 h-4 w-4" />
                Add Question
              </Button>
            </div>

            {sortedQuestions.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-sm text-muted-foreground">
                  No questions yet. Add your first question.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {sortedQuestions.map((q, idx) => (
                  <Card key={q.id}>
                    <div className="flex items-center gap-4 p-4">
                      <div className="flex flex-col items-center gap-1">
                        <button
                          type="button"
                          className="hover:text-primary disabled:opacity-30"
                          disabled={idx === 0}
                          onClick={() => handleReorder(q.id, q.order - 1)}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </button>
                        <span className="text-xs font-medium tabular-nums w-6 text-center">
                          {idx + 1}
                        </span>
                        <button
                          type="button"
                          className="hover:text-primary disabled:opacity-30"
                          disabled={idx === sortedQuestions.length - 1}
                          onClick={() => handleReorder(q.id, q.order + 1)}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{q.stem}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {q.difficulty && (
                            <Badge variant={difficultyVariant[q.difficulty] || 'secondary'} className="text-[10px]">
                              {q.difficulty}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            Answer: {q.correctAnswer}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Marks: {q.marks}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEditQuestion(q)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteQuestion(q.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="submissions" className="mt-4">
          <div className="space-y-4 max-w-4xl">
            <h2 className="text-lg font-semibold">Student Submissions</h2>

            {submissionsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : submissions.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-sm text-muted-foreground">
                  No submissions yet.
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-xs text-muted-foreground">
                        <th className="py-3 pl-6 text-left font-medium">Student</th>
                        <th className="py-3 text-left font-medium">Email</th>
                        <th className="py-3 text-right font-medium">Score</th>
                        <th className="py-3 text-center font-medium">Status</th>
                        <th className="py-3 text-right font-medium">Submitted</th>
                        <th className="py-3 pr-6 text-center font-medium">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map((sub) => (
                        <tr key={sub.id} className="border-b last:border-0 text-sm">
                          <td className="py-3 pl-6 font-medium">{sub.studentName}</td>
                          <td className="py-3 text-muted-foreground">{sub.studentEmail}</td>
                          <td className="py-3 text-right tabular-nums">
                            {sub.score}/{sub.totalMarks}
                          </td>
                          <td className="py-3 text-center">
                            <Badge
                              variant={sub.status === 'COMPLETED' ? 'success' : 'warning'}
                            >
                              {sub.status}
                            </Badge>
                          </td>
                          <td className="py-3 pr-6 text-right text-muted-foreground tabular-nums">
                            {formatDate(sub.submittedAt)}
                          </td>
                          <td className="py-3 pr-6 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setExpandedSubmission(
                                  expandedSubmission === sub.id ? null : sub.id,
                                )
                              }
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={questionDialogOpen} onOpenChange={setQuestionDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingQuestion ? 'Edit Question' : 'Add Question'}</DialogTitle>
            <DialogDescription>
              {editingQuestion
                ? 'Modify the question details below.'
                : 'Fill out the details for the new question.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <div className="space-y-2">
              <Label>Question Stem</Label>
              <textarea
                value={newStem}
                onChange={(e) => setNewStem(e.target.value)}
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Enter the question text"
              />
            </div>

            {['A', 'B', 'C', 'D'].map((opt) => {
              const val = opt === 'A' ? newOptionA : opt === 'B' ? newOptionB : opt === 'C' ? newOptionC : newOptionD;
              const setVal = opt === 'A' ? setNewOptionA : opt === 'B' ? setNewOptionB : opt === 'C' ? setNewOptionC : setNewOptionD;
              return (
                <div key={opt} className="space-y-2">
                  <Label>Option {opt}</Label>
                  <Input value={val} onChange={(e) => setVal(e.target.value)} placeholder={`Option ${opt}`} />
                </div>
              );
            })}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Correct Answer</Label>
                <Select value={newCorrect} onValueChange={setNewCorrect}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['A', 'B', 'C', 'D'].map((opt) => (
                      <SelectItem key={opt} value={opt}>Option {opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Select value={newDifficulty} onValueChange={setNewDifficulty}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EASY">Easy</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HARD">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Explanation</Label>
              <textarea
                value={newExplanation}
                onChange={(e) => setNewExplanation(e.target.value)}
                rows={2}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Explanation for the correct answer"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Marks</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={newMarks}
                  onChange={(e) => setNewMarks(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Order</Label>
                <Input
                  type="number"
                  value={newOrder}
                  onChange={(e) => setNewOrder(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setQuestionDialogOpen(false);
                setEditingQuestion(null);
                resetQuestionForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={editingQuestion ? handleUpdateQuestion : handleAddQuestion}
              disabled={savingQuestion}
            >
              {savingQuestion ? 'Saving...' : editingQuestion ? 'Update Question' : 'Add Question'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
