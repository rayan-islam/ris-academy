'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Skeleton,
  Badge,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ris-academy/ui';
import { BookOpen, Search, Filter, Clock, Users, Play } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { cn, formatBDT } from '@/lib/utils';
import { CourseFilters } from '@ris-academy/types';
import { toast } from 'sonner';

type CourseItem = {
  id: string;
  title: string;
  description: string;
  thumbnail: string | null;
  subject: string;
  type: 'FREE' | 'PAID';
  price: number;
  instructorName: string;
  instructorBio: string;
  createdAt: string;
  _count: { enrollments: number; chapters: number };
};

type CoursesResponse = {
  success: boolean;
  data: CourseItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  error?: string;
};

const SUBJECTS = [
  'Physics',
  'Chemistry',
  'Biology',
  'Math',
  'English',
  'ICT',
  'Bangla',
] as const;

const subjectGradients: Record<string, string> = {
  Physics: 'from-indigo-500 to-purple-600',
  Chemistry: 'from-emerald-500 to-teal-600',
  Biology: 'from-green-500 to-lime-600',
  Math: 'from-blue-500 to-cyan-600',
  English: 'from-rose-500 to-pink-600',
  ICT: 'from-orange-500 to-amber-600',
  Bangla: 'from-red-500 to-rose-600',
};

export default function CoursesPage() {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('');
  const [type, setType] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (subject) params.set('subject', subject);
      if (type) params.set('type', type);
      params.set('page', '1');
      params.set('limit', '12');

      const res = await fetch(`/api/courses?${params.toString()}`);
      const json: CoursesResponse = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to fetch courses');
      }

      setCourses(json.data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, subject, type]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const clearFilters = () => {
    setSearch('');
    setSubject('');
    setType('');
  };

  const hasActiveFilters = search || subject || type;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Explore Courses</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse our catalog and find your next lesson
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={subject} onValueChange={setSubject}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {SUBJECTS.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="FREE">Free</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-44 w-full rounded-none" />
              <CardContent className="space-y-3 p-5">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <div className="flex items-center gap-4 pt-1">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-9 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="flex flex-col items-center py-24 text-center">
          <BookOpen className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-lg font-medium">No courses found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try adjusting your search or clearing the filters.
          </p>
          {hasActiveFilters && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={clearFilters}
            >
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Link key={course.id} href={`/courses/${course.id}`}>
              <Card className="group h-full overflow-hidden transition-shadow hover:shadow-md">
                <div className="relative h-44">
                  <div
                    className={cn(
                      'flex h-full w-full items-center justify-center bg-gradient-to-br',
                      subjectGradients[course.subject] ||
                        'from-gray-500 to-gray-700',
                    )}
                  >
                    <Play className="h-12 w-12 text-white/80 transition-transform group-hover:scale-110" />
                  </div>
                  <Badge className="absolute left-3 top-3">
                    {course.subject}
                  </Badge>
                  <Badge
                    variant={course.type === 'FREE' ? 'default' : 'secondary'}
                    className={cn(
                      'absolute right-3 top-3',
                      course.type === 'FREE'
                        ? 'bg-green-500 text-white hover:bg-green-500'
                        : 'bg-amber-500 text-white hover:bg-amber-500',
                    )}
                  >
                    {course.type === 'FREE'
                      ? 'FREE'
                      : `PAID ${formatBDT(course.price)}`}
                  </Badge>
                </div>
                <CardContent className="flex h-[calc(100%-11rem)] flex-col p-5">
                  <CardTitle className="line-clamp-2 text-base leading-snug">
                    {course.title}
                  </CardTitle>
                  <CardDescription className="mt-1 line-clamp-2 text-xs">
                    {course.description || 'No description available'}
                  </CardDescription>
                  {course.instructorName && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {course.instructorName}
                    </p>
                  )}
                  <div className="mt-auto flex items-center gap-4 pt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Play className="h-3.5 w-3.5" />
                      {course._count.chapters} chapters
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {course._count.enrollments} students
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    className="mt-4 w-full"
                    asChild
                  >
                    <span>View Details</span>
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
