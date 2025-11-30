// src/pages/admin/certifications.tsx
// src/pages/admin/certifications.tsx
import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Award, Edit, Trash2, Plus, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/atoms/popover';
import { Command, CommandGroup, CommandInput, CommandItem } from '@/components/atoms/command';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import SkeletonCard from '@/components/atoms/skeleton-card';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { API_URL } from '@/lib/config';
import { toast } from '@/components/atoms/use-toast';

interface User {
  id: number;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
}

interface ComplianceDoc {
  id: number;
  user_id?: number;
  user?: User | null;
  doc_type?: string;
  type?: string;
  issued_at?: string;
  expires_at?: string;
  expires?: string;
  status?: 'Valid' | 'Expiring' | 'Expired' | string;
  [key: string]: unknown;
}

export default function AdminCertifications() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'courses' | 'certifications'>('courses');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Valid' | 'Expiring' | 'Expired'>('All');
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<ComplianceDoc> | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toDelete, setToDelete] = useState<number | null>(null);

  const { data: items = [], isLoading } = useQuery<ComplianceDoc[]>({
    queryKey: ['compliance'],
    queryFn: api.listCompliance
  });

  // load users for user lookup in the create/edit dialog
  const [userQuery, setUserQuery] = useState('');
  const [debouncedUserQuery, setDebouncedUserQuery] = useState('');

  // debounce user query to avoid hammering the API
  useEffect(() => {
    const t = setTimeout(() => setDebouncedUserQuery(userQuery), 300);
    return () => clearTimeout(t);
  }, [userQuery]);

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>(['users', debouncedUserQuery], () =>
    api.listUsers(debouncedUserQuery)
  );

  const selectedUser = useMemo(() => users.find((u) => u.id === editing?.user_id) ?? null, [users, editing?.user_id]);

  const createMutation = useMutation({
    mutationFn: (data: Partial<ComplianceDoc>) => api.createCompliance(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['compliance']);
      toast.success('Certification created');
      setEditOpen(false);
      setEditing(null);
    },
    onError: () => toast.error('Failed to create certification')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ComplianceDoc> }) => api.updateComplianceDoc(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['compliance']);
      toast.success('Certification updated');
      setEditOpen(false);
      setEditing(null);
    },
    onError: () => toast.error('Failed to update certification')
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteCompliance(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['compliance']);
      toast.success('Certification deleted');
      setDeleteOpen(false);
      setToDelete(null);
    },
    onError: () => toast.error('Failed to delete certification')
  });

  const filtered = items.filter((r: ComplianceDoc) => {
    if (filterStatus !== 'All' && r.status !== filterStatus) return false;
    if (
      search &&
      !`${r.user?.firstName || r.user?.name || r.user_id || ''}`.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  // simple client-side pagination for certifications list
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  useEffect(() => setPage(1), [search, filterStatus]);
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const saveCert = (payload: Partial<ComplianceDoc>) => {
    // If a file is attached, send as FormData so backend can process multipart upload
    const hasFile = !!(payload as any).file;
    if (payload.id) {
      if (hasFile) {
        const fd = new FormData();
        fd.append('file', (payload as any).file);
        if (payload.user_id) fd.append('user_id', String(payload.user_id));
        if (payload.doc_type) fd.append('doc_type', String(payload.doc_type));
        if (payload.issued_at) fd.append('issued_at', String(payload.issued_at));
        if (payload.expires_at) fd.append('expires_at', String(payload.expires_at));
        if (payload.status) fd.append('status', String(payload.status));
        updateMutation.mutate({ id: payload.id, data: fd } as any);
      } else {
        updateMutation.mutate({ id: payload.id, data: payload });
      }
    } else {
      if (hasFile) {
        const fd = new FormData();
        fd.append('file', (payload as any).file);
        if (payload.user_id) fd.append('user_id', String(payload.user_id));
        if (payload.doc_type) fd.append('doc_type', String(payload.doc_type));
        if (payload.issued_at) fd.append('issued_at', String(payload.issued_at));
        if (payload.expires_at) fd.append('expires_at', String(payload.expires_at));
        if (payload.status) fd.append('status', String(payload.status));
        createMutation.mutate(fd as any);
      } else {
        // create expects user_id, doc_type, issued_at, expires_at
        createMutation.mutate(payload);
      }
    }
  };

  const confirmDelete = (id: number) => {
    setToDelete(id);
    setDeleteOpen(true);
  };

  const doDelete = () => {
    if (toDelete == null) return;
    deleteMutation.mutate(toDelete);
  };

  // Courses CRUD wiring
  const [coursesOpen, setCourseOpen] = useState(false);
  const [courseEditing, setCourseEditing] = useState<any | null>(null);
  const { data: courses = [], isLoading: coursesLoading } = useQuery(['courses'], api.listCourses);

  const courseCreateMutation = useMutation({
    mutationFn: (data: any) => api.createCourse(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['courses']);
      toast.success('Course created');
      setCourseOpen(false);
    },
    onError: () => toast.error('Failed to create course')
  });

  const courseUpdateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.updateCourse(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['courses']);
      toast.success('Course updated');
      setCourseOpen(false);
    },
    onError: () => toast.error('Failed to update course')
  });

  const courseDeleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteCourse(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['courses']);
      toast.success('Course deleted');
    },
    onError: () => toast.error('Failed to delete course')
  });

  const [toDeleteCourse, setToDeleteCourse] = useState<number | null>(null);
  const confirmCourseDelete = (id: number) => setToDeleteCourse(id);
  const doDeleteCourse = () => {
    if (toDeleteCourse == null) return;
    courseDeleteMutation.mutate(toDeleteCourse);
    setToDeleteCourse(null);
  };

  const [courseDeleteOpen, setCourseDeleteOpen] = useState(false);
  useEffect(() => {
    setCourseDeleteOpen(toDeleteCourse != null);
  }, [toDeleteCourse]);

  return (
    <div className="space-y-6" aria-busy={isLoading}>
      {/* top-level tabs */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Button variant={activeTab === 'courses' ? 'default' : 'ghost'} onClick={() => setActiveTab('courses')}>
            Training Courses
          </Button>
          <Button
            variant={activeTab === 'certifications' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('certifications')}
          >
            Volunteer Certifications
          </Button>
        </div>
      </div>

      {/* Courses summary (read-only) */}
      {activeTab === 'courses' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Training Courses
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Courses list and CRUD */}
            <div className="flex items-center mb-4">
              <div className="text-sm text-muted-foreground">Manage training courses offered to volunteers.</div>
              <div className="ml-auto flex items-center gap-2">
                <Button
                  onClick={() => {
                    setCourseEditing(null);
                    setCourseOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Course
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    // quick link to volunteer management/profile
                    window.location.href = '/admin/volunteer-profile';
                  }}
                >
                  Volunteer Management
                </Button>
              </div>
            </div>

            {coursesLoading ? (
              <SkeletonCard />
            ) : courses.length === 0 ? (
              <div className="text-sm text-muted-foreground">No courses found. Add a new course to get started.</div>
            ) : (
              <div className="space-y-3">
                {courses.map((course: any) => (
                  <div key={course.id} className="flex items-center p-3 rounded border">
                    <div>
                      <div className="font-medium">{course.title || course.name}</div>
                      {course.description && <div className="text-sm text-muted-foreground">{course.description}</div>}
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setCourseEditing(course);
                          setCourseOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => (window.location.href = `/admin/volunteer-profile?id=${course.id}`)}
                        title="Manage volunteers for this course"
                      >
                        <Award className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" onClick={() => confirmCourseDelete(course.id)}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Certifications with CRUD (backed by API) */}
      {activeTab === 'certifications' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Volunteer Certifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 mb-4">
              <Input
                placeholder="Search volunteer"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-64"
              />
              <Select
                value={filterStatus}
                onValueChange={(v) => setFilterStatus(v as 'All' | 'Valid' | 'Expiring' | 'Expired')}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  <SelectItem value="Valid">Valid</SelectItem>
                  <SelectItem value="Expiring">Expiring</SelectItem>
                  <SelectItem value="Expired">Expired</SelectItem>
                </SelectContent>
              </Select>
              <div className="ml-auto flex items-center gap-2">
                <div className="text-sm text-muted-foreground">Per page:</div>
                <Select value={String(perPage)} onValueChange={(v) => setPerPage(Number(v))}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => {
                    setEditing(null);
                    setEditOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Certification
                </Button>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Volunteer</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Issued</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <SkeletonCard />
                    </TableCell>
                  </TableRow>
                ) : paged.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No certifications found
                    </TableCell>
                  </TableRow>
                ) : (
                  paged.map((c: ComplianceDoc) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        {c.user?.firstName ? `${c.user.firstName} ${c.user.lastName || ''}` : c.user?.name || c.user_id}
                      </TableCell>
                      <TableCell>{c.doc_type || c.type}</TableCell>
                      <TableCell>{c.issued_at ? new Date(c.issued_at).toLocaleDateString() : '-'}</TableCell>
                      <TableCell>
                        {c.expires_at ? new Date(c.expires_at).toLocaleDateString() : c.expires || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            c.status === 'Valid' ? 'default' : c.status === 'Expiring' ? 'secondary' : 'destructive'
                          }
                        >
                          {c.status || 'Unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            onClick={() => {
                              setEditing(c);
                              setEditOpen(true);
                            }}
                            aria-label={`Edit ${c.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {c.metadata?.file?.path && (
                            <Button
                              variant="ghost"
                              onClick={() => window.open(`${API_URL}/compliance/${c.id}/file`, '_blank')}
                              aria-label={`Download file for ${c.id}`}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" onClick={() => confirmDelete(c.id)} aria-label={`Delete ${c.id}`}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Pagination controls */}
            <div className="mt-3 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {paged.length} of {total} results
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                  Prev
                </Button>
                <div className="text-sm">
                  Page {page} / {totalPages}
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit / New dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent aria-labelledby="cert-edit-title">
          <DialogHeader>
            <DialogTitle id="cert-edit-title">{editing?.id ? 'Edit Certification' : 'New Certification'}</DialogTitle>
          </DialogHeader>
          <div className="p-4 space-y-3">
            <div>
              <label className="text-sm block mb-1">Volunteer</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    {editing?.user_id
                      ? `${selectedUser?.firstName || selectedUser?.name || ''} ${selectedUser?.lastName || ''}`
                      : usersLoading
                        ? 'Loading users...'
                        : 'Select volunteer'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput
                      placeholder="Search users..."
                      value={userQuery}
                      onValueChange={(v) => React.startTransition(() => setUserQuery(v))}
                    />
                    <CommandGroup>
                      {users.map((u) => (
                        <CommandItem
                          key={u.id}
                          onSelect={() => setEditing((s) => ({ ...(s || {}), user_id: u.id, user: u }))}
                        >
                          {u.firstName || u.name} {u.lastName || ''} {u.email ? `(${u.email})` : ''}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label className="text-sm block mb-1">Type</label>
              <Input
                value={editing?.doc_type || editing?.type || ''}
                onChange={(e) => setEditing((s) => ({ ...(s || {}), doc_type: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm block mb-1">Issued</label>
              <Input
                type="date"
                value={editing?.issued_at ? editing.issued_at.split('T')[0] : ''}
                onChange={(e) => setEditing((s) => ({ ...(s || {}), issued_at: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm block mb-1">Expires</label>
              <Input
                type="date"
                value={editing?.expires_at ? editing.expires_at.split('T')[0] : editing?.expires || ''}
                onChange={(e) => setEditing((s) => ({ ...(s || {}), expires_at: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm block mb-1">Upload File (optional)</label>
              <Input
                type="file"
                onChange={(e) => {
                  const f = e.target.files && e.target.files[0];
                  setEditing((s) => ({ ...(s || {}), file: f }));
                }}
              />
              {editing?.id && editing?.metadata?.file?.path && (
                <div className="mt-2 flex items-center gap-2">
                  <a
                    className="text-sm text-primary underline"
                    href={`${API_URL}/compliance/${editing.id}/file`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View uploaded file
                  </a>
                  <span className="text-xs text-muted-foreground">(opens in new tab)</span>
                </div>
              )}
              {editing && (editing as any).file && (
                <div className="mt-2 text-sm text-muted-foreground">Selected: {(editing as any).file.name}</div>
              )}
            </div>
            <div>
              <label className="text-sm block mb-1">Status</label>
              <Select
                value={editing?.status || 'Valid'}
                onValueChange={(v) => setEditing((s) => ({ ...(s || {}), status: v }))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Valid">Valid</SelectItem>
                  <SelectItem value="Expiring">Expiring</SelectItem>
                  <SelectItem value="Expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setEditOpen(false);
                  setEditing(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!editing?.user_id) {
                    toast.error('User id is required');
                    return;
                  }
                  saveCert(editing || {});
                }}
              >
                {editing?.id ? 'Save' : 'Create'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent aria-labelledby="cert-delete-title">
          <DialogHeader>
            <DialogTitle id="cert-delete-title">Delete Certification</DialogTitle>
          </DialogHeader>
          <div className="p-4">Are you sure you want to delete this certification?</div>
          <DialogFooter>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={doDelete}>
                Delete
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Course create / edit dialog */}
      <Dialog open={coursesOpen} onOpenChange={setCourseOpen}>
        <DialogContent aria-labelledby="course-edit-title">
          <DialogHeader>
            <DialogTitle id="course-edit-title">{courseEditing?.id ? 'Edit Course' : 'New Course'}</DialogTitle>
          </DialogHeader>
          <div className="p-4 space-y-3">
            <div>
              <label className="text-sm block mb-1">Title</label>
              <Input
                value={courseEditing?.title || courseEditing?.name || ''}
                onChange={(e) =>
                  setCourseEditing((s) => ({ ...(s || {}), title: e.target.value, name: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="text-sm block mb-1">Description</label>
              <Input
                value={courseEditing?.description || ''}
                onChange={(e) => setCourseEditing((s) => ({ ...(s || {}), description: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setCourseOpen(false);
                  setCourseEditing(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const payload = { ...(courseEditing || {}) };
                  if (!payload.title && !payload.name) {
                    toast.error('Title is required');
                    return;
                  }
                  if (payload.id) {
                    courseUpdateMutation.mutate({ id: payload.id, data: payload });
                  } else {
                    courseCreateMutation.mutate(payload);
                  }
                }}
              >
                {courseEditing?.id ? 'Save' : 'Create'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Course delete confirmation */}
      <Dialog open={courseDeleteOpen} onOpenChange={setCourseDeleteOpen}>
        <DialogContent aria-labelledby="course-delete-title">
          <DialogHeader>
            <DialogTitle id="course-delete-title">Delete Course</DialogTitle>
          </DialogHeader>
          <div className="p-4">Are you sure you want to delete this course?</div>
          <DialogFooter>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setCourseDeleteOpen(false);
                  setToDeleteCourse(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  doDeleteCourse();
                  setCourseDeleteOpen(false);
                }}
              >
                Delete
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
