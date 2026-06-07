import Link from 'next/link';
import { Button } from '@ris-academy/ui';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <h1 className="text-8xl font-extrabold text-primary/20">404</h1>
      <h2 className="mt-4 text-2xl font-bold tracking-tight">Page not found</h2>
      <p className="mt-2 text-muted-foreground text-center max-w-sm">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link href="/" className="mt-8">
        <Button>Go back home</Button>
      </Link>
    </div>
  );
}
