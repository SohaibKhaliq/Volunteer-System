// src/pages/admin/certifications.tsx
// src/pages/admin/certifications.tsx
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Award, Edit, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import SkeletonCard from '@/components/atoms/skeleton-card';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function AdminCertifications() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Valid' | 'Expiring' | 'Expired'>('All');
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toDelete, setToDelete] = useState<number | null>(null);

  const { data: items = [], isLoading } = useQuery({ queryKey: ['compliance'], queryFn: api.listCompliance });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.createCompliance(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['compliance']);
      toast.success('Certification created');
      setEditOpen(false);
      setEditing(null);
    },
    onError: () => toast.error('Failed to create certification')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.updateComplianceDoc(id, data),
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

  const filtered = (items as any[]).filter((r: any) => {
    if (filterStatus !== 'All' && r.status !== filterStatus) return false;
    if (
      search &&
      !`${r.user?.firstName || r.user?.name || r.user_id || ''}`.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  const saveCert = (payload: any) => {
    if (payload.id) {
      updateMutation.mutate({ id: payload.id, data: payload });
    } else {
      // create expects user_id, doc_type, issued_at, expires_at
      createMutation.mutate(payload);
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

  return (
    <div className="space-y-6" aria-busy={isLoading}>
      {/* Courses summary (read-only) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Training Courses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SkeletonCard />
        </CardContent>
      </Card>

      {/* Certifications with CRUD (backed by API) */}
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
            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
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
            <div className="ml-auto">
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
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No certifications found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((c: any) => (
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
        </CardContent>
      </Card>

      {/* Edit / New dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent aria-labelledby="cert-edit-title">
          <DialogHeader>
            <DialogTitle id="cert-edit-title">{editing?.id ? 'Edit Certification' : 'New Certification'}</DialogTitle>
          </DialogHeader>
          <div className="p-4 space-y-3">
            <div>
              <label className="text-sm block mb-1">Volunteer (user id)</label>
              <Input
                value={editing?.user_id || editing?.user?.id || ''}
                onChange={(e) => setEditing((s: any) => ({ ...(s || {}), user_id: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label className="text-sm block mb-1">Type</label>
              <Input
                value={editing?.doc_type || editing?.type || ''}
                onChange={(e) => setEditing((s: any) => ({ ...(s || {}), doc_type: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm block mb-1">Issued</label>
              <Input
                type="date"
                value={editing?.issued_at ? editing.issued_at.split('T')[0] : ''}
                onChange={(e) => setEditing((s: any) => ({ ...(s || {}), issued_at: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm block mb-1">Expires</label>
              <Input
                type="date"
                value={editing?.expires_at ? editing.expires_at.split('T')[0] : editing?.expires || ''}
                onChange={(e) => setEditing((s: any) => ({ ...(s || {}), expires_at: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm block mb-1">Status</label>
              <Select
                value={editing?.status || 'Valid'}
                onValueChange={(v) => setEditing((s: any) => ({ ...(s || {}), status: v }))}
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
    </div>
  );
}
