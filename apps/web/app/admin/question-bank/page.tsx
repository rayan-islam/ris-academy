'use client';

import {
  Card,
  CardContent,
  Skeleton,
  Badge,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Label,
} from '@ris-academy/ui';
import { Plus, Search, Pencil, Trash2, Database } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@ris-academy/ui';

type QuestionItem = {
  id: string;
  stem: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  explanation: string | null;
  difficulty: string;
  subject: string;
  chapter: string | null;
  source: string;
  usageCount: number;
  createdAt: string;
};

type PaginatedResponse = {
  success: boolean;
  data: QuestionItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

const SUBJECTS = ['Physics', 'Chemistry', 'Biology', 'Math', 'English', 'ICT'];
const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'];

const emptyForm = {
  stem: '',
  optionA: '',
  optionB: '',
  optionC: '',
  optionD: '',
  correctAnswer: 'A',
  explanation: '',
  difficulty: 'MEDIUM',
  subject: 'Physics',
  chapter: '',
};

export default function QuestionBankPage() {
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const limit = 20;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (subjectFilter !== 'all') params.set('subject', subjectFilter);
      if (difficultyFilter !== 'all') params.set('difficulty', difficultyFilter);
      params.set('page', String(page));
      params.set('limit', String(limit));

      const res = await fetch(`/api/admin/question-bank?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch questions');
      const json: PaginatedResponse = await res.json();
      setQuestions(json.data);
      setTotal(json.total);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, subjectFilter, difficultyFilter, page]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (q: QuestionItem) => {
    setEditingId(q.id);
    setForm({
      stem: q.stem,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || '',
      difficulty: q.difficulty,
      subject: q.subject,
      chapter: q.chapter || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.stem || !form.optionA || !form.optionB || !form.optionC || !form.optionD) {
      toast.error('All fields are required');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const res = await fetch(`/api/admin/question-bank/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error('Failed to update question');
        toast.success('Question updated');
      } else {
        const res = await fetch('/api/admin/question-bank', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error('Failed to create question');
        toast.success('Question created');
      }
      setDialogOpen(false);
      fetchQuestions();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/question-bank/${deleteId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete question');
      toast.success('Question deleted');
      setQuestions((prev) => prev.filter((q) => q.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.ceil(total / limit);
  const difficultyVariant = (d: string) =>
    d === 'EASY' ? 'success' : d === 'MEDIUM' ? 'secondary' : 'destructive';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Question Bank</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your MCQ question pool for exams</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Question
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search questions..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <Select value={subjectFilter} onValueChange={(v) => { setSubjectFilter(v); setPage(1); }}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {SUBJECTS.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={difficultyFilter} onValueChange={(v) => { setDifficultyFilter(v); setPage(1); }}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            {DIFFICULTIES.map((d) => (
              <SelectItem key={d} value={d}>{d.charAt(0) + d.slice(1).toLowerCase()}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : questions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Database className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="text-lg font-medium text-muted-foreground">No questions yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {debouncedSearch || subjectFilter !== 'all' || difficultyFilter !== 'all'
                  ? 'No questions match your filters'
                  : 'Add your first question to the bank'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground">
                      <th className="py-3 pl-6 text-left font-medium">Question</th>
                      <th className="py-3 text-left font-medium">Subject</th>
                      <th className="py-3 text-left font-medium">Chapter</th>
                      <th className="py-3 text-center font-medium">Difficulty</th>
                      <th className="py-3 text-center font-medium">Used</th>
                      <th className="py-3 pr-6 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {questions.map((q) => (
                      <tr key={q.id} className="border-b last:border-0 text-sm">
                        <td className="py-3 pl-6 max-w-xs">
                          <p className="line-clamp-2 font-medium">{q.stem}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Answer: {q.correctAnswer}
                          </p>
                        </td>
                        <td className="py-3">{q.subject}</td>
                        <td className="py-3 max-w-[120px]">
                          <span className="line-clamp-1 text-xs">{q.chapter || '\u2014'}</span>
                        </td>
                        <td className="py-3 text-center">
                          <Badge variant={difficultyVariant(q.difficulty) as any}>
                            {q.difficulty.charAt(0) + q.difficulty.slice(1).toLowerCase()}
                          </Badge>
                        </td>
                        <td className="py-3 text-center tabular-nums">
                          <Badge variant="outline">{q.usageCount}x</Badge>
                        </td>
                        <td className="py-3 pr-6 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openEdit(q)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setDeleteId(q.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t px-6 py-3">
                  <p className="text-sm text-muted-foreground">
                    Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                      Previous
                    </Button>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Question' : 'Add Question'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="stem">Question Stem</Label>
              <textarea
                id="stem"
                value={form.stem}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm({ ...form, stem: e.target.value })}
                placeholder="Enter the question..."
                rows={3}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {(['A', 'B', 'C', 'D'] as const).map((opt) => (
                <div key={opt} className="grid gap-1">
                  <Label>Option {opt}</Label>
                  <Input
                    value={form[`option${opt}` as keyof typeof form] as string}
                    onChange={(e) => setForm({ ...form, [`option${opt}`]: e.target.value })}
                    placeholder={`Option ${opt}`}
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1">
                <Label>Correct Answer</Label>
                <Select
                  value={form.correctAnswer}
                  onValueChange={(v) => setForm({ ...form, correctAnswer: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['A', 'B', 'C', 'D'].map((o) => (
                      <SelectItem key={o} value={o}>Option {o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1">
                <Label>Difficulty</Label>
                <Select
                  value={form.difficulty}
                  onValueChange={(v) => setForm({ ...form, difficulty: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIFFICULTIES.map((d) => (
                      <SelectItem key={d} value={d}>{d.charAt(0) + d.slice(1).toLowerCase()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1">
                <Label>Subject</Label>
                <Select
                  value={form.subject}
                  onValueChange={(v) => setForm({ ...form, subject: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBJECTS.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1">
                <Label>Chapter (optional)</Label>
                <Input
                  value={form.chapter}
                  onChange={(e) => setForm({ ...form, chapter: e.target.value })}
                  placeholder="e.g. Newton's Laws"
                />
              </div>
            </div>

            <div className="grid gap-1">
              <Label>Explanation (optional)</Label>
              <textarea
                value={form.explanation}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm({ ...form, explanation: e.target.value })}
                placeholder="Explain why this is the correct answer..."
                rows={2}
                className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this question? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
