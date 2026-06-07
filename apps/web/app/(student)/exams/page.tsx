'use client';

import {
  Card,
  CardContent,
  Skeleton,
  Badge,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ris-academy/ui';
import {
  Clock,
  Award,
  FileQuestion,
  Filter,
  BookOpen,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type ExamItem = {
  id: string;
  title: string;
  description: string | null;
  subject: string;
  examType: 'MCQ' | 'WRITTEN';
  totalMarks: number;
  passPercentage: number | null;
  timeLimit: number;
  negativeMarking: number | null;
  allowRetake: boolean;
  instructions: string | null;
  isPublished: boolean;
  courseId: string | null;
  createdAt: string;
  _count: { questions: number; attempts: number };
  existingAttempt?: {
    id: string;
    status: string;
    score: number | null;
  } | null;
};

type ExamsResponse = {
  success: boolean;
  data: ExamItem[];
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

export default function ExamsPage() {
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState('');

  useEffect(() => {
    async function fetchExams() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (subject) params.set('subject', subject);

        const res = await fetch(`/api/exams?${params.toString()}`);
        const json: ExamsResponse = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Failed to fetch exams');
        }

        setExams(json.data);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Something went wrong';
        toast.error(message);
      } finally {
        setLoading(false);
      }
    }
    fetchExams();
  }, [subject]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Available Exams</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse and take exams to test your knowledge
        </p>
      </div>

      <Select value={subject} onValueChange={setSubject}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <Filter className="mr-2 h-4 w-4" />
          <SelectValue placeholder="All Subjects" />
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

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="space-y-3 p-6">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-5 w-32" />
                </div>
                <Skeleton className="h-4 w-20 rounded-full" />
                <div className="flex gap-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-9 w-28" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : exams.length === 0 ? (
        <div className="flex flex-col items-center py-24 text-center">
          <FileQuestion className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-lg font-medium">No exams available</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Check back later for new exams.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {exams.map((exam) => {
            const isCompleted =
              exam.existingAttempt?.status === 'COMPLETED';
            const subjectColor =
              subjectGradients[exam.subject] || 'from-gray-500 to-gray-700';
            const labelA = exam.subject.charAt(0).toUpperCase();

            return (
              <Card key={exam.id} className="flex flex-col">
                <CardContent className="flex flex-1 flex-col space-y-3 p-6">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-white text-sm font-bold',
                        subjectColor,
                      )}
                    >
                      {labelA}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold leading-tight truncate">
                        {exam.title}
                      </h3>
                    </div>
                  </div>

                  <Badge
                    variant={exam.examType === 'MCQ' ? 'success' : 'secondary'}
                    className="w-fit"
                  >
                    {exam.examType === 'MCQ' ? 'MCQ' : 'Written'}
                  </Badge>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {exam.timeLimit} mins
                    </span>
                    <span className="flex items-center gap-1">
                      <Award className="h-3.5 w-3.5" />
                      {exam.totalMarks} marks
                    </span>
                    {exam.examType === 'MCQ' && (
                      <span className="flex items-center gap-1">
                        <FileQuestion className="h-3.5 w-3.5" />
                        {exam._count.questions} questions
                      </span>
                    )}
                  </div>

                  <div className="mt-auto pt-2">
                    {isCompleted ? (
                      <div className="space-y-2">
                        {exam.existingAttempt?.score !== null &&
                          exam.existingAttempt?.score !== undefined && (
                            <div className="flex items-center gap-1.5 text-sm">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              <span className="font-medium text-green-600">
                                Score: {exam.existingAttempt.score}/
                                {exam.totalMarks}
                              </span>
                            </div>
                          )}
                        <Link href={`/exams/${exam.id}/result`}>
                          <Button variant="outline" className="w-full" asChild>
                            <span>View Result</span>
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <Link href={`/exams/${exam.id}`}>
                        <Button className="w-full" asChild>
                          <span>Start Exam</span>
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
