'use client';

import { Card, CardContent, CardHeader, CardTitle, Skeleton, Badge } from '@ris-academy/ui';
import { useEffect, useState } from 'react';
import { formatDate, formatBDT } from '@/lib/utils';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ris-academy/ui';
import { Receipt } from 'lucide-react';

type PaymentItem = {
  id: string;
  transactionId: string | null;
  amount: number;
  method: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  createdAt: string;
  course: { title: string } | null;
};

const statusStyles: Record<string, string> = {
  COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
  PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  FAILED: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  REFUNDED: 'bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-300',
};

export default function PaymentsPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    async function fetchPayments() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (statusFilter !== 'ALL') params.set('status', statusFilter);

        const res = await fetch(`/api/payments?${params.toString()}`);
        const json = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Failed to fetch payments');
        }

        setPayments(json.data);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }
    fetchPayments();
  }, [statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payment History</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View your payment transactions and receipts
          </p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Payments</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
            <SelectItem value="REFUNDED">Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Receipt className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium">No payment history yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Enroll in paid courses to see your payments here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="py-3 pl-6 text-left font-medium">Date</th>
                    <th className="py-3 text-left font-medium">Course</th>
                    <th className="py-3 text-right font-medium">Amount</th>
                    <th className="py-3 text-left font-medium">Method</th>
                    <th className="py-3 pr-6 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr
                      key={payment.id}
                      className="cursor-pointer border-b last:border-0 text-sm hover:bg-muted/50 transition-colors"
                      onClick={() => router.push(`/payments/${payment.id}`)}
                    >
                      <td className="py-3 pl-6">{formatDate(payment.createdAt)}</td>
                      <td className="py-3 font-medium">
                        {payment.course?.title || '—'}
                      </td>
                      <td className="py-3 text-right tabular-nums">
                        {formatBDT(payment.amount)}
                      </td>
                      <td className="py-3">{payment.method}</td>
                      <td className="py-3 pr-6">
                        <Badge
                          className={statusStyles[payment.status] || ''}
                        >
                          {payment.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
