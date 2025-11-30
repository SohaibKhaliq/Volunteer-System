// src/pages/admin/resources.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Package, Edit, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/atoms/popover';
import { Command, CommandGroup, CommandInput, CommandItem } from '@/components/atoms/command';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import SkeletonCard from '@/components/atoms/skeleton-card';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from '@/components/atoms/use-toast';

export default function AdminResources() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Available' | 'Low Stock' | 'Out of Stock'>('All');
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toDelete, setToDelete] = useState<number | null>(null);
  const [userQuery, setUserQuery] = useState('');
  const [debouncedUserQuery, setDebouncedUserQuery] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedUserQuery(userQuery), 300);
    return () => clearTimeout(t);
  }, [userQuery]);

  const { data: possibleOwners = [] } = useQuery(['users', debouncedUserQuery], () =>
    api.listUsers(debouncedUserQuery)
  );

  const { data: resourcesRaw, isLoading } = useQuery({
    queryKey: ['resources'],
    queryFn: api.listResources
  });

  // Normalize possible response shapes: plain array, { data: [] }, { resources: [] }
  const resources: any[] = Array.isArray(resourcesRaw)
    ? resourcesRaw
    : resourcesRaw && Array.isArray((resourcesRaw as any).data)
      ? (resourcesRaw as any).data
      : resourcesRaw && Array.isArray((resourcesRaw as any).resources)
        ? (resourcesRaw as any).resources
        : [];

  const createMutation = useMutation({
    mutationFn: api.createResource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      toast.success('Resource created successfully');
      setEditOpen(false);
      setEditing(null);
    },
    onError: () => toast.error('Failed to create resource')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.updateResource(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      toast.success('Resource updated successfully');
      setEditOpen(false);
      setEditing(null);
    },
    onError: () => toast.error('Failed to update resource')
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteResource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      toast.success('Resource deleted successfully');
      setDeleteOpen(false);
      setToDelete(null);
    },
    onError: () => toast.error('Failed to delete resource')
  });

  const filtered = resources.filter((r: any) => {
    if (filterStatus !== 'All' && r.status !== filterStatus) return false;
    if (search && !`${r.name}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const saveResource = (payload: any) => {
    if (payload.id) {
      updateMutation.mutate({ id: payload.id, data: payload });
    } else {
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
                <TableHead>Organization</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <SkeletonCard />
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No resources found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.name}</TableCell>
                    <TableCell>
                      {r.organization ? (
                        <a href={`/organizations/${r.organization.id}`} className="text-primary hover:underline">
                          {r.organization.name}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {r.quantityAvailable ?? r.quantity_available ?? 0}/{r.quantityTotal ?? r.quantity_total ?? 0}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          r.status === 'available'
                            ? 'default'
                            : r.status === 'maintenance'
                              ? 'destructive'
                              : r.status === 'in_use'
                                ? 'secondary'
                                : 'outline'
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
            <DialogTitle id="resource-edit-title">{editing?.id ? 'Edit Resource' : 'New Resource'}</DialogTitle>
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
              <label className="text-sm block mb-1">Owner (optional)</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    {editing?.owner
                      ? `${editing.owner.firstName || editing.owner.name} ${editing.owner.lastName || ''}`
                      : 'Select owner'}
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
                      {possibleOwners.map((u: any) => (
                        <CommandItem
                          key={u.id}
                          onSelect={() => setEditing((s: any) => ({ ...(s || {}), owner_id: u.id, owner: u }))}
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
              <label className="text-sm block mb-1">Quantity Total</label>
              <Input
                type="number"
                value={editing?.quantityTotal ?? editing?.quantity_total ?? ''}
                onChange={(e) => setEditing((s: any) => ({ ...(s || {}), quantityTotal: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label className="text-sm block mb-1">Quantity Available</label>
              <Input
                type="number"
                value={editing?.quantityAvailable ?? editing?.quantity_available ?? ''}
                onChange={(e) => setEditing((s: any) => ({ ...(s || {}), quantityAvailable: Number(e.target.value) }))}
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
                    toast.error('Name is required');
                    return;
                  }
                  // normalize status to expected backend values
                  const payload = {
                    ...editing,
                    status: (editing?.status || 'available').toString().toLowerCase()
                  };
                  saveResource(payload || {});
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
