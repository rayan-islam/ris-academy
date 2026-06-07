'use client';

import { Card, CardContent, CardHeader, CardTitle, Button, Skeleton, Badge, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ris-academy/ui';
import { useEffect, useState, useCallback } from 'react';
import { formatDate, formatBDT } from '@/lib/utils';
import { toast } from 'sonner';
import { DollarSign, CheckCircle, XCircle, BarChart3, Undo2, Search } from 'lucide-react';
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

type PaymentItem = {
  id: string;
  transactionId: string | null;
  amount: number;
  currency: string;
  method: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  createdAt: string;
  user: { name: string | null; email: string };
  course: { title: string } | null;
};

type Stats = {
  totalRevenue: number;
  totalTransactions: number;
  successful: number;
  failed: number;
};

const statusStyles: Record<string, string> = {
  COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
  PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  FAILED: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  REFUNDED: 'bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-300',
};

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<Stats>({ totalRevenue: 0, totalTransactions: 0, successful: 0, failed: 0 });
  const [refundId, setRefundId] = useState<string | null>(null);
  const [refunding, setRefunding] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      params.set('page', page.toString());
      params.set('limit', '10');

      const res = await fetch(`/api/admin/payments?${params.toString()}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to fetch payments');
      }

      setPayments(json.data);
      setTotal(json.total);
      setTotalPages(json.totalPages);

      const allPayments = json.data as PaymentItem[];
      const allTotal = json.total;

      // Fetch all completed for stats (no pagination)
      const statsRes = await fetch('/api/admin/payments?limit=1&page=1');
      const statsJson = await statsRes.json();

      let totalRevenue = 0;
      let successful = 0;
      let failed = 0;

      if (statsRes.ok && statsJson.success) {
        const countRes = await fetch('/api/admin/payments?limit=1000&page=1');
        const countJson = await countRes.json();
        if (countRes.ok && countJson.success) {
          const allData = countJson.data as PaymentItem[];
          totalRevenue = allData
            .filter((p) => p.status === 'COMPLETED')
            .reduce((sum, p) => sum + p.amount, 0);
          successful = allData.filter((p) => p.status === 'COMPLETED').length;
          failed = allData.filter((p) => p.status === 'FAILED').length;
        }
      }

      setStats({
        totalRevenue,
        totalTransactions: allTotal,
        successful,
        failed,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, debouncedSearch, dateFrom, dateTo, page]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleRefund = async () => {
    if (!refundId) return;
    setRefunding(true);
    try {
      const res = await fetch(`/api/admin/payments/${refundId}/refund`, {
        method: 'POST',
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Refund failed');
      }

      toast.success('Refund initiated successfully');
      setPayments((prev) =>
        prev.map((p) => (p.id === refundId ? { ...p, status: 'REFUNDED' } : p))
      );
      setRefundId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setRefunding(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Payment Transactions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Monitor and manage all payment transactions
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Revenue</p>
              <p className="text-lg font-bold">{formatBDT(stats.totalRevenue)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Transactions</p>
              <p className="text-lg font-bold">{stats.totalTransactions}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Successful</p>
              <p className="text-lg font-bold">{stats.successful}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400">
              <XCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Failed</p>
              <p className="text-lg font-bold">{stats.failed}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by ID, student..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="REFUNDED">Refunded</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="w-auto"
              placeholder="From"
            />
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="w-auto"
              placeholder="To"
            />
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : payments.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No payment transactions found.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground">
                      <th className="py-3 text-left font-medium">Transaction ID</th>
                      <th className="py-3 text-left font-medium">Student</th>
                      <th className="py-3 text-left font-medium">Course</th>
                      <th className="py-3 text-right font-medium">Amount</th>
                      <th className="py-3 text-left font-medium">Method</th>
                      <th className="py-3 text-left font-medium">Status</th>
                      <th className="py-3 text-left font-medium">Date</th>
                      <th className="py-3 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id} className="border-b last:border-0 text-sm">
                        <td className="py-3 font-mono text-xs">
                          {payment.transactionId || '—'}
                        </td>
                        <td className="py-3">
                          <div>
                            <p className="font-medium">{payment.user?.name || 'N/A'}</p>
                            <p className="text-xs text-muted-foreground">{payment.user?.email}</p>
                          </div>
                        </td>
                        <td className="py-3">{payment.course?.title || '—'}</td>
                        <td className="py-3 text-right tabular-nums">
                          {formatBDT(payment.amount)}
                        </td>
                        <td className="py-3">{payment.method}</td>
                        <td className="py-3">
                          <Badge className={statusStyles[payment.status] || ''}>
                            {payment.status}
                          </Badge>
                        </td>
                        <td className="py-3 text-xs">{formatDate(payment.createdAt)}</td>
                        <td className="py-3 text-right">
                          {payment.status === 'COMPLETED' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setRefundId(payment.id)}
                            >
                              <Undo2 className="mr-1 h-3 w-3" />
                              Refund
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {page} of {totalPages} ({total} total)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!refundId} onOpenChange={(open) => !open && setRefundId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Process Refund</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to refund this payment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={refunding}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={refunding}
              onClick={handleRefund}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {refunding ? 'Processing...' : 'Refund'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
