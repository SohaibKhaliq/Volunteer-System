// src/pages/admin/resources.tsx
import { useState, useEffect, startTransition, Fragment } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Package, Plus } from 'lucide-react';
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
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
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
    queryFn: () => api.listResources()
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

  const deleteMutation = useMutation<void, any, number>({
    mutationFn: (id: number) => api.deleteResource(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      toast.success('Resource deleted successfully');
      setDeleteOpen(false);
      setToDelete(null);
    },
    onError: () => toast.error('Failed to delete resource')
  });

  const patchStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => api.patchResourceStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      toast.success('Resource status updated');
    },
    onError: () => {
      toast.error('Failed to update resource status');
    }
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
  // Maintenance / Retire UI state
  const [maintenanceOpen, setMaintenanceOpen] = useState(false);
  const [maintenanceResource, setMaintenanceResource] = useState<any | null>(null);
  const [maintenanceQuantity, setMaintenanceQuantity] = useState<number | undefined>(undefined);
  const [maintenanceDate, setMaintenanceDate] = useState<Date | null>(null);
  const [maintenanceTime, setMaintenanceTime] = useState<string>('09:00');
  const [maintenanceNotes, setMaintenanceNotes] = useState<string | null>(null);
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

  // organization scoped resources query removed - not used at the moment

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
            const u: any = await api.getUser(item.id);
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
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="sm">
                            Actions
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2">
                          <div className="flex flex-col">
                            {canQuickAssign && (
                              <Button
                                variant="ghost"
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
                              onClick={() => {
                                setMaintenanceResource(r);
                                setMaintenanceQuantity(1);
                                setMaintenanceDate(null);
                                setMaintenanceTime('09:00');
                                setMaintenanceNotes(null);
                                setMaintenanceOpen(true);
                              }}
                            >
                              Maintenance
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() => {
                                setHistoryResource(r);
                                setHistoryOpen(true);
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
                            >
                              Edit
                            </Button>

                            {/* Quick status changes using the server patch endpoint */}
                            <div className="mt-2 border-t pt-2">
                              <div className="text-xs text-muted-foreground mb-1">Set status</div>
                              <div className="flex flex-col">
                                <Button
                                  variant="ghost"
                                  onClick={() => patchStatusMutation.mutate({ id: r.id, status: 'available' })}
                                >
                                  Available
                                </Button>
                                <Button
                                  variant="ghost"
                                  onClick={() => patchStatusMutation.mutate({ id: r.id, status: 'in_use' })}
                                >
                                  In Use
                                </Button>
                                <Button
                                  variant="ghost"
                                  onClick={() => patchStatusMutation.mutate({ id: r.id, status: 'reserved' })}
                                >
                                  Reserved
                                </Button>
                                <Button
                                  variant="ghost"
                                  onClick={() => patchStatusMutation.mutate({ id: r.id, status: 'maintenance' })}
                                >
                                  Maintenance
                                </Button>
                                <Button
                                  variant="ghost"
                                  onClick={() => patchStatusMutation.mutate({ id: r.id, status: 'retired' })}
                                >
                                  Retired
                                </Button>
                              </div>
                            </div>
                            {r.status === 'retired' ? (
                              <Button
                                variant="ghost"
                                onClick={async () => {
                                  try {
                                    await api.reactivateResource(r.id);
                                    queryClient.invalidateQueries({ queryKey: ['resources'] });
                                    toast.success('Resource reactivated');
                                  } catch (e) {
                                    toast.error('Failed to reactivate resource');
                                  }
                                }}
                              >
                                Reactivate
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                onClick={async () => {
                                  if (!confirm('Retire this resource?')) return;
                                  try {
                                    await api.retireResource(r.id);
                                    queryClient.invalidateQueries({ queryKey: ['resources'] });
                                    toast.success('Resource retired');
                                  } catch (e) {
                                    toast.error('Failed to retire resource');
                                  }
                                }}
                              >
                                Retire
                              </Button>
                            )}
                            <Button variant="ghost" className="text-red-600" onClick={() => confirmDelete(r.id)}>
                              Delete
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
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
                      onValueChange={(v) => startTransition(() => setUserQuery(v))}
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
                value={editing?.status || 'available'}
                onValueChange={(v) => setEditing((s: any) => ({ ...(s || {}), status: v }))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="in_use">In Use</SelectItem>
                  <SelectItem value="reserved">Reserved</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
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
                    const available =
                      assigningResource?.quantityAvailable ?? assigningResource?.quantity_available ?? 0;
                    if (!assignQuantity || assignQuantity <= 0) {
                      toast.error('Enter a positive quantity');
                      return;
                    }
                    if (assignQuantity > available) {
                      toast.error('Insufficient quantity available');
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
                    <Fragment key={h.id ?? `${h.assignedAt}-${h.relatedId || h.related_id || Math.random()}`}>
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
                    </Fragment>
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
      {/* Maintenance dialog */}
      <Dialog open={maintenanceOpen} onOpenChange={setMaintenanceOpen}>
        <DialogContent aria-labelledby="maintenance-title">
          <DialogHeader>
            <DialogTitle id="maintenance-title">Create Maintenance</DialogTitle>
          </DialogHeader>
          <div className="p-4 space-y-3">
            <div>
              <div className="text-sm text-muted-foreground">Resource</div>
              <div className="font-medium">{maintenanceResource?.name ?? '—'}</div>
            </div>
            <div>
              <label className="text-sm block mb-1">Quantity to take out</label>
              <Input
                type="number"
                value={maintenanceQuantity ?? ''}
                onChange={(e) => setMaintenanceQuantity(Number(e.target.value) || undefined)}
              />
            </div>
            <div>
              <label className="text-sm block mb-1">Expected return date</label>
              <DayPicker
                mode="single"
                selected={maintenanceDate ?? undefined}
                onSelect={(d) => setMaintenanceDate(d ?? null)}
              />
              <div className="mt-2">
                <label className="text-sm block mb-1">Time</label>
                <Input type="time" value={maintenanceTime} onChange={(e) => setMaintenanceTime(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-sm block mb-1">Notes</label>
              <Input value={maintenanceNotes ?? ''} onChange={(e) => setMaintenanceNotes(e.target.value || null)} />
            </div>
          </div>
          <DialogFooter>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setMaintenanceOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!maintenanceResource) return;

                  // Validate quantity
                  const available =
                    maintenanceResource?.quantityAvailable ?? maintenanceResource?.quantity_available ?? 0;
                  if (!maintenanceQuantity || maintenanceQuantity <= 0) {
                    toast.error('Enter a positive quantity');
                    return;
                  }
                  if (maintenanceQuantity > available) {
                    toast.error('Insufficient quantity available');
                    return;
                  }

                  // Combine selected date and time into a single ISO string (local time -> ISO)
                  let maintenanceExpectedAt: string | undefined = undefined;
                  if (maintenanceDate) {
                    const [hh = '09', mm = '00'] = (maintenanceTime || '09:00').split(':');
                    const d = new Date(maintenanceDate);
                    d.setHours(Number(hh), Number(mm), 0, 0);
                    maintenanceExpectedAt = d.toISOString();
                  }

                  try {
                    await api.createMaintenance(maintenanceResource.id, {
                      quantity: maintenanceQuantity,
                      expectedReturnAt: maintenanceExpectedAt,
                      notes: maintenanceNotes
                    });
                    queryClient.invalidateQueries({ queryKey: ['resources'] });
                    queryClient.invalidateQueries({ queryKey: ['resource-assignments', maintenanceResource.id] });
                    toast.success('Maintenance created');
                    setMaintenanceOpen(false);
                  } catch (e) {
                    toast.error('Failed to create maintenance');
                  }
                }}
              >
                Create
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
