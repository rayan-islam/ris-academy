'use client';

import {
  Card,
  CardContent,
  Skeleton,
  Badge,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Label,
} from '@ris-academy/ui';
import { Plus, Search, Pencil, Trash2, FolderOpen, ExternalLink } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
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

type MaterialItem = {
  id: string;
  title: string;
  fileUrl: string;
  fileType: string;
  fileSize: number | null;
  subject: string;
  chapter: string | null;
  createdAt: string;
  user: { name: string };
};

type PaginatedResponse = {
  success: boolean;
  data: MaterialItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

const SUBJECTS = ['Physics', 'Chemistry', 'Biology', 'Math', 'English', 'ICT'];
const FILE_TYPES = [
  { value: 'application/pdf', label: 'PDF' },
  { value: 'application/msword', label: 'DOC' },
  { value: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', label: 'DOCX' },
  { value: 'application/vnd.ms-powerpoint', label: 'PPT' },
  { value: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', label: 'PPTX' },
  { value: 'image/png', label: 'PNG' },
  { value: 'image/jpeg', label: 'JPEG' },
];

const emptyForm = { title: '', fileUrl: '', fileType: 'application/pdf', fileSize: '', subject: 'Physics', chapter: '' };

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '\u2014';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileTypeLabel(mime: string): string {
  return FILE_TYPES.find((f) => f.value === mime)?.label || mime;
}

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [fileTypeFilter, setFileTypeFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const limit = 20;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (subjectFilter !== 'all') params.set('subject', subjectFilter);
      if (fileTypeFilter !== 'all') params.set('fileType', fileTypeFilter);
      params.set('page', String(page));
      params.set('limit', String(limit));

      const res = await fetch(`/api/admin/materials?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch materials');
      const json: PaginatedResponse = await res.json();
      setMaterials(json.data);
      setTotal(json.total);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, subjectFilter, fileTypeFilter, page]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (m: MaterialItem) => {
    setEditingId(m.id);
    setForm({
      title: m.title,
      fileUrl: m.fileUrl,
      fileType: m.fileType,
      fileSize: m.fileSize ? String(m.fileSize) : '',
      subject: m.subject,
      chapter: m.chapter || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.fileUrl || !form.fileType || !form.subject) {
      toast.error('Title, file URL, file type, and subject are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        fileUrl: form.fileUrl,
        fileType: form.fileType,
        fileSize: form.fileSize ? parseInt(form.fileSize) : null,
        subject: form.subject,
        chapter: form.chapter || null,
      };

      if (editingId) {
        const res = await fetch(`/api/admin/materials/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to update material');
        toast.success('Material updated');
      } else {
        const res = await fetch('/api/admin/materials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to create material');
        toast.success('Material added');
      }
      setDialogOpen(false);
      fetchMaterials();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/materials/${deleteId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete material');
      toast.success('Material deleted');
      setMaterials((prev) => prev.filter((m) => m.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Materials</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage study materials and reference documents</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Material
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search materials..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <Select value={subjectFilter} onValueChange={(v) => { setSubjectFilter(v); setPage(1); }}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {SUBJECTS.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={fileTypeFilter} onValueChange={(v) => { setFileTypeFilter(v); setPage(1); }}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="File Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {FILE_TYPES.map((ft) => (
              <SelectItem key={ft.value} value={ft.value}>{ft.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : materials.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FolderOpen className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="text-lg font-medium text-muted-foreground">No materials yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Upload study materials for the RAG pipeline or student reference
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground">
                      <th className="py-3 pl-6 text-left font-medium">Title</th>
                      <th className="py-3 text-left font-medium">Subject</th>
                      <th className="py-3 text-left font-medium">Chapter</th>
                      <th className="py-3 text-center font-medium">Type</th>
                      <th className="py-3 text-right font-medium">Size</th>
                      <th className="py-3 text-left font-medium">Uploaded By</th>
                      <th className="py-3 pr-6 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materials.map((m) => (
                      <tr key={m.id} className="border-b last:border-0 text-sm">
                        <td className="py-3 pl-6">
                          <div className="flex items-center gap-2">
                            <span className="line-clamp-1 font-medium">{m.title}</span>
                            <Link
                              href={m.fileUrl}
                              target="_blank"
                              className="text-muted-foreground hover:text-navy"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Link>
                          </div>
                        </td>
                        <td className="py-3">{m.subject}</td>
                        <td className="py-3 max-w-[120px]">
                          <span className="line-clamp-1 text-xs">{m.chapter || '\u2014'}</span>
                        </td>
                        <td className="py-3 text-center">
                          <Badge variant="secondary">{getFileTypeLabel(m.fileType)}</Badge>
                        </td>
                        <td className="py-3 text-right tabular-nums text-xs">
                          {formatFileSize(m.fileSize)}
                        </td>
                        <td className="py-3 text-xs text-muted-foreground">{m.user.name}</td>
                        <td className="py-3 pr-6 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openEdit(m)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setDeleteId(m.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t px-6 py-3">
                  <p className="text-sm text-muted-foreground">
                    Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                      Previous
                    </Button>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Material' : 'Add Material'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-1">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. HSC Physics Chapter 3 Notes"
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="fileUrl">File URL</Label>
              <Input
                id="fileUrl"
                value={form.fileUrl}
                onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1">
                <Label>File Type</Label>
                <Select value={form.fileType} onValueChange={(v) => setForm({ ...form, fileType: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FILE_TYPES.map((ft) => (
                      <SelectItem key={ft.value} value={ft.value}>{ft.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1">
                <Label htmlFor="fileSize">File Size (bytes)</Label>
                <Input
                  id="fileSize"
                  type="number"
                  value={form.fileSize}
                  onChange={(e) => setForm({ ...form, fileSize: e.target.value })}
                  placeholder="e.g. 204800"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1">
                <Label>Subject</Label>
                <Select value={form.subject} onValueChange={(v) => setForm({ ...form, subject: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBJECTS.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1">
                <Label htmlFor="chapter">Chapter (optional)</Label>
                <Input
                  id="chapter"
                  value={form.chapter}
                  onChange={(e) => setForm({ ...form, chapter: e.target.value })}
                  placeholder="e.g. Newton's Laws"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Material</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this material? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
