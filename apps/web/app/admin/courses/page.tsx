'use client';

import { Card, CardContent, CardHeader, CardTitle, Skeleton, Badge, Button, Input } from '@ris-academy/ui';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { formatBDT } from '@/lib/utils';
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

type CourseItem = {
  id: string;
  title: string;
  subject: string;
  type: 'FREE' | 'PAID';
  price: number;
  isPublished: boolean;
  _count: { enrollments: number };
};

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      const res = await fetch(`/api/admin/courses?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch courses');
      const json = await res.json();
      setCourses(json.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/courses/${deleteId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete course');
      toast.success('Course deleted');
      setCourses((prev) => prev.filter((c) => c.id !== deleteId));
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
          <h1 className="text-2xl font-bold tracking-tight">Manage Courses</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create, edit and manage your courses</p>
        </div>
        <Button asChild>
          <Link href="/admin/courses/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Course
          </Link>
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search courses..."
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
          ) : courses.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              {debouncedSearch ? 'No courses match your search' : 'No courses yet'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="py-3 pl-6 text-left font-medium">Title</th>
                    <th className="py-3 text-left font-medium">Subject</th>
                    <th className="py-3 text-left font-medium">Type</th>
                    <th className="py-3 text-right font-medium">Price</th>
                    <th className="py-3 text-center font-medium">Published</th>
                    <th className="py-3 text-right font-medium">Enrollments</th>
                    <th className="py-3 pr-6 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course) => (
                    <tr key={course.id} className="border-b last:border-0 text-sm">
                      <td className="py-3 pl-6 font-medium">{course.title}</td>
                      <td className="py-3">{course.subject}</td>
                      <td className="py-3">
                        <Badge
                          variant={course.type === 'FREE' ? 'success' : 'secondary'}
                        >
                          {course.type === 'FREE' ? 'Free' : 'Paid'}
                        </Badge>
                      </td>
                      <td className="py-3 text-right tabular-nums">
                        {course.type === 'PAID' ? formatBDT(course.price) : '—'}
                      </td>
                      <td className="py-3 text-center">
                        <Badge variant={course.isPublished ? 'success' : 'outline'}>
                          {course.isPublished ? 'Yes' : 'No'}
                        </Badge>
                      </td>
                      <td className="py-3 text-right tabular-nums">{course._count.enrollments}</td>
                      <td className="py-3 pr-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/courses/${course.id}/edit`}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteId(course.id)}
                          >
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
            <AlertDialogTitle>Delete Course</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this course? This action cannot be undone.
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
