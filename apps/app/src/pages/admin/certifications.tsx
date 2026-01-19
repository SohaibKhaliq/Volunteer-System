// src/pages/admin/certifications.tsx
import { useMemo, useState, useEffect, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Award, Edit, Trash2, Plus, Download, Shield, CheckCircle, Upload, FileText, Search, User as UserIcon, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
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
import { safeFormatDate } from '@/lib/format-utils';

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
  assigned_organization_ids?: number[];
  assigned_count?: number;
  assigned_org_count?: number;
  enrollments?: Array<{ user: User }> | null;
  organizations?: Array<{ id: number; name: string }> | null;
}

interface CertificateRec {
  id: number;
  uuid: string;
  recipientType: 'volunteer' | 'organization';
  userId?: number;
  user?: User;
  recipientOrganizationId?: number;
  recipientOrganization?: { id: number; name: string };
  organizationId: number;
  organization?: { id: number; name: string };
  moduleId?: number;
  module?: { id: number; title: string; name?: string };
  fileName: string;
  status: 'active' | 'revoked';
  issuedAt: string;
  revocationReason?: string;
}

export default function AdminCertifications() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'courses' | 'compliance' | 'certificates'>('courses');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Valid' | 'Expiring' | 'Expired'>('All');
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<ComplianceDoc> | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toDelete, setToDelete] = useState<number | null>(null);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [toRevoke, setToRevoke] = useState<number | null>(null);
  const [revokeReason, setRevokeReason] = useState('');

  // Issue Certificate State
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [issueForm, setIssueForm] = useState({
    userId: '',
    moduleId: '',
    recipientType: 'volunteer' as 'volunteer' | 'organization',
    organizationId: '' // The issuing org
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [issueVolQuery, setIssueVolQuery] = useState('');
  const [issueOrgQuery, setIssueOrgQuery] = useState('');

  // Separate user query state for courses
  const [courseUserQuery, setCourseUserQuery] = useState('');
  const [debouncedCourseUserQuery, setDebouncedCourseUserQuery] = useState('');
  const [courseOrgQuery, setCourseOrgQuery] = useState('');

  const { data: rawData, isLoading } = useQuery({
    queryKey: ['compliance'],
    queryFn: () => api.listCompliance(),
    enabled: activeTab === 'compliance'
  });

  const { data: certsRaw, isLoading: certsLoading } = useQuery({
    queryKey: ['admin-certificates'],
    queryFn: () => api.listAllCertificates(),
    enabled: activeTab === 'certificates'
  });

  // Always fetch organizations for course assignment
  const { data: orgsRaw } = useQuery({
    queryKey: ['admin-organizations'],
    queryFn: () => api.listOrganizations(),
  });

  const { data: modsRaw } = useQuery({
    queryKey: ['admin-modules'],
    queryFn: () => api.listTrainingModules(),
    enabled: isIssueModalOpen
  });

  const allOrganizations = Array.isArray(orgsRaw) ? orgsRaw : ((orgsRaw as any)?.data ?? []);
  const allModules = Array.isArray(modsRaw) ? modsRaw : ((modsRaw as any)?.data ?? []);

  const certificates = Array.isArray(certsRaw) ? certsRaw : ((certsRaw as any)?.data ?? []);

  const items = Array.isArray(rawData) ? rawData : ((rawData as any)?.data ?? []);

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

  const ensureAssignedOrgs = useCallback((course: Partial<Course> | null): number[] => {
    if (!course) return [];
    if (Array.isArray(course.assigned_organization_ids)) return course.assigned_organization_ids;
    // If we're editing an existing course, we might need to populate from course.organizations
    if (course.organizations && Array.isArray(course.organizations)) {
      return course.organizations.map(o => o.id);
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

  const toggleCourseOrg = useCallback((orgId: number, currentAssigned: number[]) => {
    const index = currentAssigned.indexOf(orgId);
    if (index === -1) {
      return [...currentAssigned, orgId];
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

  const adminRevokeMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => api.adminRevokeCertificate(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-certificates'] });
      toast({ title: 'Certificate revoked' });
      setRevokeOpen(false);
      setRevokeReason('');
    },
    onError: () => toast({ title: 'Error', description: 'Failed to revoke certificate', variant: 'destructive' })
  });

  const issueCertMutation = useMutation({
    mutationFn: (data: FormData) => api.adminIssueCertificate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-certificates'] });
      toast({ title: 'Success', description: 'Certificate issued successfully' });
      setIsIssueModalOpen(false);
      setIssueForm({ userId: '', moduleId: '', recipientType: 'volunteer', organizationId: '' });
      setSelectedFile(null);
    },
    onError: (err: any) => {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to issue certificate',
        variant: 'destructive'
      });
    }
  });

  const handleIssueCert = () => {
    if (!issueForm.userId) {
      toast({ title: 'Validation Error', description: `Please select a recipient ${issueForm.recipientType}`, variant: 'destructive' });
      return;
    }
    if (!issueForm.organizationId) {
      toast({ title: 'Validation Error', description: 'Please select an issuing organization', variant: 'destructive' });
      return;
    }
    if (!selectedFile) {
      toast({ title: 'Validation Error', description: 'Please upload a certificate file', variant: 'destructive' });
      return;
    }

    const formData = new FormData();
    if (issueForm.recipientType === 'volunteer') {
      formData.append('userId', issueForm.userId);
    } else {
      formData.append('recipientOrgId', issueForm.userId);
    }

    if (issueForm.moduleId && issueForm.moduleId !== 'none') {
      formData.append('moduleId', issueForm.moduleId);
    }

    // For Admin, we always pass organizationId to the issue endpoint
    formData.append('organizationId', issueForm.organizationId);

    formData.append('recipientType', issueForm.recipientType);
    formData.append('certificate_file', selectedFile);

    issueCertMutation.mutate(formData);
  };

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
        <TableRow className="bg-muted/50 hover:bg-muted/50">
          <TableHead className="font-bold">Volunteer</TableHead>
          <TableHead className="font-bold">Type</TableHead>
          <TableHead className="font-bold">Issued</TableHead>
          <TableHead className="font-bold">Expires</TableHead>
          <TableHead className="font-bold">Status</TableHead>
          <TableHead className="font-bold text-right">Actions</TableHead>
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
          pagedItems.map((cert: ComplianceDoc) => (
            <TableRow key={cert.id}>
              <TableCell className="font-medium">
                {cert.user?.firstName
                  ? `${cert.user.firstName} ${cert.user.lastName || ''}`.trim()
                  : cert.user?.name || String(cert.user_id || 'Unknown')}
              </TableCell>
              <TableCell>{cert.doc_type || cert.type || '-'}</TableCell>
              <TableCell>{safeFormatDate(cert.issued_at, 'dd MMM yyyy', '-')}</TableCell>
              <TableCell>
                {safeFormatDate(cert.expires_at || cert.expires, 'dd MMM yyyy', '-')}
              </TableCell>
              <TableCell>
                <div className={cn(
                  "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                  cert.status === 'Valid' ? "bg-green-100 text-green-800 border-green-200" :
                    cert.status === 'Expiring' ? "bg-yellow-100 text-yellow-800 border-yellow-200" :
                      "bg-red-100 text-red-800 border-red-200"
                )}>
                  {cert.status === 'Valid' && <CheckCircle className="w-3 h-3 mr-1" />}
                  {cert.status || 'Unknown'}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center gap-2">
                  {/* Verification Actions */}
                  {cert.status !== 'Valid' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      title="Approve / Verify"
                      onClick={() => {
                        if (confirm('Verify this certification?')) {
                          updateCertMutation.mutate({ id: cert.id, data: { status: 'Valid' } });
                        }
                      }}
                    >
                      <Award className="h-4 w-4" />
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    title="Reject / Expire"
                    onClick={() => {
                      if (confirm('Mark this certification as Expired/Rejected?')) {
                        updateCertMutation.mutate({ id: cert.id, data: { status: 'Expired' } });
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>

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
                    <Trash2 className="h-4 w-4 text-gray-500" />
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
            variant={activeTab === 'compliance' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('compliance')}
          >
            Compliance Documents
          </Button>
          <Button
            variant={activeTab === 'certificates' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('certificates')}
          >
            Issued Certificates
          </Button>
        </div>
      </div>

      {/* Courses Tab */}
      {activeTab === 'courses' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Award className="h-5 w-5" />
              </div>
              Training Courses
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-8 bg-muted/30 p-4 rounded-xl border border-dashed">
              <div className="text-sm text-muted-foreground font-medium">Manage training courses offered to volunteers.</div>
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

      {/* Compliance Tab */}
      {activeTab === 'compliance' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-600">
                <Shield className="h-5 w-5" />
              </div>
              Compliance Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
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
      {/* Certificates Tab */}
      {activeTab === 'certificates' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-blue-500/10 rounded-lg text-blue-600">
                <Award className="h-5 w-5" />
              </div>
              Issued Certificates
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
              <Input
                placeholder="Search recipient or module..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-64"
              />
              <div className="ml-auto">
                <Button onClick={() => setIsIssueModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Issue Certificate
                </Button>
              </div>
            </div>

            {certsLoading ? (
              <SkeletonCard />
            ) : certificates.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No issued certificates found.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Training Module</TableHead>
                    <TableHead>Issued By</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {certificates
                    .filter((c: CertificateRec) => {
                      const term = search.toLowerCase();
                      const recipientName = c.recipientType === 'volunteer'
                        ? `${c.user?.firstName || ''} ${c.user?.lastName || ''}`.trim()
                        : c.recipientOrganization?.name || '';
                      return recipientName.toLowerCase().includes(term) ||
                        (c.module?.title || c.module?.name || '').toLowerCase().includes(term);
                    })
                    .map((cert: CertificateRec) => (
                      <TableRow key={cert.id}>
                        <TableCell className="font-medium">
                          {cert.recipientType === 'volunteer'
                            ? `${cert.user?.firstName || ''} ${cert.user?.lastName || ''}`.trim() || cert.user?.email || 'Unknown'
                            : cert.recipientOrganization?.name || 'Unknown Organization'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">{cert.recipientType}</Badge>
                        </TableCell>
                        <TableCell>{cert.module?.title || cert.module?.name || 'N/A'}</TableCell>
                        <TableCell>{cert.organization?.name || 'System'}</TableCell>
                        <TableCell>{safeFormatDate(cert.issuedAt)}</TableCell>
                        <TableCell>
                          <Badge className={cert.status === 'active' ? 'bg-green-500' : 'bg-red-500'}>
                            {cert.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" asChild>
                              <a href={`${API_URL}/certificates/${cert.id}/download`} target="_blank" rel="noreferrer">
                                <Download className="h-4 w-4" />
                              </a>
                            </Button>
                            {cert.status === 'active' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => {
                                  setToRevoke(cert.id);
                                  setRevokeOpen(true);
                                }}
                              >
                                <Shield className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Revoke Dialog */}
      <Dialog open={revokeOpen} onOpenChange={setRevokeOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden border-none shadow-premium bg-white rounded-3xl">
          <div className="p-6 border-b border-red-50 bg-red-50/30">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-xl font-bold text-red-600">
                <div className="p-2 bg-red-100 rounded-xl text-red-600 font-bold">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                Revoke Certificate
              </DialogTitle>
            </DialogHeader>
          </div>
          <div className="p-8 space-y-6">
            <div className="bg-red-50/50 border border-red-100 rounded-2xl p-4 flex gap-3 shadow-sm">
              <ShieldAlert className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 leading-relaxed font-semibold">
                This action is permanent and will invalidate the digital signature of this certificate.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 uppercase tracking-widest pl-1">Reason for Revocation *</label>
              <Input
                placeholder="e.g. Expired, issued by mistake, misconduct..."
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                className="bg-gray-50/50 border-gray-200 h-12 rounded-2xl focus:ring-red-500/20 shadow-inner"
              />
              <p className="text-[11px] text-gray-400 font-bold italic pl-1">This will be visible on the verification page.</p>
            </div>
          </div>
          <DialogFooter className="p-6 border-t border-gray-100 bg-gray-50/30">
            <Button variant="ghost" onClick={() => setRevokeOpen(false)} className="font-bold text-gray-500 rounded-2xl h-12 px-8">Cancel</Button>
            <Button
              variant="destructive"
              disabled={!revokeReason || adminRevokeMutation.isPending}
              onClick={() => toRevoke && adminRevokeMutation.mutate({ id: toRevoke, reason: revokeReason })}
              className="shadow-xl shadow-red-200 h-12 px-10 rounded-2xl font-bold min-w-[170px]"
            >
              {adminRevokeMutation.isPending ? 'Processing...' : 'Revoke Certificate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
                  value={editing?.issued_at && typeof editing.issued_at === 'string' ? editing.issued_at.split('T')[0] : ''}
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
                  value={editing?.expires_at && typeof editing.expires_at === 'string' ? editing.expires_at.split('T')[0] : ''}
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
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Assigned Organizations</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-between">
                            <span>
                              {(() => {
                                const assigned = ensureAssignedOrgs(courseEditing);
                                if (assigned.length === 0) return 'Select organizations...';
                                return `${assigned.length} organization${assigned.length !== 1 ? 's' : ''} selected`;
                              })()}
                            </span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0 max-h-60" align="start">
                          <Command>
                            <CommandInput
                              placeholder="Search organizations..."
                              value={courseOrgQuery}
                              onValueChange={setCourseOrgQuery}
                            />
                            <CommandGroup className="max-h-48 overflow-y-auto">
                              {allOrganizations
                                .filter((org: any) =>
                                  !courseOrgQuery || org.name.toLowerCase().includes(courseOrgQuery.toLowerCase())
                                )
                                .map((org: any) => {
                                  const assigned = ensureAssignedOrgs(courseEditing).includes(org.id);
                                  return (
                                    <CommandItem
                                      key={org.id}
                                      onSelect={() => {
                                        setCourseEditing((prev) => {
                                          if (!prev) return prev;
                                          const current = ensureAssignedOrgs(prev);
                                          const newAssigned = toggleCourseOrg(org.id, current);
                                          return { ...prev, assigned_organization_ids: newAssigned };
                                        });
                                      }}
                                      className="cursor-pointer"
                                    >
                                      <div className="flex items-center justify-between w-full">
                                        <span>{org.name}</span>
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

      {/* Admin Issue Certificate Modal */}
      <Dialog open={isIssueModalOpen} onOpenChange={setIsIssueModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-0 border-none shadow-premium bg-white/95 backdrop-blur-lg gap-0">
          <div className="flex-none p-6 border-b border-gray-100/50 bg-gradient-to-r from-primary/5 to-transparent">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="flex items-center gap-3 text-xl font-bold text-gray-900">
                  <div className="p-2 bg-primary/10 rounded-xl text-primary font-bold">
                    <Award className="h-6 w-6" />
                  </div>
                  Issue New Certificate
                </DialogTitle>
              </div>
              <p className="text-sm text-gray-500 mt-2">Directly issue professional certifications to volunteers or organizations.</p>
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent pr-2">
            {/* Step 1: Issuing Authority */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600 shadow-sm ring-4 ring-blue-50/50">1</div>
                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.15em]">Issuing Authority</h3>
              </div>
              <div className="pl-8 space-y-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Providing Organization *</label>
                  <Select
                    value={issueForm.organizationId}
                    onValueChange={(val) => setIssueForm({ ...issueForm, organizationId: val })}
                  >
                    <SelectTrigger className="bg-gray-50/50 border-gray-200 focus:ring-primary/20 transition-all h-11 rounded-xl">
                      <SelectValue placeholder="Select which organization is granting this..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl shadow-2xl border-gray-100">
                      {allOrganizations.map((org: any) => (
                        <SelectItem key={org.id} value={String(org.id)} className="py-2.5 rounded-lg m-1">{org.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-gray-400 italic font-medium">As an admin, you can issue certificates on behalf of any organization.</p>
                </div>
              </div>
            </section>

            {/* Step 2: Recipient Details */}
            <section className="space-y-4 border-t border-gray-50 pt-6">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600 shadow-sm ring-4 ring-indigo-50/50">2</div>
                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.15em]">Recipient Details</h3>
              </div>
              <div className="pl-8 space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Entity Type</label>
                    <Select
                      value={issueForm.recipientType}
                      onValueChange={(val) => setIssueForm({ ...issueForm, recipientType: val as any, userId: '' })}
                    >
                      <SelectTrigger className="bg-gray-50/50 border-gray-200 h-11 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="volunteer" className="py-2">Volunteer</SelectItem>
                        <SelectItem value="organization" className="py-2">Organization</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">
                      {issueForm.recipientType === 'volunteer' ? 'Select Volunteer' : 'Select Organization'} *
                    </label>
                    {issueForm.recipientType === 'volunteer' ? (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-between bg-gray-50/50 border-gray-200 h-11 rounded-xl text-left font-normal hover:bg-white transition-all shadow-sm">
                            <span className="truncate">
                              {issueForm.userId ? (() => {
                                const v = certUsers.find((v: any) => v.id === Number(issueForm.userId));
                                if (!v) return "Select volunteer...";
                                const name = `${v.firstName || v.name || ''} ${v.lastName || ''}`.trim();
                                return name || v.email || "Unknown Volunteer";
                              })() : "Select volunteer..."}
                            </span>
                            <UserIcon className="ml-2 h-4 w-4 shrink-0 opacity-50 text-primary" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0 shadow-2xl border-none ring-1 ring-black/5 bg-white rounded-2xl overflow-hidden mt-1" align="end">
                          <Command className="bg-white">
                            <div className="flex items-center border-b border-gray-100 px-3">
                              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                              <CommandInput placeholder="Search name or email..." onValueChange={setCertUserQuery} className="h-10 border-none focus:ring-0 text-sm" />
                            </div>
                            <CommandGroup className="max-h-[250px] overflow-auto p-1">
                              {certUsers.map((vol: any) => (
                                <CommandItem
                                  key={vol.id}
                                  onSelect={() => setIssueForm({ ...issueForm, userId: String(vol.id) })}
                                  className="cursor-pointer hover:bg-primary/5 aria-selected:bg-primary/5 rounded-xl py-2.5 px-3 transition-colors m-1"
                                >
                                  <div className="flex items-center gap-3 w-full">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-xs text-primary font-bold shadow-sm ring-2 ring-white">
                                      {vol.firstName?.[0] || vol.name?.[0] || 'V'}
                                    </div>
                                    <div className="flex flex-col min-w-0 flex-1">
                                      <span className="font-bold text-sm text-gray-900 truncate">
                                        {(vol.firstName || vol.lastName) ? `${vol.firstName || ''} ${vol.lastName || ''}`.trim() : (vol.name || 'Unknown')}
                                      </span>
                                      <span className="text-[11px] text-gray-500 font-medium truncate">{vol.email}</span>
                                    </div>
                                  </div>
                                </CommandItem>
                              ))}
                              {certUsers.length === 0 && (
                                <div className="p-8 text-center text-sm text-gray-500 font-medium">No volunteers found matching your query</div>
                              )}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <Select value={issueForm.userId} onValueChange={(val) => setIssueForm({ ...issueForm, userId: val })}>
                        <SelectTrigger className="bg-gray-50/50 border-gray-200 h-11 rounded-xl">
                          <SelectValue placeholder="Select organization..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl shadow-xl">
                          {allOrganizations.map((org: any) => (
                            <SelectItem key={org.id} value={String(org.id)} className="py-2.5 rounded-lg m-1">{org.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Step 3: Authentication */}
            <section className="space-y-4 border-t border-gray-50 pt-6">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-[10px] font-bold text-amber-600 shadow-sm ring-4 ring-amber-50/50">3</div>
                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.15em]">Authentication</h3>
              </div>
              <div className="pl-8 space-y-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Digital Certificate (PDF/Image) *</label>
                  <div
                    className={cn(
                      "group border-2 border-dashed rounded-[2rem] p-10 flex flex-col items-center justify-center transition-all cursor-pointer relative overflow-hidden",
                      selectedFile
                        ? "border-primary bg-primary/5 ring-4 ring-primary/5"
                        : "border-gray-200 hover:border-primary/40 hover:bg-gray-50/50 hover:shadow-inner"
                    )}
                    onClick={() => document.getElementById('admin-cert-upload')?.click()}
                  >
                    {selectedFile ? (
                      <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                        <div className="w-16 h-16 rounded-[1.25rem] bg-white shadow-2xl flex items-center justify-center mb-4 ring-1 ring-black/5">
                          <FileText className="h-8 w-8 text-primary" />
                        </div>
                        <p className="text-sm font-bold text-gray-900 line-clamp-1 max-w-[280px] mb-1">{selectedFile.name}</p>
                        <p className="text-[10px] font-bold text-primary/60 uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB • VERIFIED FILE</p>
                        <Button variant="ghost" size="sm" className="mt-5 text-[10px] font-bold text-primary hover:bg-primary/10 h-8 rounded-lg uppercase tracking-wider px-4 transition-all" onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}>
                          Replace Selection
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center group-hover:scale-105 transition-all duration-300">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-5 group-hover:bg-primary/10 transition-colors shadow-sm ring-8 ring-white">
                          <Upload className="h-7 w-7 text-gray-400 group-hover:text-primary transition-colors" />
                        </div>
                        <p className="text-sm font-bold text-gray-700 tracking-tight">Drop certificate here or click to browse</p>
                        <p className="text-[11px] text-gray-400 mt-2 font-medium">High-resolution PDF, JPG, PNG (Max 10MB)</p>
                      </div>
                    )}
                    <input
                      id="admin-cert-upload"
                      type="file"
                      className="hidden"
                      accept=".pdf,image/*"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Linked Training Module <span className="text-gray-400 font-normal">(Optional)</span></label>
                  <Select value={issueForm.moduleId} onValueChange={(val) => setIssueForm({ ...issueForm, moduleId: val })}>
                    <SelectTrigger className="bg-gray-50/50 border-gray-200 h-11 rounded-xl">
                      <SelectValue placeholder="Associate with a specific module..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl shadow-xl">
                      <SelectItem value="none" className="py-2.5 font-bold text-gray-400 italic text-xs uppercase tracking-wider rounded-lg m-1">No Module Partnership</SelectItem>
                      {allModules.map((m: any) => (
                        <SelectItem key={m.id} value={String(m.id)} className="py-2.5 rounded-lg m-1">{m.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>
          </div>

          <div className="flex-none p-6 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-4">
            <Button
              variant="ghost"
              onClick={() => {
                setIsIssueModalOpen(false);
                setIssueForm({ userId: '', moduleId: '', recipientType: 'volunteer', organizationId: '' });
                setSelectedFile(null);
              }}
              className="text-gray-500 font-bold hover:bg-gray-100 h-12 px-8 rounded-2xl transition-all"
            >
              Cancel
            </Button>
            <Button
              onClick={handleIssueCert}
              disabled={issueCertMutation.isPending}
              className="bg-primary hover:bg-primary/90 text-white shadow-premium-hover h-12 px-10 rounded-2xl font-bold min-w-[180px] transition-all active:scale-[0.98] flex items-center gap-2"
            >
              {issueCertMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Issue Certificate</span>
                </>
              )}
            </Button>
          </div>
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
