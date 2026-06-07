import { Card, CardContent, Skeleton } from '@ris-academy/ui';

export default function NotificationsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-9 w-36" />
      </div>

      <div className="flex gap-1">
        <Skeleton className="h-10 w-16 rounded-md" />
        <Skeleton className="h-10 w-20 rounded-md" />
      </div>

      <div className="mt-4 space-y-3">
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
    </div>
  );
}
