import { Card, CardContent, Skeleton } from '@ris-academy/ui';

export default function ProfileLoading() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-8 w-36" />

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-6">
          <Card>
            <CardContent className="flex flex-col items-center pt-6">
              <Skeleton className="h-28 w-28 rounded-full" />
              <Skeleton className="mt-4 h-6 w-36" />
              <Skeleton className="mt-1 h-4 w-48" />
              <div className="mt-3 flex gap-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="mt-2 h-4 w-32" />
              <Skeleton className="my-5 h-px w-full" />
              <div className="w-full space-y-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
        </aside>

        <main>
          <div className="mb-2 flex gap-1">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-36" />
            <Skeleton className="h-10 w-28" />
          </div>

          <Card>
            <CardContent className="space-y-5 pt-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-10" />
                <Skeleton className="h-24 w-full" />
              </div>
              <Skeleton className="h-10 w-32" />
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
