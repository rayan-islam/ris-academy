'use client';

import { Card, CardContent, Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Switch } from '@ris-academy/ui';
import { ArrowLeft, Save } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { examCreateSchema } from '@/lib/validators';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';
import { useState } from 'react';

type FormData = z.infer<typeof examCreateSchema>;

const SUBJECTS = ['Physics', 'Chemistry', 'Biology', 'Math', 'English', 'ICT', 'Bangla'] as const;

export default function CreateExamPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    control,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(examCreateSchema),
    defaultValues: {
      examType: 'MCQ',
      passPercentage: 33,
      negativeMarking: 0,
      allowRetake: false,
    },
  });

  const examType = watch('examType');

  const onSubmit = async (formData: FormData) => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || 'Failed to create exam');
      }
      const json = await res.json();
      toast.success('Exam created successfully');
      router.push(`/admin/exams/${json.data.id}/edit`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/exams">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Exam</h1>
          <p className="mt-1 text-sm text-muted-foreground">Add a new exam to your catalog</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" {...register('title')} placeholder="Exam title" />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                {...register('description')}
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Exam description"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Select onValueChange={(v) => setValue('subject', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBJECTS.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.subject && <p className="text-sm text-destructive">{errors.subject.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="examType">Exam Type</Label>
                <Select
                  value={examType}
                  onValueChange={(v) => setValue('examType', v as 'MCQ' | 'WRITTEN')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MCQ">MCQ</SelectItem>
                    <SelectItem value="WRITTEN">Written</SelectItem>
                  </SelectContent>
                </Select>
                {errors.examType && <p className="text-sm text-destructive">{errors.examType.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="chapter">Chapter</Label>
              <Input id="chapter" {...register('chapter')} placeholder="e.g. Thermodynamics" />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="totalMarks">Total Marks</Label>
                <Input
                  id="totalMarks"
                  type="number"
                  {...register('totalMarks', { valueAsNumber: true })}
                  placeholder="100"
                />
                {errors.totalMarks && <p className="text-sm text-destructive">{errors.totalMarks.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="passPercentage">Pass %</Label>
                <Input
                  id="passPercentage"
                  type="number"
                  {...register('passPercentage', { valueAsNumber: true })}
                  placeholder="33"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeLimit">Time Limit (mins)</Label>
                <Input
                  id="timeLimit"
                  type="number"
                  {...register('timeLimit', { valueAsNumber: true })}
                  placeholder="60"
                />
                {errors.timeLimit && <p className="text-sm text-destructive">{errors.timeLimit.message}</p>}
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
                  placeholder="0"
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
                placeholder="Instructions for students"
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
                <Label htmlFor="allowRetake">Allow Retake</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="courseId">Associated Course (optional)</Label>
              <Input id="courseId" {...register('courseId')} placeholder="Course ID" />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={submitting}>
                <Save className="mr-2 h-4 w-4" />
                {submitting ? 'Creating...' : 'Create Exam'}
              </Button>
              <Button variant="outline" type="button" asChild>
                <Link href="/admin/exams">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
