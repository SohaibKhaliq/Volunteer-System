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
import { certs as mockCerts, courses as mockCourses } from '@/lib/mock/adminMock';
import { toast } from 'sonner';

export default function AdminCertifications() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Valid' | 'Expiring' | 'Expired'>('All');
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toDelete, setToDelete] = useState<number | null>(null);
  const [items, setItems] = useState(() => mockCerts.slice());
  const [loading] = useState(false);

  const filtered = items.filter((r: any) => {
    if (filterStatus !== 'All' && r.status !== filterStatus) return false;
    if (search && !`${r.volunteer}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const saveCert = (payload: any) => {
    if (payload.id) {
      const idx = items.findIndex((i) => i.id === payload.id);
      if (idx >= 0) {
        const next = items.slice();
        next[idx] = { ...next[idx], ...payload };
        setItems(next);
        // sync to shared mock
        (mockCerts as any[])[idx] = next[idx];
        toast.success('Certification updated');
      }
    } else {
      const id = Math.max(0, ...items.map((i) => i.id)) + 1;
      const nr = { id, ...payload };
      setItems([nr, ...items]);
      (mockCerts as any[]).unshift(nr);
      toast.success('Certification created');
    }
    setEditOpen(false);
    setEditing(null);
  };

  const confirmDelete = (id: number) => {
    setToDelete(id);
    setDeleteOpen(true);
  };

  const doDelete = () => {
    if (toDelete == null) return;
    const next = items.filter((i) => i.id !== toDelete);
    setItems(next);
    const idx = (mockCerts as any[]).findIndex((i) => i.id === toDelete);
    if (idx >= 0) (mockCerts as any[]).splice(idx, 1);
    setDeleteOpen(false);
    setToDelete(null);
    toast.success('Certification deleted');
  };

  return (
    <div className="space-y-6" aria-busy={loading}>
      {/* Courses summary (read-only) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Training Courses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course</TableHead>
                <TableHead>Participants</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead>Progress</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockCourses.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.name}</TableCell>
                  <TableCell>{c.participants}</TableCell>
                  <TableCell>{c.completed}</TableCell>
                  <TableCell>
                    <Badge variant="default">{Math.round((c.completed / c.participants) * 100)}%</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Certifications with CRUD */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Volunteer Certifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 mb-4">
            <Input placeholder="Search volunteer" value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
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
                <TableHead>Expires</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <SkeletonCard />
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No certifications found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.volunteer}</TableCell>
                    <TableCell>{c.type}</TableCell>
                    <TableCell>{c.expires}</TableCell>
                    <TableCell>
                      <Badge variant={c.status === 'Valid' ? 'default' : c.status === 'Expiring' ? 'secondary' : 'destructive'}>
                        {c.status}
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
              <label className="text-sm block mb-1">Volunteer</label>
              <Input value={editing?.volunteer || ''} onChange={(e) => setEditing((s: any) => ({ ...(s || {}), volunteer: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm block mb-1">Type</label>
              <Input value={editing?.type || ''} onChange={(e) => setEditing((s: any) => ({ ...(s || {}), type: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm block mb-1">Expires</label>
              <Input type="date" value={editing?.expires || ''} onChange={(e) => setEditing((s: any) => ({ ...(s || {}), expires: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm block mb-1">Status</label>
              <Select value={editing?.status || 'Valid'} onValueChange={(v) => setEditing((s: any) => ({ ...(s || {}), status: v }))}>
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
              <Button variant="outline" onClick={() => { setEditOpen(false); setEditing(null); }}>
                Cancel
              </Button>
              <Button onClick={() => {
                if (!editing?.volunteer) { toast.error('Volunteer is required'); return; }
                saveCert(editing || {});
              }}>
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
              <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={doDelete}>Delete</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
