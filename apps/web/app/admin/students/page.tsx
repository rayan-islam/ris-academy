'use client';

import {
  Card,
  CardContent,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@ris-academy/ui';
import { Search, Eye, Ban, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

type StudentItem = {
  id: string;
  name: string;
  email: string;
  institution: string | null;
  hscYear: string | null;
  isActive: boolean;
  phone: string | null;
  createdAt: string;
  _count: { enrollments: number };
};

type PaginatedData = {
  success: boolean;
  data: StudentItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

const HSC_YEARS = ['1st', '2nd'] as const;

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [hscYear, setHscYear] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedStudent, setSelectedStudent] = useState<StudentItem | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (hscYear) params.set('hscYear', hscYear);
      if (statusFilter) params.set('isActive', statusFilter === 'active' ? 'true' : 'false');
      params.set('page', String(page));
      params.set('limit', '10');

      const res = await fetch(`/api/admin/students?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch students');
      const json: PaginatedData = await res.json();
      setStudents(json.data);
      setTotal(json.total);
      setTotalPages(json.totalPages);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, hscYear, statusFilter, page]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const toggleActive = async (student: StudentItem) => {
    setTogglingId(student.id);
    try {
      const res = await fetch(`/api/admin/students/${student.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !student.isActive }),
      });
      if (!res.ok) throw new Error('Failed to update student');
      toast.success(student.isActive ? 'Student banned' : 'Student activated');
      fetchStudents();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Manage Students</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View and manage all enrolled students
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={hscYear} onValueChange={(v) => { setHscYear(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="HSC Year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            {HSC_YEARS.map((y) => (
              <SelectItem key={y} value={y}>
                {y === '1st' ? '1st Year' : '2nd Year'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="banned">Banned</SelectItem>
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
          ) : students.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              No students found
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground">
                      <th className="py-3 pl-6 text-left font-medium">Name</th>
                      <th className="py-3 text-left font-medium">Email</th>
                      <th className="py-3 text-left font-medium">Institution</th>
                      <th className="py-3 text-left font-medium">HSC Year</th>
                      <th className="py-3 text-right font-medium">Enrollments</th>
                      <th className="py-3 text-center font-medium">Status</th>
                      <th className="py-3 pr-6 text-center font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student.id} className="border-b last:border-0 text-sm">
                        <td className="py-3 pl-6 font-medium">{student.name}</td>
                        <td className="py-3 text-muted-foreground">{student.email}</td>
                        <td className="py-3">{student.institution || '—'}</td>
                        <td className="py-3">
                          {student.hscYear === '1st' ? '1st Year' : student.hscYear === '2nd' ? '2nd Year' : '—'}
                        </td>
                        <td className="py-3 text-right tabular-nums">{student._count.enrollments}</td>
                        <td className="py-3 text-center">
                          <Badge variant={student.isActive ? 'success' : 'destructive'}>
                            {student.isActive ? 'Active' : 'Banned'}
                          </Badge>
                        </td>
                        <td className="py-3 pr-6 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedStudent(student)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={togglingId === student.id}
                              onClick={() => toggleActive(student)}
                            >
                              {student.isActive ? (
                                <Ban className="h-4 w-4 text-destructive" />
                              ) : (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between px-6 py-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Showing {(page - 1) * 10 + 1}-{Math.min(page * 10, total)} of {total} students
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm tabular-nums px-2">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedStudent} onOpenChange={(open) => !open && setSelectedStudent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Name</p>
                  <p className="font-medium">{selectedStudent.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedStudent.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedStudent.phone || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Institution</p>
                  <p className="font-medium">{selectedStudent.institution || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">HSC Year</p>
                  <p className="font-medium">
                    {selectedStudent.hscYear === '1st' ? '1st Year' : selectedStudent.hscYear === '2nd' ? '2nd Year' : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant={selectedStudent.isActive ? 'success' : 'destructive'}>
                    {selectedStudent.isActive ? 'Active' : 'Banned'}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Enrollments</p>
                  <p className="font-medium">{selectedStudent._count.enrollments}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Joined</p>
                  <p className="font-medium">{formatDate(selectedStudent.createdAt)}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
