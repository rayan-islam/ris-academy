'use client';

import { Card, CardContent, CardHeader, CardTitle, Skeleton, Button } from '@ris-academy/ui';
import { Award, ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

type Certificate = {
  id: string;
  courseName: string;
  certificateNumber: string;
  pdfUrl: string | null;
  issuedAt: string;
};

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCertificates() {
      try {
        const res = await fetch('/api/certificates');
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error || 'Failed to load certificates');
        }
        const json = await res.json();
        setCertificates(json.data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Something went wrong';
        toast.error(message);
      } finally {
        setLoading(false);
      }
    }
    fetchCertificates();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="space-y-4 p-6">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-9 w-36" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">My Certificates</h1>

      {certificates && certificates.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {certificates.map((cert) => (
            <Card
              key={cert.id}
              className="border-2 border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/10"
            >
              <CardContent className="space-y-4 p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900">
                    <Award className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold leading-tight">{cert.courseName}</h3>
                    <p className="text-xs text-muted-foreground">
                      Earned {formatDate(cert.issuedAt)}
                    </p>
                  </div>
                </div>
                <p className="text-xs font-mono text-muted-foreground">
                  Certificate No: {cert.certificateNumber}
                </p>
                {cert.pdfUrl && (
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="w-full border-amber-300 dark:border-amber-700"
                  >
                    <a href={cert.pdfUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Certificate
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <Award className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium">No certificates yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Complete a course to earn your first certificate!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
