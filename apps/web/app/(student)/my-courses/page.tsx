'use client';

import {
  Card,
  CardContent,
  Skeleton,
  Badge,
  Button,
  Input,
} from '@ris-academy/ui';
import {
  BookOpen,
  Search,
  Pencil,
  Trash2,
  Play,
  GraduationCap,
  Clock,
} from 'lucide-react';
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

type AdminCourseItem = {
  id: string;
  title: string;
  subject: string;
  type: 'FREE' | 'PAID';
  price: number;
  isPublished: boolean;
  thumbnail: string | null;
  _count: { enrollments: number };
};

type EnrolledCourseItem = {
  id: string;
  title: string;
  subject: string;
  thumbnail: string | null;
  type: 'FREE' | 'PAID';
  progress: number;
  completed: boolean;
  enrolledAt: string;
};

type MyCoursesResponse = {
  success: boolean;
  data: {
    courses: AdminCourseItem[] | EnrolledCourseItem[];
    role: string;
  };
  error?: string;
};

export default function MyCoursesPage() {
  const [courses, setCourses] = useState<AdminCourseItem[] | EnrolledCourseItem[]>([]);
  const [role, setRole] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/courses/my');
      if (!res.ok) throw new Error('Failed to fetch courses');
      const json: MyCoursesResponse = await res.json();
      setCourses(json.data.courses);
      setRole(json.data.role);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, []);

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
      setCourses((prev) => (prev as Array<{ id: string }>).filter((c) => c.id !== deleteId) as typeof prev);
      setDeleteId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setDeleting(false);
    }
  };

  const adminCourses = courses as AdminCourseItem[];
  const enrolledCourses = courses as EnrolledCourseItem[];

  const filteredAdminCourses = isAdmin
    ? adminCourses.filter(
        (c) =>
          !search ||
          c.title.toLowerCase().includes(search.toLowerCase()) ||
          c.subject.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  const filteredEnrolledCourses = isAdmin
    ? []
    : enrolledCourses.filter(
        (c) =>
          !search ||
          c.title.toLowerCase().includes(search.toLowerCase()) ||
          c.subject.toLowerCase().includes(search.toLowerCase())
      );

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isAdmin ? 'All Courses' : 'My Courses'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isAdmin
              ? 'Manage all courses — edit, delete, or create new ones'
              : 'Your enrolled courses — continue where you left off'}
          </p>
        </div>
        {isAdmin && (
          <Button asChild>
            <Link href="/admin/courses/new">
              <BookOpen className="mr-2 h-4 w-4" />
              Create Course
            </Link>
          </Button>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={isAdmin ? 'Search all courses...' : 'Search your courses...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <GraduationCap className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-lg font-medium text-muted-foreground">
              {isAdmin ? 'No courses yet' : "You're not enrolled in any courses yet"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {isAdmin ? (
                'Create your first course to get started'
              ) : (
                <>
                  Browse our{' '}
                  <Link href="/courses" className="font-medium text-saffron hover:underline">
                    course catalog
                  </Link>{' '}
                  and enroll today
                </>
              )}
            </p>
            {isAdmin && (
              <Button asChild className="mt-4">
                <Link href="/admin/courses/new">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Create Course
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : isAdmin ? (
        <>
          <Card>
            <CardContent className="p-0">
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
                    {filteredAdminCourses.map((course) => (
                      <tr key={course.id} className="border-b last:border-0 text-sm">
                        <td className="py-3 pl-6 font-medium">{course.title}</td>
                        <td className="py-3">{course.subject}</td>
                        <td className="py-3">
                          <Badge variant={course.type === 'FREE' ? 'success' : 'secondary'}>
                            {course.type === 'FREE' ? 'Free' : 'Paid'}
                          </Badge>
                        </td>
                        <td className="py-3 text-right tabular-nums">
                          {course.type === 'PAID' ? formatBDT(course.price) : '\u2014'}
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
            </CardContent>
          </Card>

          {search && filteredAdminCourses.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No courses match your search
            </p>
          )}
        </>
      ) : (
        <>
          {filteredEnrolledCourses.length === 0 && search ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No courses match your search
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredEnrolledCourses.map((course) => (
                <Link key={course.id} href={`/courses/${course.id}`} className="group">
                  <Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
                    <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-navy/20 to-navy/5">
                      {course.thumbnail ? (
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <BookOpen className="h-10 w-10 text-navy/30" />
                        </div>
                      )}
                      {course.completed && (
                        <div className="absolute right-2 top-2">
                          <Badge variant="success">Completed</Badge>
                        </div>
                      )}
                    </div>
                    <CardContent className="space-y-3 p-4">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="line-clamp-1 text-sm font-semibold group-hover:text-saffron">
                            {course.title}
                          </h3>
                          <Badge variant="outline" className="shrink-0 text-xs">
                            {course.subject}
                          </Badge>
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                          <Badge
                            variant={course.type === 'FREE' ? 'success' : 'secondary'}
                            className="text-xs"
                          >
                            {course.type === 'FREE' ? 'Free' : 'Paid'}
                          </Badge>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(course.enrolledAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium tabular-nums">{Math.round(course.progress)}%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-navy transition-all"
                            style={{ width: `${Math.min(100, Math.max(0, course.progress))}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <Button asChild size="sm" className="w-full text-xs">
                          <Link href={`/courses/${course.id}/learn`}>
                            <Play className="mr-1 h-3 w-3" />
                            Continue Learning
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </>
      )}

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
