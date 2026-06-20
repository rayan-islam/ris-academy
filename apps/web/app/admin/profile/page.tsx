'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Input,
  Label,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Badge,
  Skeleton,
  Separator,
} from '@ris-academy/ui';
import {
  Camera,
  Loader2,
  Upload,
  Shield,
  BookOpen,
  FileQuestion,
  GraduationCap,
  Users,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { cn, getInitials, formatDate } from '@/lib/utils';
import { z } from 'zod';

const adminProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().optional(),
  bio: z.string().optional(),
  image: z.string().url().optional().or(z.literal('')),
});

type AdminProfileFormData = z.infer<typeof adminProfileSchema>;

type AdminProfile = {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  bio: string | null;
  image: string | null;
  createdAt: string;
};

type AdminStats = {
  totalCourses: number;
  totalExams: number;
  totalStudents: number;
  totalCertificates: number;
};

export default function AdminProfilePage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<AdminProfileFormData>({
    resolver: zodResolver(adminProfileSchema),
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const [profileRes, statsRes] = await Promise.all([
          fetch('/api/users/me'),
          fetch('/api/admin/stats'),
        ]);

        if (profileRes.ok) {
          const json = await profileRes.json();
          const user = json.data ?? json.user ?? json;
          setProfile(user);
          reset({
            name: user.name || '',
            phone: user.phone || '',
            bio: user.bio || '',
            image: user.image || '',
          });
          setImageUrl(user.image || '');
        }

        if (statsRes.ok) {
          const json = await statsRes.json();
          setStats(json.data);
        }
      } catch {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [reset]);

  async function onSubmit(data: AdminProfileFormData) {
    setSaving(true);
    try {
      const res = await fetch('/api/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || 'Failed to update profile');
      }
      toast.success('Profile updated');
      setProfile((prev) => (prev ? { ...prev, ...data } : prev));
      reset(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'users');

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (!uploadRes.ok) {
        const errJson = await uploadRes.json().catch(() => null);
        throw new Error(errJson?.error || 'Upload failed');
      }
      const { url: publicUrl } = (await uploadRes.json()).data;

      setImageUrl(publicUrl);
      setValue('image', publicUrl, { shouldDirty: true });
      if (profile) {
        setProfile({ ...profile, image: publicUrl });
      }

      const saveRes = await fetch('/api/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: publicUrl }),
      });
      if (!saveRes.ok) throw new Error('Failed to save photo');
      toast.success('Photo updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <Skeleton className="h-80" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-lg font-medium text-destructive">Failed to load profile</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your admin account</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-6">
          <Card>
            <CardContent className="flex flex-col items-center pt-6">
              <Avatar className="h-28 w-28" key={profile.image || 'default'}>
                <AvatarImage src={profile.image ?? ''} alt={profile.name} />
                <AvatarFallback className="text-3xl">
                  {getInitials(profile.name)}
                </AvatarFallback>
              </Avatar>

              <h2 className="mt-4 text-lg font-semibold">{profile.name}</h2>
              <p className="text-sm text-muted-foreground">{profile.email}</p>

              <div className="mt-3">
                <Badge
                  variant={
                    profile.role === 'SUPER_ADMIN'
                      ? 'destructive'
                      : profile.role === 'ADMIN'
                        ? 'default'
                        : 'secondary'
                  }
                  className="gap-1"
                >
                  <Shield className="h-3 w-3" />
                  {profile.role.replace('_', ' ')}
                </Badge>
              </div>

              <Separator className="my-5" />

              <div className="w-full space-y-3">
                <Label htmlFor="photo-url">Photo URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="photo-url"
                    placeholder="https://example.com/photo.jpg"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="flex-1"
                  />
                  <label className="inline-flex cursor-pointer items-center gap-1 rounded-md border px-3 py-2 text-sm hover:bg-muted">
                    <Upload className="h-4 w-4" />
                    {uploadingPhoto ? '...' : 'Upload'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                      disabled={uploadingPhoto}
                    />
                  </label>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setValue('image', imageUrl, { shouldDirty: true });
                    if (profile) setProfile({ ...profile, image: imageUrl || null });
                    toast.success('Photo URL updated');
                  }}
                  type="button"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Change Photo
                </Button>
              </div>
            </CardContent>
          </Card>

          {stats && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Platform Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <BookOpen className="h-4 w-4" />
                    Courses
                  </span>
                  <span className="font-medium tabular-nums">{stats.totalCourses}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <FileQuestion className="h-4 w-4" />
                    Exams
                  </span>
                  <span className="font-medium tabular-nums">{stats.totalExams}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    Students
                  </span>
                  <span className="font-medium tabular-nums">{stats.totalStudents}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <GraduationCap className="h-4 w-4" />
                    Certificates
                  </span>
                  <span className="font-medium tabular-nums">{stats.totalCertificates}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </aside>

        <main className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="Your name"
                    {...register('name')}
                    className={cn(errors.name && 'border-destructive')}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={profile.email} disabled />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="01XXXXXXXXX"
                    {...register('phone')}
                    className={cn(errors.phone && 'border-destructive')}
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive">{errors.phone.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <textarea
                    id="bio"
                    rows={3}
                    placeholder="About yourself..."
                    {...register('bio')}
                    className={cn(
                      'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                      errors.bio && 'border-destructive'
                    )}
                  />
                  {errors.bio && (
                    <p className="text-sm text-destructive">{errors.bio.message}</p>
                  )}
                </div>

                <div className="space-y-2 rounded-md border p-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Role</span>
                  </div>
                  <Badge
                    variant={
                      profile.role === 'SUPER_ADMIN'
                        ? 'destructive'
                        : profile.role === 'ADMIN'
                          ? 'default'
                          : 'secondary'
                    }
                  >
                    {profile.role.replace('_', ' ')}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    Member since {formatDate(profile.createdAt)}
                  </p>
                </div>

                <Button type="submit" disabled={saving || !isDirty}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
