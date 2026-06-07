'use client';

import { Card, CardContent, Button, Skeleton, Badge, Input } from '@ris-academy/ui';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
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

type ExamItem = {
  id: string;
  title: string;
  subject: string;
  examType: 'MCQ' | 'WRITTEN';
  isPublished: boolean;
  _count: { questions: number; attempts: number };
};

export default function AdminExamsPage() {
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchExams = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      const res = await fetch(`/api/admin/exams?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch exams');
      const json = await res.json();
      setExams(json.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/exams/${deleteId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete exam');
      toast.success('Exam deleted');
      setExams((prev) => prev.filter((e) => e.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manage Exams</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create and manage exams</p>
        </div>
        <Button asChild>
          <Link href="/admin/exams/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Exam
          </Link>
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search exams..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : exams.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              {debouncedSearch ? 'No exams match your search' : 'No exams yet'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="py-3 pl-6 text-left font-medium">Title</th>
                    <th className="py-3 text-left font-medium">Subject</th>
                    <th className="py-3 text-left font-medium">Type</th>
                    <th className="py-3 text-right font-medium">Questions</th>
                    <th className="py-3 text-center font-medium">Published</th>
                    <th className="py-3 text-right font-medium">Attempts</th>
                    <th className="py-3 pr-6 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {exams.map((exam) => (
                    <tr key={exam.id} className="border-b last:border-0 text-sm">
                      <td className="py-3 pl-6 font-medium">{exam.title}</td>
                      <td className="py-3">{exam.subject}</td>
                      <td className="py-3">
                        <Badge variant={exam.examType === 'MCQ' ? 'success' : 'secondary'}>
                          {exam.examType === 'MCQ' ? 'MCQ' : 'Written'}
                        </Badge>
                      </td>
                      <td className="py-3 text-right tabular-nums">{exam._count.questions}</td>
                      <td className="py-3 text-center">
                        <Badge variant={exam.isPublished ? 'success' : 'outline'}>
                          {exam.isPublished ? 'Yes' : 'No'}
                        </Badge>
                      </td>
                      <td className="py-3 text-right tabular-nums">{exam._count.attempts}</td>
                      <td className="py-3 pr-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/exams/${exam.id}/edit`}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteId(exam.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Exam</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this exam? All associated questions and submissions will also be removed.
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
