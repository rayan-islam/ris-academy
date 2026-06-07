'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  Skeleton,
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@ris-academy/ui';
import {
  Bell,
  Award,
  BookOpen,
  DollarSign,
  Clock,
  CheckCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type NotificationType =
  | 'EXAM_RESULT'
  | 'COURSE_NEW'
  | 'PAYMENT'
  | 'EXAM_REMINDER'
  | 'GENERAL';

type NotificationItem = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
};

const iconMap: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  EXAM_RESULT: Award,
  COURSE_NEW: BookOpen,
  PAYMENT: DollarSign,
  EXAM_REMINDER: Clock,
  GENERAL: Bell,
};

const iconBgMap: Record<NotificationType, string> = {
  EXAM_RESULT: 'bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400',
  COURSE_NEW: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
  PAYMENT: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
  EXAM_REMINDER: 'bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400',
  GENERAL: 'bg-muted text-muted-foreground',
};

function timeAgo(date: string): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years > 1 ? 's' : ''} ago`;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab === 'unread') {
        params.set('unreadOnly', 'true');
      }

      const res = await fetch(`/api/notifications?${params.toString()}`);
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || 'Failed to load notifications');
      }
      const json = await res.json();
      setNotifications(json.data ?? json.notifications ?? json);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  async function markAsRead(id: string) {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
      });
      if (!res.ok) return;
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch {
      toast.error('Failed to mark as read');
    }
  }

  async function markAllAsRead() {
    setMarkingAll(true);
    try {
      for (const n of notifications) {
        if (!n.isRead) {
          await fetch(`/api/notifications/${n.id}/read`, { method: 'PATCH' });
        }
      }
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    } finally {
      setMarkingAll(false);
    }
  }

  function handleNotificationClick(n: NotificationItem) {
    if (!n.isRead) {
      markAsRead(n.id);
    }
    if (n.link) {
      window.location.href = n.link;
    }
  }

  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        {hasUnread && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            disabled={markingAll}
          >
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">Unread</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {loading ? (
            <NotificationSkeleton />
          ) : notifications.length === 0 ? (
            <EmptyState message="No notifications yet" />
          ) : (
            <NotificationList
              notifications={notifications}
              onNotificationClick={handleNotificationClick}
            />
          )}
        </TabsContent>

        <TabsContent value="unread">
          {loading ? (
            <NotificationSkeleton />
          ) : notifications.length === 0 ? (
            <EmptyState message="No unread notifications" />
          ) : (
            <NotificationList
              notifications={notifications}
              onNotificationClick={handleNotificationClick}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function NotificationList({
  notifications,
  onNotificationClick,
}: {
  notifications: NotificationItem[];
  onNotificationClick: (n: NotificationItem) => void;
}) {
  return (
    <div className="space-y-3">
      {notifications.map((n) => {
        const Icon = iconMap[n.type] || Bell;
        const iconBg = iconBgMap[n.type] || iconBgMap.GENERAL;

        return (
          <Card
            key={n.id}
            className={cn(
              'cursor-pointer transition-colors hover:bg-muted/50',
              n.link && 'hover:shadow-sm'
            )}
            onClick={() => onNotificationClick(n)}
          >
            <CardContent className="flex items-start gap-4 p-4">
              {!n.isRead && (
                <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
              )}
              {n.isRead && <div className="mt-2 h-2 w-2 shrink-0" />}

              <div
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                  iconBg
                )}
              >
                <Icon className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <h3
                  className={cn(
                    'text-sm leading-snug',
                    !n.isRead ? 'font-semibold' : 'font-medium'
                  )}
                >
                  {n.title}
                </h3>
                <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
                  {n.message}
                </p>
              </div>

              <span className="shrink-0 text-xs text-muted-foreground whitespace-nowrap">
                {timeAgo(n.createdAt)}
              </span>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center py-24 text-center">
      <Bell className="mb-4 h-12 w-12 text-muted-foreground" />
      <p className="text-lg font-medium">{message}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        You&apos;re all caught up! New notifications will appear here.
      </p>
    </div>
  );
}

function NotificationSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="flex items-start gap-4 p-4">
            <Skeleton className="mt-2 h-2 w-2 rounded-full" />
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-full" />
            </div>
            <Skeleton className="h-3 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
