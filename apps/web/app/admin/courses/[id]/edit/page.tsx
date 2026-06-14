'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
} from '@ris-academy/ui';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Pencil,
  ChevronDown,
  ChevronRight,
  Play,
  Clock,
  Upload,
} from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { courseCreateSchema } from '@/lib/validators';
import { z } from 'zod';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { formatDuration, formatBDT } from '@/lib/utils';
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

type FormData = z.infer<typeof courseCreateSchema>;

type CourseDetails = {
  id: string;
  title: string;
  description: string;
  thumbnail: string | null;
  subject: string;
  type: 'FREE' | 'PAID';
  price: number;
  instructorName: string;
  instructorBio: string;
  isPublished: boolean;
  chapters: ChapterWithVideos[];
};

type ChapterWithVideos = {
  id: string;
  title: string;
  order: number;
  videos: VideoItem[];
};

type VideoItem = {
  id: string;
  title: string;
  videoUrl: string;
  duration: number;
  order: number;
};

const SUBJECTS = ['Physics', 'Chemistry', 'Biology', 'Math', 'English', 'ICT', 'Bangla'] as const;

export default function EditCoursePage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [addChapterOpen, setAddChapterOpen] = useState(false);
  const [chapterTitle, setChapterTitle] = useState('');
  const [chapterOrder, setChapterOrder] = useState(0);
  const [savingChapter, setSavingChapter] = useState(false);

  const [addVideoChapterId, setAddVideoChapterId] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoOrder, setVideoOrder] = useState(0);
  const [savingVideo, setSavingVideo] = useState(false);

  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(courseCreateSchema),
  });

  const courseType = watch('type');
  const isPublished = watch('isPublished' as any) as boolean;

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingThumbnail(true);
    try {
      const presignedRes = await fetch('/api/upload/presigned-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          folder: 'courses',
        }),
      });
      if (!presignedRes.ok) throw new Error('Failed to get upload URL');
      const { uploadUrl, publicUrl } = await presignedRes.json();

      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      setValue('thumbnail', publicUrl);
      toast.success('Thumbnail uploaded');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const fetchCourse = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/courses/${courseId}`);
      if (!res.ok) throw new Error('Failed to fetch course');
      const json = await res.json();
      const c = json.data as CourseDetails;
      setCourse(c);
      reset({
        title: c.title,
        description: c.description || '',
        subject: c.subject,
        type: c.type,
        price: c.price || 0,
        instructorName: c.instructorName || '',
        instructorBio: c.instructorBio || '',
        thumbnail: c.thumbnail || '',
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [courseId, reset]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  const onSubmit = async (formData: FormData) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/courses/${courseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || 'Failed to update course');
      }
      toast.success('Course updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (value: boolean) => {
    try {
      const res = await fetch(`/api/admin/courses/${courseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: value }),
      });
      if (!res.ok) throw new Error('Failed to update');
      toast.success(value ? 'Course published' : 'Course unpublished');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    }
  };

  const handleDeleteCourse = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/courses/${courseId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete course');
      toast.success('Course deleted');
      router.push('/admin/courses');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setDeleting(false);
    }
  };

  const handleAddChapter = async () => {
    if (!chapterTitle.trim()) return;
    setSavingChapter(true);
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/chapters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: chapterTitle, order: chapterOrder }),
      });
      if (!res.ok) throw new Error('Failed to add chapter');
      toast.success('Chapter added');
      setChapterTitle('');
      setChapterOrder(0);
      setAddChapterOpen(false);
      fetchCourse();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSavingChapter(false);
    }
  };

  const handleDeleteChapter = async (chapterId: string) => {
    try {
      const res = await fetch(`/api/admin/chapters/${chapterId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete chapter');
      toast.success('Chapter deleted');
      fetchCourse();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    }
  };

  const handleAddVideo = async (chapterId: string) => {
    if (!videoTitle.trim() || !videoUrl.trim()) return;
    setSavingVideo(true);
    try {
      const res = await fetch(`/api/admin/chapters/${chapterId}/videos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: videoTitle,
          videoUrl,
          duration: videoDuration,
          order: videoOrder,
        }),
      });
      if (!res.ok) throw new Error('Failed to add video');
      toast.success('Video added');
      setVideoTitle('');
      setVideoUrl('');
      setVideoDuration(0);
      setVideoOrder(0);
      setAddVideoChapterId(null);
      fetchCourse();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSavingVideo(false);
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    try {
      const res = await fetch(`/api/admin/videos/${videoId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete video');
      toast.success('Video deleted');
      fetchCourse();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    }
  };

  const toggleChapter = (id: string) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-md" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="h-10 w-80" />
        <Card>
          <CardContent className="p-6 space-y-5">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-10 w-40" />
              <Skeleton className="h-10 w-20" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/courses">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Edit Course</h1>
            {course && (
              <p className="mt-1 text-sm text-muted-foreground">{course.title}</p>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="chapters">Chapters &amp; Videos</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
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
                    rows={4}
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
                    <Label htmlFor="type">Type</Label>
                    <Controller
                      name="type"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="FREE">Free</SelectItem>
                            <SelectItem value="PAID">Paid</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>

                {courseType === 'PAID' && (
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (BDT)</Label>
                    <Input
                      id="price"
                      type="number"
                      {...register('price', { valueAsNumber: true })}
                    />
                    {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="instructorName">Instructor Name</Label>
                    <Input id="instructorName" {...register('instructorName')} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="thumbnail">Thumbnail URL</Label>
                    <div className="flex gap-2">
                      <Input id="thumbnail" {...register('thumbnail')} placeholder="https://..." className="flex-1" />
                      <label className="inline-flex cursor-pointer items-center gap-1 rounded-md border px-3 py-2 text-sm hover:bg-muted">
                        <Upload className="h-4 w-4" />
                        {uploadingThumbnail ? 'Uploading...' : 'Upload'}
                        <input type="file" accept="image/*" className="hidden" onChange={handleThumbnailUpload} disabled={uploadingThumbnail} />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instructorBio">Instructor Bio</Label>
                  <textarea
                    id="instructorBio"
                    {...register('instructorBio')}
                    rows={3}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={saving}>
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button variant="destructive" type="button" onClick={() => setDeleteOpen(true)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Course
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chapters" className="mt-4">
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Chapters</h2>
              <Button size="sm" onClick={() => setAddChapterOpen(!addChapterOpen)}>
                <Plus className="mr-1 h-4 w-4" />
                Add Chapter
              </Button>
            </div>

            {addChapterOpen && (
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="space-y-2">
                    <Label>Chapter Title</Label>
                    <Input value={chapterTitle} onChange={(e) => setChapterTitle(e.target.value)} placeholder="Chapter title" />
                  </div>
                  <div className="space-y-2">
                    <Label>Order</Label>
                    <Input type="number" value={chapterOrder} onChange={(e) => setChapterOrder(Number(e.target.value))} placeholder="0" />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleAddChapter} disabled={savingChapter}>
                      {savingChapter ? 'Adding...' : 'Add'}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setAddChapterOpen(false)}>Cancel</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {course?.chapters && course.chapters.length > 0 ? (
              <div className="space-y-2">
                {course.chapters.map((chapter) => {
                  const isExpanded = expandedChapters.has(chapter.id);
                  return (
                    <Card key={chapter.id}>
                      <div className="flex items-center justify-between p-4">
                        <button
                          type="button"
                          className="flex items-center gap-2 text-left flex-1"
                          onClick={() => toggleChapter(chapter.id)}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                          <div>
                            <p className="font-medium">{chapter.title}</p>
                            <p className="text-xs text-muted-foreground">
                              Order: {chapter.order} &middot; {chapter.videos.length} videos
                            </p>
                          </div>
                        </button>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setAddVideoChapterId(addVideoChapterId === chapter.id ? null : chapter.id);
                              setVideoOrder(chapter.videos.length);
                            }}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteChapter(chapter.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>

                      {addVideoChapterId === chapter.id && (
                        <div className="border-t px-4 py-3 space-y-3">
                          <div className="space-y-2">
                            <Label>Video Title</Label>
                            <Input value={videoTitle} onChange={(e) => setVideoTitle(e.target.value)} placeholder="Video title" />
                          </div>
                          <div className="space-y-2">
                            <Label>Video URL</Label>
                            <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://..." />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label>Duration (seconds)</Label>
                              <Input type="number" value={videoDuration} onChange={(e) => setVideoDuration(Number(e.target.value))} placeholder="0" />
                            </div>
                            <div className="space-y-2">
                              <Label>Order</Label>
                              <Input type="number" value={videoOrder} onChange={(e) => setVideoOrder(Number(e.target.value))} placeholder="0" />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleAddVideo(chapter.id)} disabled={savingVideo}>
                              {savingVideo ? 'Adding...' : 'Add Video'}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setAddVideoChapterId(null)}>Cancel</Button>
                          </div>
                        </div>
                      )}

                      {isExpanded && chapter.videos.length > 0 && (
                        <div className="border-t">
                          {chapter.videos.map((video, idx) => (
                            <div
                              key={video.id}
                              className="flex items-center justify-between px-6 py-3 border-b last:border-0 text-sm"
                            >
                              <div className="flex items-center gap-3">
                                <Play className="h-3.5 w-3.5 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">{video.title}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Order: {video.order}
                                    {video.duration > 0 && (
                                      <>
                                        {' '}&middot;{' '}
                                        <span className="inline-flex items-center gap-1">
                                          <Clock className="h-3 w-3" />
                                          {formatDuration(video.duration)}
                                        </span>
                                      </>
                                    )}
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteVideo(video.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No chapters yet. Click &quot;Add Chapter&quot; to get started.
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="mt-4 max-w-2xl">
          <Card>
            <CardContent className="space-y-5 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Publish Status</p>
                  <p className="text-sm text-muted-foreground">
                    {course?.isPublished ? 'This course is visible to students' : 'Only admins can see this course'}
                  </p>
                </div>
                <Switch
                  checked={course?.isPublished ?? false}
                  onCheckedChange={togglePublish}
                />
              </div>

              <div>
                <p className="font-medium">Danger Zone</p>
                <p className="mb-3 text-sm text-muted-foreground">
                  Permanently delete this course and all associated data.
                </p>
                <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Course
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Course</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this course? All chapters, videos, and enrollments will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={handleDeleteCourse}
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
