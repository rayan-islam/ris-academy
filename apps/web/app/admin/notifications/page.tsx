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
import { Plus, Search, Trash2, Bell, Send } from 'lucide-react';
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

type NotificationItem = {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  link: string | null;
  createdAt: string;
  user: { name: string; email: string };
};

type PaginatedResponse = {
  success: boolean;
  data: NotificationItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

const NOTIF_TYPES = ['EXAM_RESULT', 'COURSE_NEW', 'PAYMENT', 'EXAM_REMINDER', 'GENERAL'];

const typeBadgeVariant = (type: string) => {
  switch (type) {
    case 'EXAM_RESULT': return 'success' as const;
    case 'COURSE_NEW': return 'default' as const;
    case 'PAYMENT': return 'secondary' as const;
    case 'EXAM_REMINDER': return 'warning' as const;
    default: return 'outline' as const;
  }
};

const emptyForm = { title: '', message: '', type: 'GENERAL', link: '' };

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [broadcast, setBroadcast] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const limit = 20;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (typeFilter !== 'all') params.set('type', typeFilter);
      params.set('page', String(page));
      params.set('limit', String(limit));

      const res = await fetch(`/api/admin/notifications?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch notifications');
      const json: PaginatedResponse = await res.json();
      setNotifications(json.data);
      setTotal(json.total);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, typeFilter, page]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleSend = async () => {
    if (!form.title || !form.message) {
      toast.error('Title and message are required');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: broadcast ? [] : undefined,
          ...form,
        }),
      });
      if (!res.ok) throw new Error('Failed to send notification');
      const json = await res.json();
      toast.success(
        broadcast
          ? `Broadcast sent to ${json.data.count} users`
          : 'Notification sent'
      );
      setDialogOpen(false);
      setForm(emptyForm);
      setBroadcast(true);
      fetchNotifications();
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
      const res = await fetch(`/api/admin/notifications/${deleteId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete notification');
      toast.success('Notification deleted');
      setNotifications((prev) => prev.filter((n) => n.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">Send and manage notifications to users</p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setBroadcast(true); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Send Notification
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search notifications..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {NOTIF_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t.replace(/_/g, ' ')}
              </SelectItem>
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
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Bell className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="text-lg font-medium text-muted-foreground">No notifications yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Send your first notification to users
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground">
                      <th className="py-3 pl-6 text-left font-medium">Title</th>
                      <th className="py-3 text-left font-medium">User</th>
                      <th className="py-3 text-center font-medium">Type</th>
                      <th className="py-3 text-center font-medium">Read</th>
                      <th className="py-3 text-left font-medium">Date</th>
                      <th className="py-3 pr-6 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notifications.map((n) => (
                      <tr key={n.id} className="border-b last:border-0 text-sm">
                        <td className="py-3 pl-6 max-w-xs">
                          <p className="line-clamp-1 font-medium">{n.title}</p>
                          <p className="line-clamp-1 text-xs text-muted-foreground">{n.message}</p>
                        </td>
                        <td className="py-3">
                          <p className="text-xs font-medium">{n.user.name}</p>
                          <p className="text-xs text-muted-foreground">{n.user.email}</p>
                        </td>
                        <td className="py-3 text-center">
                          <Badge variant={typeBadgeVariant(n.type)}>
                            {n.type.replace(/_/g, ' ')}
                          </Badge>
                        </td>
                        <td className="py-3 text-center">
                          <Badge variant={n.read ? 'success' : 'outline'}>
                            {n.read ? 'Read' : 'Unread'}
                          </Badge>
                        </td>
                        <td className="py-3 text-xs text-muted-foreground">
                          {new Date(n.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 pr-6 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteId(n.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
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
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Send Notification</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-1">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, title: e.target.value })}
                placeholder="Notification title"
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="message">Message</Label>
              <textarea
                id="message"
                value={form.message}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm({ ...form, message: e.target.value })}
                placeholder="Notification message..."
                rows={3}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NOTIF_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1">
                <Label htmlFor="link">Link (optional)</Label>
                <Input
                  id="link"
                  value={form.link}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, link: e.target.value })}
                  placeholder="/courses/some-id"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-md border p-3">
              <Button
                variant={broadcast ? 'default' : 'outline'}
                size="sm"
                onClick={() => setBroadcast(true)}
              >
                Broadcast to All
              </Button>
              <Button
                variant={!broadcast ? 'default' : 'outline'}
                size="sm"
                onClick={() => setBroadcast(false)}
              >
                Specific Users
              </Button>
              <span className="ml-auto text-xs text-muted-foreground">
                {broadcast ? 'All active users will receive this' : 'Select specific recipients'}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSend} disabled={saving}>
              <Send className="mr-2 h-4 w-4" />
              {saving ? 'Sending...' : 'Send'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Notification</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this notification? This action cannot be undone.
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
