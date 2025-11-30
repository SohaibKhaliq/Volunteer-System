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
import { useApp } from '@/providers/app-provider';
import api from '@/lib/api';
import { axios } from '@/lib/axios';
import { toast } from '@/components/atoms/use-toast';

export default function AdminResources() {
  const queryClient = useQueryClient();
  const { user } = useApp();

  const canQuickAssign = !!(
    user?.isAdmin ||
    user?.is_admin ||
    (user?.roles &&
      Array.isArray(user.roles) &&
      user.roles.some((r: any) => {
        const n = (r?.name || r?.role || '').toLowerCase();
        return n === 'admin' || n === 'organization_admin' || n === 'organization_manager';
      }))
  );
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

  // Helpers for displaying quantity and status
  const formatQuantity = (r: any) => {
    const available = Number(r.quantityAvailable ?? r.quantity_available ?? 0) || 0;
    const total = Number(r.quantityTotal ?? r.quantity_total ?? 0) || 0;
    return `${available}/${total}`;
  };

  const getStatusInfo = (r: any) => {
    const raw = (r.status ?? r.state ?? '').toString().toLowerCase();
    const available = Number(r.quantityAvailable ?? r.quantity_available ?? 0) || 0;
    const total = Number(r.quantityTotal ?? r.quantity_total ?? 0) || 0;

    // Preserve explicit statuses like maintenance/retired/in_use
    if (raw === 'maintenance' || raw === 'retired' || raw === 'in_use') {
      const label = raw === 'in_use' ? 'In Use' : raw.charAt(0).toUpperCase() + raw.slice(1);
      const variant = raw === 'maintenance' ? 'destructive' : raw === 'in_use' ? 'secondary' : 'outline';
      return { label, variant };
    }

    // Derive status from quantities
    if (total === 0) {
      return { label: 'No Stock', variant: 'outline' };
    }
    if (available <= 0) {
      return { label: 'Out of Stock', variant: 'destructive' };
    }
    // low stock threshold: 20% of total, at least 1
    const lowThreshold = Math.max(1, Math.ceil(total * 0.2));
    if (available <= lowThreshold) {
      return { label: 'Low Stock', variant: 'secondary' };
    }

    return { label: 'Available', variant: 'default' };
  };

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

  // Quick assign resource
  const [assignOpen, setAssignOpen] = useState(false);
  const [assigningResource, setAssigningResource] = useState<any | null>(null);
  const [assignEventId, setAssignEventId] = useState<number | null>(null);
  const [assignQuantity, setAssignQuantity] = useState<number>(1);
  // Assignment history dialog
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyResource, setHistoryResource] = useState<any | null>(null);
  const [relatedNames, setRelatedNames] = useState<Record<string, string>>({});
  // Use organization-scoped events and resources, but gracefully fall back to global lists
  const { data: eventsRaw } = useQuery(
    ['organization-events'],
    async () => {
      try {
        // suppress backend error toast if user isn't in an org
        return await axios.get('/organization/events', { _suppressError: true });
      } catch (e) {
        return await api.listEvents();
      }
    },
    { staleTime: 1000 * 60 * 2 }
  );
  const events: any[] = Array.isArray(eventsRaw) ? eventsRaw : (eventsRaw?.data ?? []);

  const { data: orgResourcesRaw } = useQuery(
    ['organization-resources'],
    async () => {
      try {
        return await axios.get('/organization/resources', { _suppressError: true });
      } catch (e) {
        return await api.listResources();
      }
    },
    { staleTime: 1000 * 60 * 2 }
  );
  const orgResources: any[] = Array.isArray(orgResourcesRaw)
    ? orgResourcesRaw
    : (orgResourcesRaw?.data ?? orgResourcesRaw?.resources ?? []);

  const assignMutation = useMutation({
    mutationFn: ({ resourceId, payload }: { resourceId: number; payload: any }) =>
      api.assignResource(resourceId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      toast.success('Resource assigned');
      setAssignOpen(false);
      setAssigningResource(null);
      setAssignEventId(null);
      setAssignQuantity(1);
    },
    onError: () => toast.error('Failed to assign resource')
  });

  // Fetch assignment history when dialog is open
  const { data: historyRaw, refetch: refetchHistory } = useQuery(
    ['resource-assignments', historyResource?.id],
    () => (historyResource ? api.listResourceAssignments(historyResource.id) : Promise.resolve([])),
    { enabled: !!historyOpen && !!historyResource }
  );
  const history: any[] = Array.isArray(historyRaw) ? historyRaw : (historyRaw?.data ?? []);

  // When history is loaded, resolve relatedIds to friendly names (event title or volunteer name)
  useEffect(() => {
    if (!history || history.length === 0) return;

    const toFetch: Array<{ type: string; id: number }> = [];
    const seen = new Set<string>();
    for (const h of history) {
      const type = h.assignmentType ?? h.assignment_type ?? '';
      const id = h.relatedId ?? h.related_id ?? null;
      if (!id) continue;
      const key = `${type}:${id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      toFetch.push({ type, id });
    }

    if (toFetch.length === 0) return;

    (async () => {
      const map: Record<string, string> = {};
      for (const item of toFetch) {
        try {
          if (item.type === 'event') {
            const ev: any = await api.getEvent(item.id);
            map[`event:${item.id}`] = ev?.title ?? ev?.name ?? `event:${item.id}`;
          } else if (item.type === 'volunteer' || item.type === 'user') {
            // fetch user
            const u: any = await axios.get(`/users/${item.id}`);
            map[`${item.type}:${item.id}`] = u?.firstName || u?.first_name || u?.name || `user:${item.id}`;
          } else {
            // fallback: just show id
            map[`${item.type}:${item.id}`] = `${item.type}:${item.id}`;
          }
        } catch (e) {
          map[`${item.type}:${item.id}`] = `${item.type}:${item.id}`;
        }
      }
      setRelatedNames((s) => ({ ...(s || {}), ...map }));
    })();
  }, [history]);

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
                    <TableCell>{formatQuantity(r)}</TableCell>
                    <TableCell>
                      {(() => {
                        const s = getStatusInfo(r);
                        return <Badge variant={s.variant as any}>{s.label}</Badge>;
                      })()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {canQuickAssign && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setAssigningResource(r);
                              setAssignOpen(true);
                            }}
                          >
                            Quick Assign
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setHistoryResource(r);
                            setHistoryOpen(true);
                            // trigger fetch
                            setTimeout(() => refetchHistory(), 10);
                          }}
                        >
                          History
                        </Button>
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

      {/* Quick Assign Resource dialog */}
      {canQuickAssign && (
        <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
          <DialogContent aria-labelledby="assign-resource-title">
            <DialogHeader>
              <DialogTitle id="assign-resource-title">Quick Assign Resource</DialogTitle>
            </DialogHeader>
            <div className="p-4 space-y-3">
              <div>
                <div className="text-sm text-muted-foreground">Resource</div>
                <div className="font-medium">{assigningResource?.name ?? '—'}</div>
              </div>
              <div>
                <label className="text-sm block mb-1">Event</label>
                <select
                  className="w-full border rounded px-2 py-1"
                  value={assignEventId ?? ''}
                  onChange={(e) => setAssignEventId(Number(e.target.value) || null)}
                >
                  <option value="">Select event</option>
                  {events.map((ev: any) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.name ?? ev.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm block mb-1">Quantity</label>
                <Input
                  type="number"
                  value={assignQuantity}
                  onChange={(e) => setAssignQuantity(Number(e.target.value))}
                />
              </div>
            </div>
            <DialogFooter>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setAssignOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (!assigningResource) return;
                    if (!assignEventId) {
                      toast.error('Choose an event');
                      return;
                    }
                    if (!assignQuantity || assignQuantity <= 0) {
                      toast.error('Enter a positive quantity');
                      return;
                    }
                    // Send explicit assignmentType and relatedId to match backend validation
                    assignMutation.mutate({
                      resourceId: assigningResource.id,
                      payload: {
                        resourceId: assigningResource.id,
                        assignmentType: 'event',
                        relatedId: assignEventId,
                        quantity: assignQuantity
                      }
                    });
                  }}
                >
                  Assign
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      {/* Assignment History dialog */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent aria-labelledby="assignment-history-title">
          <DialogHeader>
            <DialogTitle id="assignment-history-title">Assignment History</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <div className="mb-3">
              <div className="text-sm text-muted-foreground">Resource</div>
              <div className="font-medium">{historyResource?.name ?? '—'}</div>
            </div>
            <div className="space-y-2">
              {history.length === 0 ? (
                <div className="text-sm text-muted-foreground">No assignments found</div>
              ) : (
                <div className="grid grid-cols-6 gap-2 text-sm">
                  <div className="font-medium">Assigned At</div>
                  <div className="font-medium">Type</div>
                  <div className="font-medium">Related Id</div>
                  <div className="font-medium">Quantity</div>
                  <div className="font-medium">Status</div>
                  <div className="font-medium">Returned At</div>
                  {history.map((h: any) => (
                    <React.Fragment key={h.id ?? `${h.assignedAt}-${h.relatedId || h.related_id || Math.random()}`}>
                      <div>
                        {h.assignedAt || h.assigned_at || h.createdAt || h.created_at || ''
                          ? new Date(h.assignedAt ?? h.assigned_at ?? h.createdAt ?? h.created_at).toLocaleString()
                          : '—'}
                      </div>
                      <div>{h.assignmentType ?? h.assignment_type ?? '—'}</div>
                      <div>
                        {(() => {
                          const type = h.assignmentType ?? h.assignment_type ?? '';
                          const id = h.relatedId ?? h.related_id ?? null;
                          if (!id) return '—';
                          const key = `${type}:${id}`;
                          return relatedNames[key] ?? id;
                        })()}
                      </div>
                      <div>{h.quantity ?? h.qty ?? 1}</div>
                      <div>{h.status ?? h.state ?? '—'}</div>
                      <div>
                        {h.returnedAt || h.returned_at || null
                          ? new Date(h.returnedAt ?? h.returned_at).toLocaleString()
                          : '—'}
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setHistoryOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
