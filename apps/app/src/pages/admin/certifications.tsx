// src/pages/admin/certifications.tsx
import { useMemo, useState, useEffect, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
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
// Checkbox was unused and this component may not exist in workspace; removed
import { Switch } from '@/components/ui/switch';

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
  metadata?: { file?: { path: string } };
  [key: string]: unknown;
}

interface Course {
  id?: number;
  title?: string;
  name?: string;
  description?: string;
  description_html?: string;
  assign_all?: boolean;
  assigned_user_ids?: number[] | string;
  assigned_count?: number;
  enrollments?: Array<{ user: User }> | null;
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

  // Separate user query state for courses
  const [courseUserQuery, setCourseUserQuery] = useState('');
  const [debouncedCourseUserQuery, setDebouncedCourseUserQuery] = useState('');

  const { data: items = [], isLoading } = useQuery<ComplianceDoc[]>({
    queryKey: ['compliance'],
    queryFn: () => api.listCompliance()
  });

  // Users for certifications dialog
  const [certUserQuery, setCertUserQuery] = useState('');
  const [debouncedCertUserQuery, setDebouncedCertUserQuery] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedCertUserQuery(certUserQuery), 300);
    return () => clearTimeout(timeout);
  }, [certUserQuery]);

  const { data: certUsers = [], isLoading: certUsersLoading } = useQuery<User[]>({
    queryKey: ['users', 'certifications', debouncedCertUserQuery],
    queryFn: () => api.listUsers(debouncedCertUserQuery),
    enabled: debouncedCertUserQuery.length > 0 || debouncedCertUserQuery === ''
  });

  const selectedCertUser = useMemo(
    () => certUsers.find((u) => u.id === editing?.user_id) ?? null,
    [certUsers, editing?.user_id]
  );

  // Courses section
  const [coursesOpen, setCoursesOpen] = useState(false);
  const [courseEditing, setCourseEditing] = useState<Partial<Course> | null>(null);
  const [courseDeleteOpen, setCourseDeleteOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<number | null>(null);

  const { data: courses = [], isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ['courses'],
    queryFn: () => api.listCourses()
  });

  // Users for courses dialog
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedCourseUserQuery(courseUserQuery), 300);
    return () => clearTimeout(timeout);
  }, [courseUserQuery]);

  const { data: courseUsers = [] } = useQuery<User[]>({
    queryKey: ['users', 'courses', debouncedCourseUserQuery],
    queryFn: () => api.listUsers(debouncedCourseUserQuery),
    enabled: debouncedCourseUserQuery.length > 0 || debouncedCourseUserQuery === ''
  });

  const ensureAssignedUsers = useCallback((course: Partial<Course> | null): number[] => {
    if (!course?.assigned_user_ids) return [];
    if (Array.isArray(course.assigned_user_ids)) return course.assigned_user_ids;
    if (typeof course.assigned_user_ids === 'string') {
      try {
        return JSON.parse(course.assigned_user_ids);
      } catch {
        return [];
      }
    }
    return [];
  }, []);

  const toggleCourseUser = useCallback((userId: number, currentAssigned: number[]) => {
    const index = currentAssigned.indexOf(userId);
    if (index === -1) {
      return [...currentAssigned, userId];
    } else {
      const newAssigned = [...currentAssigned];
      newAssigned.splice(index, 1);
      return newAssigned;
    }
  }, []);

  // Mutations for certifications

  const createCertMutation = useMutation({
    mutationFn: (data: Partial<ComplianceDoc> | FormData) => {
      if (data instanceof FormData) {
        return api.createComplianceWithFile(data);
      }
      return api.createCompliance(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance'] });
      toast({ title: 'Success', description: 'Certification created' });
      setEditOpen(false);
      setEditing(null);
    },
    onError: () => toast({ title: 'Error', description: 'Failed to create certification', variant: 'destructive' })
  });

  const updateCertMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ComplianceDoc> | FormData }) => {
      if (data instanceof FormData) {
        return api.updateComplianceDocWithFile(id, data);
      }
      return api.updateComplianceDoc(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance'] });
      toast({ title: 'Success', description: 'Certification updated' });
      setEditOpen(false);
      setEditing(null);
    },
    onError: () => toast({ title: 'Error', description: 'Failed to update certification', variant: 'destructive' })
  });

  const deleteCertMutation = useMutation({
    mutationFn: (id: number) => api.deleteCompliance(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance'] });
      toast({ title: 'Success', description: 'Certification deleted' });
      setDeleteOpen(false);
      setToDelete(null);
    },
    onError: () => toast({ title: 'Error', description: 'Failed to delete certification', variant: 'destructive' })
  });

  // Course mutations
  const createCourseMutation = useMutation({
    mutationFn: (data: Partial<Course>) => api.createCourse(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast({ title: 'Success', description: 'Course created' });
      setCoursesOpen(false);
      setCourseEditing(null);
    },
    onError: () => toast({ title: 'Error', description: 'Failed to create course', variant: 'destructive' })
  });

  const updateCourseMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Course> }) => api.updateCourse(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast({ title: 'Success', description: 'Course updated' });
      setCoursesOpen(false);
      setCourseEditing(null);
    },
    onError: () => toast({ title: 'Error', description: 'Failed to update course', variant: 'destructive' })
  });

  const deleteCourseMutation = useMutation({
    mutationFn: (id: number) => api.deleteCourse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast({ title: 'Success', description: 'Course deleted' });
      setCourseDeleteOpen(false);
      setCourseToDelete(null);
    },
    onError: () => toast({ title: 'Error', description: 'Failed to delete course', variant: 'destructive' })
  });

  // Filtered and paged data
  const filteredItems = useMemo(() => {
    return items.filter((item: ComplianceDoc) => {
      if (filterStatus !== 'All' && item.status !== filterStatus) return false;
      const userName = `${item.user?.firstName || item.user?.name || item.user_id || ''}`.toLowerCase();
      return userName.includes(search.toLowerCase());
    });
  }, [items, filterStatus, search]);

  const [page, setPage] = useState(1);
  const [perPage] = useState(10); // Fixed value
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / perPage));
  const pagedItems = filteredItems.slice((page - 1) * perPage, page * perPage);

  useEffect(() => {
    setPage(1);
  }, [search, filterStatus]);

  const saveCertification = useCallback(async () => {
    if (!editing?.user_id) {
      toast({ title: 'Error', description: 'Volunteer is required', variant: 'destructive' });
      return;
    }

    const payload = { ...editing } as any;
    const hasFile = payload.file instanceof File;

    if (hasFile) {
      const formData = new FormData();
      formData.append('file', payload.file);
      formData.append('user_id', String(payload.user_id));
      if (payload.doc_type) formData.append('doc_type', payload.doc_type);
      if (payload.issued_at) formData.append('issued_at', payload.issued_at);
      if (payload.expires_at) formData.append('expires_at', payload.expires_at);
      if (payload.status) formData.append('status', payload.status);

      if (payload.id) {
        await updateCertMutation.mutateAsync({ id: payload.id, data: formData });
      } else {
        await createCertMutation.mutateAsync(formData);
      }
    } else {
      if (payload.id) {
        await updateCertMutation.mutateAsync({ id: payload.id, data: payload });
      } else {
        await createCertMutation.mutateAsync(payload);
      }
    }
  }, [editing, createCertMutation, updateCertMutation]);

  // Render functions
  const renderCertificationTable = () => (
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
            <TableCell colSpan={6} className="text-center">
              <SkeletonCard />
            </TableCell>
          </TableRow>
        ) : pagedItems.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-muted-foreground h-24">
              {search || filterStatus !== 'All' ? 'No certifications match your filters' : 'No certifications found'}
            </TableCell>
          </TableRow>
        ) : (
          pagedItems.map((cert) => (
            <TableRow key={cert.id}>
              <TableCell className="font-medium">
                {cert.user?.firstName
                  ? `${cert.user.firstName} ${cert.user.lastName || ''}`.trim()
                  : cert.user?.name || String(cert.user_id || 'Unknown')}
              </TableCell>
              <TableCell>{cert.doc_type || cert.type || '-'}</TableCell>
              <TableCell>{cert.issued_at ? new Date(cert.issued_at).toLocaleDateString() : '-'}</TableCell>
              <TableCell>
                {cert.expires_at ? new Date(cert.expires_at).toLocaleDateString() : cert.expires || '-'}
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    cert.status === 'Valid' ? 'default' : cert.status === 'Expiring' ? 'secondary' : 'destructive'
                  }
                >
                  {cert.status || 'Unknown'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditing(cert);
                      setCertUserQuery('');
                      setEditOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  {cert.metadata?.file?.path && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        try {
                          const res: any = await api.getComplianceFile(cert.id);
                          const data = res?.data ?? res;
                          const blob = new Blob([data], { type: 'application/octet-stream' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          const filename =
                            cert.metadata?.file?.storedName ||
                            cert.metadata?.file?.path?.split('/').pop() ||
                            `file-${cert.id}`;
                          a.download = filename;
                          document.body.appendChild(a);
                          a.click();
                          a.remove();
                          URL.revokeObjectURL(url);
                        } catch (e) {
                          toast.error('Failed to download file');
                        }
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setToDelete(cert.id!);
                      setDeleteOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-6">
      {/* Tabs */}
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

      {/* Courses Tab */}
      {activeTab === 'courses' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Training Courses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-6">
              <div className="text-sm text-muted-foreground">Manage training courses offered to volunteers.</div>
              <Button
                onClick={() => {
                  setCourseEditing({ assign_all: false });
                  setCourseUserQuery('');
                  setCoursesOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Course
              </Button>
            </div>

            {coursesLoading ? (
              <SkeletonCard />
            ) : courses.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No courses found. <br />
                <Button
                  variant="link"
                  onClick={() => {
                    setCourseEditing({ assign_all: false });
                    setCoursesOpen(true);
                  }}
                  className="p-0 h-auto"
                >
                  Create your first course
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {courses.map((course) => (
                  <div key={course.id} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{course.title || course.name}</div>
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {course.description_html ? (
                          <span dangerouslySetInnerHTML={{ __html: course.description_html }} />
                        ) : (
                          course.description
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 ml-4">
                      <div className="text-xs text-muted-foreground text-right min-w-[120px]">
                        {course.assign_all ? (
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full" />
                            All volunteers
                          </span>
                        ) : (
                          <span>{course.assigned_count ?? 0} volunteers</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setCourseEditing(course);
                            setCourseUserQuery('');
                            setCoursesOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setCourseToDelete(course.id!);
                            setCourseDeleteOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Certifications Tab */}
      {activeTab === 'certifications' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Volunteer Certifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
              <Input
                placeholder="Search by volunteer name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-64"
              />
              <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as typeof filterStatus)}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Status</SelectItem>
                  <SelectItem value="Valid">Valid</SelectItem>
                  <SelectItem value="Expiring">Expiring</SelectItem>
                  <SelectItem value="Expired">Expired</SelectItem>
                </SelectContent>
              </Select>
              <div className="ml-auto flex items-center gap-4">
                <Button
                  onClick={() => {
                    setEditing(null);
                    setCertUserQuery('');
                    setEditOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Certification
                </Button>
              </div>
            </div>

            {renderCertificationTable()}

            {/* Pagination */}
            {filteredItems.length > 0 && (
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground">
                  Showing {(page - 1) * perPage + 1} to {Math.min(page * perPage, filteredItems.length)} of{' '}
                  {filteredItems.length} results
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm font-medium min-w-[80px] text-center">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Certification Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Edit Certification' : 'New Certification'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Volunteer *</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <span>
                      {selectedCertUser
                        ? `${selectedCertUser.firstName || selectedCertUser.name || ''} ${selectedCertUser.lastName || ''}`.trim() ||
                          'Select volunteer'
                        : certUsersLoading
                          ? 'Loading...'
                          : 'Select volunteer'}
                    </span>
                    <span className="ml-2">▼</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Search volunteers..."
                      value={certUserQuery}
                      onValueChange={setCertUserQuery}
                    />
                    <CommandGroup className="max-h-60 overflow-y-auto">
                      {certUsers.map((user) => (
                        <CommandItem
                          key={user.id}
                          onSelect={() => {
                            setEditing((prev) =>
                              prev ? { ...prev, user_id: user.id, user } : { user_id: user.id, user }
                            );
                          }}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center justify-between w-full">
                            <span>
                              {user.firstName || user.name} {user.lastName || ''}
                              {user.email ? ` • ${user.email}` : ''}
                            </span>
                            {editing?.user_id === user.id && ' ✓'}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Certification Type</label>
              <Input
                value={editing?.doc_type || editing?.type || ''}
                onChange={(e) =>
                  setEditing((prev) => (prev ? { ...prev, doc_type: e.target.value } : { doc_type: e.target.value }))
                }
                placeholder="e.g., CPR Certification"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Issued Date</label>
                <Input
                  type="date"
                  value={editing?.issued_at ? editing.issued_at.split('T')[0] : ''}
                  onChange={(e) =>
                    setEditing((prev) =>
                      prev ? { ...prev, issued_at: e.target.value } : { issued_at: e.target.value }
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Expires</label>
                <Input
                  type="date"
                  value={editing?.expires_at ? editing.expires_at.split('T')[0] : ''}
                  onChange={(e) =>
                    setEditing((prev) =>
                      prev ? { ...prev, expires_at: e.target.value } : { expires_at: e.target.value }
                    )
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">File (optional)</label>
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setEditing((prev) => (prev ? { ...prev, file } : { file }));
                  }
                }}
              />
              {editing?.file ? (
                <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded-md">
                  {(editing.file as File).name} ({((editing.file as File).size / 1024 / 1024) | 0}MB)
                </div>
              ) : null}
              {editing?.id && editing?.metadata?.file?.path && (
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    variant="link"
                    onClick={async () => {
                      try {
                        const res: any = await api.getComplianceFile(editing.id);
                        const data = res?.data ?? res;
                        const blob = new Blob([data], { type: 'application/octet-stream' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        const filename =
                          editing?.metadata?.file?.storedName ||
                          editing?.metadata?.file?.path?.split('/').pop() ||
                          `file-${editing.id}`;
                        a.download = filename;
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        URL.revokeObjectURL(url);
                      } catch (e) {
                        toast.error('Failed to download file');
                      }
                    }}
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    📎 View current file
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={editing?.status || 'Valid'}
                onValueChange={(value) => setEditing((prev) => (prev ? { ...prev, status: value } : { status: value }))}
              >
                <SelectTrigger>
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
              onClick={saveCertification}
              disabled={!editing?.user_id || createCertMutation.isPending || updateCertMutation.isPending}
            >
              {createCertMutation.isPending || updateCertMutation.isPending
                ? 'Saving...'
                : editing?.id
                  ? 'Save'
                  : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialogs */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Certification</DialogTitle>
          </DialogHeader>
          <div className="py-4">Are you sure? This action cannot be undone.</div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => toDelete && deleteCertMutation.mutate(toDelete)}
              disabled={deleteCertMutation.isPending}
            >
              {deleteCertMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Course Edit Dialog */}
      <Dialog open={coursesOpen} onOpenChange={setCoursesOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{courseEditing?.id ? 'Edit Course' : 'New Course'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Course Title *</label>
                <Input
                  value={courseEditing?.title || courseEditing?.name || ''}
                  onChange={(e) =>
                    setCourseEditing((prev) =>
                      prev
                        ? { ...prev, title: e.target.value, name: e.target.value }
                        : { title: e.target.value, name: e.target.value }
                    )
                  }
                  placeholder="Enter course title"
                  className="text-lg"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <TipTapEditor
                  value={courseEditing?.description_html || courseEditing?.description || ''}
                  onChange={(html: string) =>
                    setCourseEditing((prev) =>
                      prev ? { ...prev, description_html: html } : { description_html: html }
                    )
                  }
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Switch
                    checked={!!courseEditing?.assign_all}
                    onCheckedChange={(checked) => {
                      setCourseEditing((prev) => ({
                        ...prev,
                        assign_all: checked,
                        assigned_user_ids: checked ? [] : prev?.assigned_user_ids || []
                      }));
                    }}
                  />
                  Assign to all volunteers
                </label>

                {!courseEditing?.assign_all && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Assigned Volunteers</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-between">
                          <span>
                            {(() => {
                              const assigned = ensureAssignedUsers(courseEditing);
                              if (assigned.length === 0) return 'Select volunteers...';
                              return `${assigned.length} volunteer${assigned.length !== 1 ? 's' : ''} selected`;
                            })()}
                          </span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0 max-h-60" align="start">
                        <Command>
                          <CommandInput
                            placeholder="Search volunteers..."
                            value={courseUserQuery}
                            onValueChange={setCourseUserQuery}
                          />
                          <CommandGroup className="max-h-48 overflow-y-auto">
                            {courseUsers.map((user) => {
                              const assigned = ensureAssignedUsers(courseEditing).includes(user.id);
                              return (
                                <CommandItem
                                  key={user.id}
                                  onSelect={() => {
                                    setCourseEditing((prev) => {
                                      if (!prev) return prev;
                                      const current = ensureAssignedUsers(prev);
                                      const newAssigned = toggleCourseUser(user.id, current);
                                      return { ...prev, assigned_user_ids: newAssigned };
                                    });
                                  }}
                                  className="cursor-pointer"
                                >
                                  <div className="flex items-center justify-between w-full">
                                    <span>
                                      {user.firstName || user.name} {user.lastName || ''}
                                      {user.email ? ` • ${user.email}` : ''}
                                    </span>
                                    {assigned && <span className="ml-2 text-green-600">✓</span>}
                                  </div>
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCoursesOpen(false);
                setCourseEditing(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                const payload = { ...(courseEditing || {}) };
                if (!payload.title && !payload.name) {
                  toast({ title: 'Error', description: 'Title is required', variant: 'destructive' });
                  return;
                }
                if (payload.assigned_user_ids && typeof payload.assigned_user_ids === 'string') {
                  try {
                    payload.assigned_user_ids = JSON.parse(payload.assigned_user_ids);
                  } catch {
                    payload.assigned_user_ids = [];
                  }
                }

                if (payload.id) {
                  await updateCourseMutation.mutateAsync({ id: payload.id as number, data: payload });
                } else {
                  await createCourseMutation.mutateAsync(payload);
                }
              }}
              disabled={!courseEditing?.title || createCourseMutation.isPending || updateCourseMutation.isPending}
            >
              {createCourseMutation.isPending || updateCourseMutation.isPending
                ? 'Saving...'
                : courseEditing?.id
                  ? 'Save Course'
                  : 'Create Course'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Course Delete Dialog */}
      <Dialog open={courseDeleteOpen} onOpenChange={setCourseDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Course</DialogTitle>
          </DialogHeader>
          <div className="py-4">Are you sure you want to delete this course? This action cannot be undone.</div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCourseDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => courseToDelete && deleteCourseMutation.mutate(courseToDelete)}
              disabled={deleteCourseMutation.isPending}
            >
              {deleteCourseMutation.isPending ? 'Deleting...' : 'Delete Course'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Fixed TipTap Editor Component
interface TipTapEditorProps {
  value: string;
  onChange: (html: string) => void;
}

function TipTapEditor({ value, onChange }: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none'
      }
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    }
  });

  useEffect(() => {
    if (editor && editor.getHTML() !== value) {
      // passing a boolean here is not accepted by the editor API types; use no-options.
      editor.commands.setContent(value);
    }
  }, [editor, value]);

  return (
    <div className="relative">
      <div className="border rounded-md p-3 min-h-[120px] bg-background">
        {editor && <EditorContent editor={editor} />}
      </div>
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-xs text-muted-foreground">Rich text editor</span>
      </div>
    </div>
  );
}
