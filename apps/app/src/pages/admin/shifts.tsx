import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { axios } from '@/lib/axios';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, Edit, Trash2, Clock } from 'lucide-react';
import { toast } from '@/components/atoms/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useApp } from '@/providers/app-provider';
import useSystemRoles from '@/hooks/useSystemRoles';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/atoms/popover';
import { Command, CommandGroup, CommandInput, CommandItem } from '@/components/atoms/command';
import SkeletonCard from '@/components/atoms/skeleton-card';

// Format date to human-readable string
const formatDate = (dateStr?: string) => {
  if (!dateStr) return '—';
  try {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return dateStr;
  }
};

export default function AdminShifts() {
  const { user } = useApp();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);

  const { data: shiftsRaw, isLoading } = useQuery(['shifts', search, page, perPage], () =>
    api.listShifts({ search, page, perPage })
  );

  type Shift = {
    id: number;
    title?: string;
    event?: { id?: number; name?: string; title?: string } | null;
    start_at?: string;
    startAt?: string;
    end_at?: string;
    endAt?: string;
    capacity?: number;
  };

  type UserSnippet = { id: number; firstName?: string; lastName?: string; name?: string; email?: string };

  const shifts: Shift[] = Array.isArray(shiftsRaw) ? shiftsRaw : (shiftsRaw?.data ?? []);
  const totalPages = shiftsRaw?.meta?.lastPage || shiftsRaw?.lastPage || 1;
  const currentPage = shiftsRaw?.meta?.currentPage || shiftsRaw?.currentPage || page;

  const deleteMutation = useMutation<void, unknown, number>({
    mutationFn: (id: number) => api.deleteShift(id),
    onSuccess: () => queryClient.invalidateQueries(['shifts'])
  });

  // Quick assign volunteer
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignShift, setAssignShift] = useState<Shift | null>(null);
  const [userQuery, setUserQuery] = useState('');
  const [debouncedUserQuery, setDebouncedUserQuery] = useState('');

  // Scheduled Jobs state
  const [jobName, setJobName] = useState('');
  const [jobType, setJobType] = useState('communication');
  const [jobRunAt, setJobRunAt] = useState('');
  const [jobPayload, setJobPayload] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedUserQuery(userQuery), 250);
    return () => clearTimeout(t);
  }, [userQuery]);

  const { data: orgProfile } = useQuery(
    ['organization-profile'],
    async () => {
      try {
        // suppress error toast for users not in an org
        return await axios.get('/organization/profile', { _suppressError: true });
      } catch (e) {
        return null;
      }
    },
    { staleTime: 1000 * 60 * 5 }
  );

  const { isPrivilegedUser } = useSystemRoles();
  const isAdmin = isPrivilegedUser(user);

  const { data: possibleUsersRaw } = useQuery<UserSnippet[] | { data: UserSnippet[] }>(
    ['organization-volunteers', orgProfile?.data?.id ?? orgProfile?.id, debouncedUserQuery],
    async () => {
      const orgId = orgProfile?.data?.id ?? orgProfile?.id;
      if (orgId) {
        const res = await api.getOrganizationVolunteers(orgId, { search: debouncedUserQuery });
        if (Array.isArray(res)) return res;
        if (res && Array.isArray((res as { data?: unknown }).data)) {
          return (res as { data?: unknown }).data as UserSnippet[];
        }
        return [] as const;
      } else if (isAdmin) {
        // Fallback for platform admins: search all users
        return await api.listUsers(debouncedUserQuery);
      }
      return [] as const;
    },
    { enabled: !!orgProfile || isAdmin }
  );

  const possibleUsers: UserSnippet[] = Array.isArray(possibleUsersRaw)
    ? possibleUsersRaw
    : (possibleUsersRaw?.data ?? []);

  const assignMutation = useMutation({
    mutationFn: (data: { shift_id: number; user_id: number }) => api.assignToShift(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['shifts']);
      toast.success('Volunteer assigned');
      setAssignOpen(false);
      setAssignShift(null);
      setUserQuery('');
    },
    onError: () => toast.error('Failed to assign volunteer')
  });

  // Bulk assign
  const [selectedShifts, setSelectedShifts] = useState<number[]>([]);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkUser, setBulkUser] = useState<UserSnippet | null>(null);

  const bulkAssignMutation = useMutation({
    mutationFn: async (payload: any) => api.bulkAssignToShift(payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['shifts']);
      toast.success('Bulk assignment completed');
      setBulkOpen(false);
      setSelectedShifts([]);
      setBulkUser(null);
    },
    onError: () => toast.error('Bulk assignment failed')
  });

  // Shift suggestions
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestShift, setSuggestShift] = useState<Shift | null>(null);
  const { data: suggestionsRaw, isFetching: suggestionsLoading } = useQuery(
    ['shift', 'suggestions', suggestShift?.id],
    async () => {
      if (!suggestShift) return [] as const;
      const res: any = await api.getShiftSuggestions(suggestShift.id, 10);
      // API returns { suggestions: [{user: {...}, score: number}] } format
      let suggestions = [];
      if (Array.isArray(res)) {
        suggestions = res;
      } else if (res?.suggestions) {
        suggestions = res.suggestions;
      } else {
        suggestions = res?.data ?? [];
      }

      // Extract user objects from {user, score} format
      return suggestions.map((item: any) => item?.user ?? item);
    },
    { enabled: !!suggestOpen && !!suggestShift }
  );

  const suggestions: UserSnippet[] = Array.isArray(suggestionsRaw) ? suggestionsRaw : (suggestionsRaw?.data ?? []);

  // Scheduled Jobs query and mutations
  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ['scheduledJobs'],
    queryFn: () => api.listScheduledJobs()
  });
  const jobs = Array.isArray(jobsData) ? jobsData : [];

  const createJobMutation = useMutation({
    mutationFn: api.createScheduledJob,
    onSuccess: () => {
      queryClient.invalidateQueries(['scheduledJobs']);
      toast({ title: 'Scheduled job created' });
      setJobName('');
      setJobRunAt('');
      setJobPayload('');
    },
    onError: (err: any) => {
      console.error('createScheduledJob error', err?.response?.data ?? err);
      toast({ title: 'Failed to create scheduled job', variant: 'destructive' });
    }
  });

  const retryJobMutation = useMutation({
    mutationFn: (id: number) => api.retryScheduledJob(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['scheduledJobs']);
      toast({ title: 'Retry scheduled' });
    },
    onError: () => toast({ title: 'Retry failed', variant: 'destructive' })
  });

  // Edit Shift
  const [editOpen, setEditOpen] = useState(false);
  const [editShift, setEditShift] = useState<Shift | null>(null);

  const editMutation = useMutation({
    mutationFn: (data: { id: number; data: any }) => api.updateShift(data.id, data.data),
    onSuccess: () => {
      queryClient.invalidateQueries(['shifts']);
      toast.success('Shift updated successfully');
      setEditOpen(false);
      setEditShift(null);
    },
    onError: () => toast.error('Failed to update shift')
  });

  const canQuickAssign = isAdmin;

  const bulkButtonLabel = bulkAssignMutation.isLoading
    ? `Assigning (${selectedShifts.length})…`
    : `Bulk Assign (${selectedShifts.length})`;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">Shifts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 mb-4">
            <Input
              placeholder="Search shifts"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64"
            />
            <div className="ml-auto flex items-center gap-2">
              <div className="text-sm text-muted-foreground mr-2">Selected: {selectedShifts.length}</div>
              <Button
                size="sm"
                variant="outline"
                disabled={selectedShifts.length === 0 || bulkAssignMutation.isLoading}
                onClick={() => setBulkOpen(true)}
                aria-disabled={selectedShifts.length === 0 || bulkAssignMutation.isLoading}
              >
                {bulkButtonLabel}
              </Button>

              <Button onClick={() => (window.location.href = '/admin/shifts/new')}>
                <Plus className="h-4 w-4 mr-2" /> New Shift
              </Button>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead />
                <TableHead>Title</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                  </TableCell>
                </TableRow>
              ) : shifts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No shifts found
                  </TableCell>
                </TableRow>
              ) : (
                shifts.map((s: Shift) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedShifts.includes(s.id)}
                        disabled={bulkAssignMutation.isLoading}
                        onChange={(e) => {
                          setSelectedShifts((prev) =>
                            e.target.checked ? Array.from(new Set(prev.concat([s.id]))) : prev.filter((x) => x !== s.id)
                          );
                        }}
                      />
                    </TableCell>
                    <TableCell>{s.title}</TableCell>
                    <TableCell>{s.event?.name ?? s.event?.title ?? '—'}</TableCell>
                    <TableCell>{formatDate(s.start_at ?? s.startAt)}</TableCell>
                    <TableCell>{formatDate(s.end_at ?? s.endAt)}</TableCell>
                    <TableCell>{s.capacity ?? 0}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {canQuickAssign && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setAssignShift(s);
                              setAssignOpen(true);
                            }}
                          >
                            Quick Assign
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSuggestShift(s);
                            setSuggestOpen(true);
                          }}
                        >
                          Suggestions
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditShift({
                              ...s,
                              startAt: s.start_at || s.startAt,
                              endAt: s.end_at || s.endAt
                            });
                            setEditOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(s.id)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
              {shifts.length > 0 && ` (${shifts.length} shifts)`}
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1 || isLoading}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((p) => p + 1)}
                disabled={isLoading || (totalPages > 1 && currentPage >= totalPages)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {canQuickAssign && (
        <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
          <DialogContent aria-labelledby="assign-volunteer-title">
            <DialogHeader>
              <DialogTitle id="assign-volunteer-title">Quick Assign Volunteer</DialogTitle>
            </DialogHeader>
            <div className="p-4 space-y-3">
              <div>
                <div className="text-sm text-muted-foreground">Shift</div>
                <div className="font-medium">{assignShift?.title ?? '—'}</div>
              </div>
              <div>
                <label className="text-sm block mb-1">Search volunteer</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      {userQuery || 'Search users...'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[320px] p-0">
                    <Command>
                      <CommandInput
                        placeholder="Search users..."
                        value={userQuery}
                        onValueChange={(v) => setUserQuery(v)}
                      />
                      <CommandGroup>
                        {possibleUsers.map((u: UserSnippet) => (
                          <CommandItem
                            key={u.id}
                            onSelect={() => {
                              setUserQuery(`${u.firstName ?? u.name} ${u.lastName ?? ''}`);
                              // immediately assign
                              if (assignShift) assignMutation.mutate({ shift_id: assignShift.id, user_id: u.id });
                            }}
                          >
                            {u.firstName ?? u.name} {u.lastName ?? ''} {u.email ? `(${u.email})` : ''}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <DialogFooter>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setAssignOpen(false)}>
                  Close
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Suggestions dialog */}
      <Dialog open={suggestOpen} onOpenChange={setSuggestOpen}>
        <DialogContent aria-labelledby="suggestions-title">
          <DialogHeader>
            <DialogTitle id="suggestions-title">Suggested Volunteers</DialogTitle>
          </DialogHeader>
          <div className="p-4 space-y-3">
            <div className="text-sm text-muted-foreground">Shift: {suggestShift?.title ?? '—'}</div>
            {suggestionsLoading ? (
              <div className="text-muted-foreground">Loading suggestions…</div>
            ) : suggestions.length === 0 ? (
              <div className="text-muted-foreground">No suggestions available</div>
            ) : (
              suggestions.map((u) => (
                <div key={u.id} className="flex items-center justify-between gap-3 p-2 border rounded">
                  <div>
                    <div className="font-medium">{u.firstName ?? u.name}</div>
                    <div className="text-sm text-muted-foreground">{u.email}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={assignMutation.isLoading}
                      onClick={() => assignMutation.mutate({ shift_id: suggestShift!.id, user_id: u.id })}
                    >
                      {assignMutation.isLoading ? (
                        <>
                          <Loader2 className="animate-spin h-4 w-4 mr-2 inline" /> Assigning
                        </>
                      ) : (
                        'Assign'
                      )}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setSuggestOpen(false)}>
                Close
              </Button>
              <Button
                onClick={() => {
                  if (!suggestShift || suggestions.length === 0) return;
                  // Bulk assign all suggested users for this shift
                  const payload = suggestions.map((u) => ({ shift_id: suggestShift.id, user_id: u.id }));
                  bulkAssignMutation.mutate(payload);
                }}
                disabled={suggestions.length === 0 || bulkAssignMutation.isLoading}
              >
                {bulkAssignMutation.isLoading ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2 inline" /> Assigning
                  </>
                ) : (
                  'Assign all'
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk assign dialog */}
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Assign Volunteers</DialogTitle>
          </DialogHeader>
          <div className="p-4 space-y-3">
            <div className="text-sm text-muted-foreground">Selected shifts: {selectedShifts.length}</div>
            <div>
              <label className="text-sm block mb-1">Search volunteer</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    {bulkUser ? `${bulkUser.firstName ?? bulkUser.name} ${bulkUser.lastName ?? ''}` : 'Search users...'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[320px] p-0">
                  <Command>
                    <CommandInput
                      placeholder="Search users..."
                      value={userQuery}
                      onValueChange={(v) => setUserQuery(v)}
                    />
                    <CommandGroup>
                      {possibleUsers.map((u: UserSnippet) => (
                        <CommandItem
                          key={u.id}
                          onSelect={() => {
                            setBulkUser(u);
                            setUserQuery(`${u.firstName ?? u.name} ${u.lastName ?? ''}`);
                          }}
                        >
                          {u.firstName ?? u.name} {u.lastName ?? ''} {u.email ? `(${u.email})` : ''}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setBulkOpen(false)}>
                Cancel
              </Button>
              <Button
                disabled={!bulkUser || bulkAssignMutation.isLoading}
                onClick={() => {
                  if (!bulkUser || selectedShifts.length === 0) return;
                  const payload = selectedShifts.map((shiftId) => ({ shift_id: shiftId, user_id: bulkUser.id }));
                  bulkAssignMutation.mutate(payload);
                }}
              >
                {bulkAssignMutation.isLoading ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2 inline" /> Assigning…
                  </>
                ) : (
                  'Assign to selected shifts'
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Shift Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Shift</DialogTitle>
          </DialogHeader>
          {editShift && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={editShift.title ?? ''}
                  onChange={(e) => setEditShift({ ...editShift, title: e.target.value })}
                  placeholder="Shift Title"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Time</label>
                  <Input
                    type="datetime-local"
                    value={editShift.startAt ? new Date(editShift.startAt).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setEditShift({ ...editShift, startAt: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">End Time</label>
                  <Input
                    type="datetime-local"
                    value={editShift.endAt ? new Date(editShift.endAt).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setEditShift({ ...editShift, endAt: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Capacity</label>
                <Input
                  type="number"
                  value={editShift.capacity ?? 0}
                  onChange={(e) => setEditShift({ ...editShift, capacity: parseInt(e.target.value) })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (editShift) {
                  editMutation.mutate({
                    id: editShift.id,
                    data: {
                      title: editShift.title,
                      start_at: editShift.startAt, // API expects start_at
                      end_at: editShift.endAt,
                      capacity: editShift.capacity
                    }
                  });
                }
              }}
              disabled={editMutation.isLoading}
            >
              {editMutation.isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Scheduled Jobs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Scheduled Jobs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm block mb-1">Name</label>
              <Input value={jobName} onChange={(e) => setJobName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm block mb-1">Run at (ISO)</label>
              <Input
                value={jobRunAt}
                onChange={(e) => setJobRunAt(e.target.value)}
                placeholder="2026-01-06T12:00:00Z"
              />
            </div>
            <div>
              <label className="text-sm block mb-1">Type</label>
              <select
                value={jobType}
                onChange={(e) => setJobType(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="communication">Communication</option>
                <option value="reminder">Reminder</option>
              </select>
            </div>
            <div>
              <label className="text-sm block mb-1">Payload (JSON)</label>
              <Textarea
                value={jobPayload}
                onChange={(e) => setJobPayload(e.target.value)}
                rows={4}
                placeholder='{"message": "example"}'
              />
            </div>
          </div>
          <div className="mb-4">
            <Button
              onClick={() => {
                if (!jobName || !jobRunAt)
                  return toast({ title: 'Name and runAt are required', variant: 'destructive' });
                let parsedPayload = undefined;
                try {
                  parsedPayload = jobPayload ? JSON.parse(jobPayload) : undefined;
                } catch (e) {
                  return toast({ title: 'Payload must be valid JSON', variant: 'destructive' });
                }
                createJobMutation.mutate({
                  name: jobName,
                  type: jobType,
                  runAt: jobRunAt,
                  payload: parsedPayload
                } as any);
              }}
            >
              Create Scheduled Job
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Run At</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Attempts</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobsLoading ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <SkeletonCard />
                  </TableCell>
                </TableRow>
              ) : jobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No scheduled jobs
                  </TableCell>
                </TableRow>
              ) : (
                jobs.map((j: any) => (
                  <TableRow key={j.id}>
                    <TableCell>{j.name}</TableCell>
                    <TableCell>{j.type}</TableCell>
                    <TableCell>{j.runAt ? new Date(j.runAt).toLocaleString() : '—'}</TableCell>
                    <TableCell>{j.status}</TableCell>
                    <TableCell>{j.attempts}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => retryJobMutation.mutate(j.id)}>
                          Retry
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
    </div>
  );
}
