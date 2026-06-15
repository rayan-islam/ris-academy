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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Separator,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ris-academy/ui';
import {
  Camera,
  Loader2,
  Upload,
  Receipt,
  Award,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { cn, getInitials } from '@/lib/utils';
import { profileUpdateSchema } from '@/lib/validators';
import type { z } from 'zod';

type ProfileFormData = z.infer<typeof profileUpdateSchema>;

type UserProfile = {
  id: string;
  name: string;
  email: string;
  role: string;
  hscYear: string | null;
  institution: string | null;
  phone: string | null;
  bio: string | null;
  image: string | null;
};

export default function ProfilePage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
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
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileUpdateSchema),
  });

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch('/api/users/me');
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error || 'Failed to load profile');
        }
        const json = await res.json();
        const user = json.data ?? json.user ?? json;
        setProfile(user);
        reset({
          name: user.name || '',
          phone: user.phone || '',
          institution: user.institution || '',
          hscYear: user.hscYear || undefined,
          bio: user.bio || '',
          image: user.image || '',
        });
        setImageUrl(user.image || '');
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Something went wrong';
        toast.error(message);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [reset]);

  async function onSubmit(data: ProfileFormData) {
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
      toast.success('Profile updated successfully');
      setProfile((prev) =>
        prev ? { ...prev, ...data } : prev
      );
      reset(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  function handleChangePhoto() {
    setValue('image', imageUrl, { shouldDirty: true });
    if (profile) {
      setProfile({ ...profile, image: imageUrl || null });
    }
    toast.success('Photo URL updated');
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
      const { url: publicUrl } = await uploadRes.json();

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
      if (!saveRes.ok) throw new Error('Failed to save photo to profile');

      toast.success('Photo uploaded');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (loading) return null;

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-lg font-medium text-destructive">Failed to load profile</p>
        <p className="mt-2 text-sm text-muted-foreground">Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-6">
          <Card>
            <CardContent className="flex flex-col items-center pt-6">
              <Avatar className="h-28 w-28">
                <AvatarImage src={profile.image ?? ''} alt={profile.name} />
                <AvatarFallback className="text-3xl">
                  {getInitials(profile.name)}
                </AvatarFallback>
              </Avatar>

              <h2 className="mt-4 text-lg font-semibold">{profile.name}</h2>
              <p className="text-sm text-muted-foreground">{profile.email}</p>

              <div className="mt-3 flex flex-wrap justify-center gap-2">
                <Badge variant={profile.role === 'ADMIN' || profile.role === 'SUPER_ADMIN' ? 'destructive' : 'default'}>
                  {profile.role}
                </Badge>
                {profile.hscYear && (
                  <Badge variant="secondary">
                    HSC {profile.hscYear === '1st' ? '1st' : '2nd'} Year
                  </Badge>
                )}
              </div>

              {profile.institution && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {profile.institution}
                </p>
              )}

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
                    {uploadingPhoto ? 'Uploading...' : 'Upload'}
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
                  </label>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleChangePhoto}
                  type="button"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Change Photo
                </Button>
              </div>
            </CardContent>
          </Card>
        </aside>

        <main>
          <Tabs defaultValue="profile">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="profile">Profile Information</TabsTrigger>
              <TabsTrigger value="payments">Payment History</TabsTrigger>
              <TabsTrigger value="certificates">Certificates</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your personal details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="space-y-5"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        placeholder="Your name"
                        {...register('name')}
                        className={cn(errors.name && 'border-destructive')}
                      />
                      {errors.name && (
                        <p className="text-sm text-destructive">
                          {errors.name.message}
                        </p>
                      )}
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
                        <p className="text-sm text-destructive">
                          {errors.phone.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="institution">Institution</Label>
                      <Input
                        id="institution"
                        placeholder="Your college"
                        {...register('institution')}
                        className={cn(
                          errors.institution && 'border-destructive'
                        )}
                      />
                      {errors.institution && (
                        <p className="text-sm text-destructive">
                          {errors.institution.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="hscYear">HSC Year</Label>
                      <Select
                        onValueChange={(value) =>
                          setValue('hscYear', value as '1st' | '2nd', {
                            shouldDirty: true,
                          })
                        }
                      >
                        <SelectTrigger
                          id="hscYear"
                          className={cn(
                            errors.hscYear && 'border-destructive'
                          )}
                        >
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1st">1st Year</SelectItem>
                          <SelectItem value="2nd">2nd Year</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.hscYear && (
                        <p className="text-sm text-destructive">
                          {errors.hscYear.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <textarea
                        id="bio"
                        rows={4}
                        placeholder="Tell us about yourself..."
                        {...register('bio')}
                        className={cn(
                          'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                          errors.bio && 'border-destructive'
                        )}
                      />
                      {errors.bio && (
                        <p className="text-sm text-destructive">
                          {errors.bio.message}
                        </p>
                      )}
                    </div>

                    <Button type="submit" disabled={saving || !isDirty}>
                      {saving && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Save Changes
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payments">
              <Card>
                <CardContent className="flex flex-col items-center py-12 text-center">
                  <Receipt className="mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-lg font-medium">No payments yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Your payment history will appear here. (Phase 2)
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="certificates">
              <Card>
                <CardContent className="flex flex-col items-center py-12 text-center">
                  <Award className="mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-lg font-medium">No certificates yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Complete courses and exams to earn certificates.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
