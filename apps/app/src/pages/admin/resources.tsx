// src/pages/admin/resources.tsx
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Package, Edit, Trash2, Plus } from 'lucide-react';
import { resources as mockResources } from '@/lib/mock/adminMock';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import SkeletonCard from '@/components/atoms/skeleton-card';

export default function AdminResources() {
  const [resources, setResources] = useState(() => mockResources.slice());
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Available' | 'Low Stock' | 'Out of Stock'>('All');
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toDelete, setToDelete] = useState<number | null>(null);

  const filtered = resources.filter((r) => {
    if (filterStatus !== 'All' && r.status !== filterStatus) return false;
    if (search && !`${r.name}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const saveResource = (payload: any) => {
    if (payload.id) {
      const next = resources.map((r) => (r.id === payload.id ? { ...r, ...payload } : r));
      setResources(next);
      const idx = mockResources.findIndex((m) => m.id === payload.id);
      if (idx !== -1) Object.assign(mockResources[idx], payload);
    } else {
      const id = Math.max(0, ...resources.map((r) => r.id)) + 1;
      const nr = { ...payload, id };
      setResources([nr, ...resources]);
      mockResources.unshift(nr);
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
    const next = resources.filter((r) => r.id !== toDelete);
    setResources(next);
    const idx = mockResources.findIndex((m) => m.id === toDelete);
    if (idx !== -1) mockResources.splice(idx, 1);
    setToDelete(null);
    setDeleteOpen(false);
  };

  return (
    <div className="space-y-6" aria-busy={false}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Resource Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 mb-4">
            <Input
              placeholder="Search resources"
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
                <SelectItem value="Available">Available</SelectItem>
                <SelectItem value="Low Stock">Low Stock</SelectItem>
                <SelectItem value="Out of Stock">Out of Stock</SelectItem>
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
                New Resource
              </Button>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Resource</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <SkeletonCard />
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.name}</TableCell>
                    <TableCell>{r.quantity}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          r.status === 'Available' ? 'default' : r.status === 'Low Stock' ? 'secondary' : 'destructive'
                        }
                      >
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setEditing(r);
                            setEditOpen(true);
                          }}
                          aria-label={`Edit ${r.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" onClick={() => confirmDelete(r.id)} aria-label={`Delete ${r.id}`}>
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
        <DialogContent aria-labelledby="resource-edit-title">
          <DialogHeader>
            <DialogTitle id="resource-edit-title">{editing ? 'Edit Resource' : 'New Resource'}</DialogTitle>
          </DialogHeader>
          <div className="p-4 space-y-3">
            <div>
              <label className="text-sm block mb-1">Name</label>
              <Input
                value={editing?.name || ''}
                onChange={(e) => setEditing((s: any) => ({ ...(s || {}), name: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm block mb-1">Quantity</label>
              <Input
                type="number"
                value={editing?.quantity || ''}
                onChange={(e) => setEditing((s: any) => ({ ...(s || {}), quantity: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label className="text-sm block mb-1">Status</label>
              <Select
                value={editing?.status || 'Available'}
                onValueChange={(v) => setEditing((s: any) => ({ ...(s || {}), status: v }))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Available">Available</SelectItem>
                  <SelectItem value="Low Stock">Low Stock</SelectItem>
                  <SelectItem value="Out of Stock">Out of Stock</SelectItem>
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
                  if (!editing?.name) {
                    alert('Name is required');
                    return;
                  }
                  saveResource(editing || {});
                }}
              >
                {editing ? 'Save' : 'Create'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent aria-labelledby="resource-delete-title">
          <DialogHeader>
            <DialogTitle id="resource-delete-title">Delete Resource</DialogTitle>
          </DialogHeader>
          <div className="p-4">Are you sure you want to delete this resource?</div>
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
