'use client';

import {
  Card,
  CardContent,
  Button,
  Input,
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
import { Search, Eye, Ban, CheckCircle, ChevronLeft, ChevronRight, Shield } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';

type UserItem = {
  id: string;
  name: string;
  email: string;
  role: string;
  institution: string | null;
  hscYear: string | null;
  isActive: boolean;
  phone: string | null;
  createdAt: string;
  _count: { enrollments: number };
};

type PaginatedData = {
  success: boolean;
  data: UserItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

const ROLES = ['STUDENT', 'TEACHER', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN'] as const;

function roleBadgeVariant(role: string) {
  if (role === 'SUPER_ADMIN' || role === 'ADMIN') return 'destructive';
  if (role === 'MODERATOR') return 'default';
  if (role === 'TEACHER') return 'secondary';
  return 'outline';
}

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const currentRole = (session?.user as any)?.role as string | undefined;
  const isSuperAdmin = currentRole === 'SUPER_ADMIN';

  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [changingRoleId, setChangingRoleId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (roleFilter) params.set('role', roleFilter);
      if (statusFilter) params.set('isActive', statusFilter === 'active' ? 'true' : 'false');
      params.set('page', String(page));
      params.set('limit', '10');

      const res = await fetch(`/api/admin/students?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch users');
      const json: PaginatedData = await res.json();
      setUsers(json.data);
      setTotal(json.total);
      setTotalPages(json.totalPages);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, roleFilter, statusFilter, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleActive = async (user: UserItem) => {
    setTogglingId(user.id);
    try {
      const res = await fetch(`/api/admin/students/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || 'Failed to update user');
      }
      toast.success(user.isActive ? 'User deactivated' : 'User activated');
      fetchUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setTogglingId(null);
    }
  };

  const changeRole = async (userId: string, newRole: string) => {
    setChangingRoleId(userId);
    try {
      const res = await fetch(`/api/admin/students/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || 'Failed to change role');
      }
      toast.success(`Role changed to ${newRole}`);
      fetchUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setChangingRoleId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Manage Users</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View and manage all platform users
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {ROLES.map((r) => (
              <SelectItem key={r} value={r}>
                {r.replace('_', ' ')}
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
            <SelectItem value="banned">Inactive</SelectItem>
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
          ) : users.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              No users found
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground">
                      <th className="py-3 pl-6 text-left font-medium">Name</th>
                      <th className="py-3 text-left font-medium">Email</th>
                      <th className="py-3 text-left font-medium">Role</th>
                      <th className="py-3 text-left font-medium">Status</th>
                      <th className="py-3 text-right font-medium">Enrolled</th>
                      <th className="py-3 pr-6 text-center font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b last:border-0 text-sm">
                        <td className="py-3 pl-6 font-medium">{user.name}</td>
                        <td className="py-3 text-muted-foreground">{user.email}</td>
                        <td className="py-3">
                          <Select
                            value={user.role}
                            onValueChange={(v) => changeRole(user.id, v)}
                            disabled={
                              changingRoleId === user.id ||
                              (user.role === 'SUPER_ADMIN' && !isSuperAdmin)
                            }
                          >
                            <SelectTrigger className="h-8 w-[130px] text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ROLES.filter((r) => isSuperAdmin || r !== 'SUPER_ADMIN').map((r) => (
                                <SelectItem
                                  key={r}
                                  value={r}
                                  disabled={r === 'SUPER_ADMIN' && !isSuperAdmin}
                                >
                                  {r.replace('_', ' ')}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="py-3">
                          <Badge variant={user.isActive ? 'success' : 'destructive'}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="py-3 text-right tabular-nums">{user._count.enrollments}</td>
                        <td className="py-3 pr-6 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedUser(user)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={togglingId === user.id || user.role === 'SUPER_ADMIN' && !isSuperAdmin}
                              onClick={() => toggleActive(user)}
                            >
                              {user.isActive ? (
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
                  Showing {(page - 1) * 10 + 1}-{Math.min(page * 10, total)} of {total} users
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

      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Name</p>
                  <p className="font-medium">{selectedUser.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedUser.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedUser.phone || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Role</p>
                  <Badge variant={roleBadgeVariant(selectedUser.role)} className="gap-1">
                    <Shield className="h-3 w-3" />
                    {selectedUser.role.replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant={selectedUser.isActive ? 'success' : 'destructive'}>
                    {selectedUser.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Enrollments</p>
                  <p className="font-medium">{selectedUser._count.enrollments}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Joined</p>
                  <p className="font-medium">{formatDate(selectedUser.createdAt)}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
