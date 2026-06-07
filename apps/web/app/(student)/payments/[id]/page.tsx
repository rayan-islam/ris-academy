'use client';

import { Card, CardContent, CardHeader, CardTitle, Button, Skeleton, Badge, Separator } from '@ris-academy/ui';
import { useEffect, useState } from 'react';
import { formatDate, formatBDT } from '@/lib/utils';
import { toast } from 'sonner';
import { useParams } from 'next/navigation';
import { Printer, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type PaymentDetail = {
  id: string;
  transactionId: string | null;
  amount: number;
  currency: string;
  method: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  createdAt: string;
  course: { title: string } | null;
  user: { name: string | null; email: string };
};

const statusStyles: Record<string, string> = {
  COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
  PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  FAILED: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  REFUNDED: 'bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-300',
};

export default function PaymentReceiptPage() {
  const params = useParams();
  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPayment() {
      try {
        const res = await fetch(`/api/payments/${params.id}`);
        const json = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Failed to fetch payment');
        }

        setPayment(json.data);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }
    fetchPayment();
  }, [params.id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="max-w-lg mx-auto space-y-4 py-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-lg font-medium">Payment not found</p>
        <Link href="/payments" className="mt-2 text-sm text-[#185FA5] hover:underline">
          Back to payment history
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6 py-8">
      <Button variant="ghost" asChild className="mb-2">
        <Link href="/payments">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Payments
        </Link>
      </Button>

      <Card className="print:shadow-none">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-bold">RI&apos;s Academy</CardTitle>
          <p className="text-sm text-muted-foreground">Payment Receipt</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Separator />
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Transaction ID</p>
              <p className="font-medium">{payment.transactionId || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Date</p>
              <p className="font-medium">{formatDate(payment.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Course</p>
              <p className="font-medium">{payment.course?.title || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Student</p>
              <p className="font-medium">{payment.user?.name || payment.user?.email}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Payment Method</p>
              <p className="font-medium">{payment.method}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Amount</p>
              <p className="font-bold text-lg">{formatBDT(payment.amount)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <Badge className={statusStyles[payment.status] || ''}>
                {payment.status}
              </Badge>
            </div>
          </div>
          <Separator />
          <div className="pt-2 text-center text-xs text-muted-foreground">
            <p>Thank you for enrolling at RI&apos;s Academy</p>
            <p>For any inquiries, contact support@risacademy.com</p>
          </div>
        </CardContent>
      </Card>

      <Button className="w-full print:hidden" onClick={handlePrint}>
        <Printer className="mr-2 h-4 w-4" />
        Download Receipt
      </Button>
    </div>
  );
}
