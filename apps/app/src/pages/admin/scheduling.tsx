// src/pages/admin/scheduling.tsx
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Clock, Edit, Trash2, Users, Plus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import SkeletonCard from '@/components/atoms/skeleton-card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/atoms/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';

export default function AdminScheduling() {
  const { data, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => api.listTasks()
  });

  const shiftsRaw = Array.isArray(data) ? data : [];
  // normalize tasks/shifts similar to AdminTasks
  const shifts = shiftsRaw.map((item: any) => ({
    id: item.id,
    title: item.title ?? item.name ?? 'Untitled',
    description: item.description ?? '',
    event: item.event ?? item.event_id ?? (item.event ? item.event : null),
    dueDate: item.start_at ?? item.due_date ?? item.dueDate ?? null,
    assignments: item.assignments ?? []
  }));

  // task management state
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedShift, setSelectedShift] = useState<any | null>(null);

  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newRequiredVolunteers, setNewRequiredVolunteers] = useState<number | ''>('');
  const [newDueDate, setNewDueDate] = useState<string | null>(null);
  const [newEventId, setNewEventId] = useState<number | ''>('');

  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editRequiredVolunteers, setEditRequiredVolunteers] = useState<number | ''>('');
  const [editDueDate, setEditDueDate] = useState<string | null>(null);
  const [editEventId, setEditEventId] = useState<number | ''>('');

  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);

  const { data: events = [] } = useQuery(['events'], () => api.listEvents());
  const { data: allUsers = [] } = useQuery(['users', 'all'], () => api.listUsers(), { staleTime: 60 * 1000 });
  const { data: allAssignments = [] } = useQuery(['assignments'], () => api.listAssignments());

  const createShiftMutation = useMutation({
    mutationFn: (data: any) => api.createTask(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      toast.success('Shift created');
      setShowCreateDialog(false);
    }
  });
  const updateShiftMutation = useMutation({
    mutationFn: ({ id, data }: any) => api.updateTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      toast.success('Shift updated');
    }
  });
  const deleteShiftMutation = useMutation({
    mutationFn: (id: number) => api.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      toast.success('Shift deleted');
    }
  });

  const createAssignmentMutation = useMutation({
    mutationFn: (data: any) => api.createAssignment(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      queryClient.invalidateQueries(['assignments']);
      toast.success('Assignments updated');
    }
  });
  const deleteAssignmentMutation = useMutation({
    mutationFn: (id: number) => api.deleteAssignment(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      queryClient.invalidateQueries(['assignments']);
    }
  });

  useEffect(() => {
    if (selectedShift) {
      setEditTitle(selectedShift.title || '');
      setEditDescription(selectedShift.description || '');
      setEditDueDate(selectedShift.dueDate ?? null);
      setEditEventId(selectedShift.event?.id ?? '');
      setEditRequiredVolunteers(selectedShift.requiredVolunteers ?? '');
      // prepare selected users for assignment dialog
      const taskAssignments = (allAssignments as any[]).filter(
        (a: any) => a.task?.id === selectedShift.id || a.task_id === selectedShift.id
      );
      const ids = taskAssignments.map((a: any) => a.user?.id ?? a.user_id).filter(Boolean);
      setSelectedUserIds(ids);
    }
  }, [selectedShift, allAssignments]);

  // scheduled jobs
  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ['scheduledJobs'],
    queryFn: () => api.listScheduledJobs()
  });
  const jobs = Array.isArray(jobsData) ? jobsData : [];

  const [name, setName] = useState('');
  const [type, setType] = useState('communication');
  const [runAt, setRunAt] = useState('');
  const [payload, setPayload] = useState('');

  const createMutation = useMutation({
    mutationFn: api.createScheduledJob,
    onSuccess: () => {
      queryClient.invalidateQueries(['scheduledJobs']);
      toast.success('Scheduled job created');
      setName('');
      setRunAt('');
      setPayload('');
    },
    onError: (err: any) => {
      console.error('createScheduledJob error', err?.response?.data ?? err);
      toast.error('Failed to create scheduled job');
    }
  });
  const retryMutation = useMutation({
    mutationFn: (id: number) => api.retryScheduledJob(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['scheduledJobs']);
      toast.success('Retry scheduled');
    },
    onError: () => toast.error('Retry failed')
  });

  const onCreate = () => {
    if (!name || !runAt) return toast.error('Name and runAt are required');
    let parsedPayload = undefined;
    try {
      parsedPayload = payload ? JSON.parse(payload) : undefined;
    } catch (e) {
      return toast.error('Payload must be valid JSON');
    }
    createMutation.mutate({ name, type, runAt, payload: parsedPayload } as any);
  };

  return (
    <div className="space-y-6" aria-busy={isLoading}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Shift Scheduling
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 text-sm text-muted-foreground">Manage volunteer shifts and task assignments</div>
          <div className="flex items-center justify-between mb-4">
            <div />
            <div>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2 inline" /> Create Shift
              </Button>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Volunteers</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <SkeletonCard />
                  </TableCell>
                </TableRow>
              ) : shifts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No shifts scheduled
                  </TableCell>
                </TableRow>
              ) : (
                shifts.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div className="font-medium">{s.title}</div>
                      <div className="text-sm text-muted-foreground line-clamp-1">{s.description}</div>
                    </TableCell>
                    <TableCell>{s.event?.title || 'N/A'}</TableCell>
                    <TableCell>{s.dueDate ? new Date(s.dueDate).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>
                      {s.dueDate
                        ? new Date(s.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '-'}
                    </TableCell>
                    <TableCell>{s.assignments?.length || 0}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setSelectedShift(s);
                            setShowAssignDialog(true);
                          }}
                        >
                          <Users className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setSelectedShift(s);
                            setShowEditDialog(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            if (confirm('Delete this shift?')) deleteShiftMutation.mutate(s.id);
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
        </CardContent>
      </Card>

      {/* Create Shift Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Shift</DialogTitle>
            <DialogDescription>Create a new volunteer shift (task)</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 p-4">
            <Input placeholder="Title" value={newTitle} onChange={(e: any) => setNewTitle(e.target.value)} />
            <Input
              placeholder="Description"
              value={newDescription}
              onChange={(e: any) => setNewDescription(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input type="date" value={newDueDate ?? ''} onChange={(e: any) => setNewDueDate(e.target.value)} />
              <Input
                type="number"
                placeholder="Required Volunteers"
                value={newRequiredVolunteers as any}
                onChange={(e: any) => setNewRequiredVolunteers(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>
            <div>
              <label className="text-sm block mb-1">Event</label>
              <select
                value={newEventId}
                onChange={(e: any) => setNewEventId(e.target.value === '' ? '' : Number(e.target.value))}
                className="p-2 border rounded w-full"
              >
                <option value="">Select event</option>
                {(events || []).map((ev: any) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                createShiftMutation.mutate({
                  title: newTitle,
                  description: newDescription,
                  slot_count: typeof newRequiredVolunteers === 'number' ? newRequiredVolunteers : 0,
                  start_at: newDueDate || null,
                  event_id: newEventId || undefined
                });
              }}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Shift Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Shift</DialogTitle>
            <DialogDescription>Edit shift details</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 p-4">
            <Input placeholder="Title" value={editTitle} onChange={(e: any) => setEditTitle(e.target.value)} />
            <Input
              placeholder="Description"
              value={editDescription}
              onChange={(e: any) => setEditDescription(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input type="date" value={editDueDate ?? ''} onChange={(e: any) => setEditDueDate(e.target.value)} />
              <Input
                type="number"
                placeholder="Required Volunteers"
                value={typeof editRequiredVolunteers === 'number' ? editRequiredVolunteers : ''}
                onChange={(e: any) => setEditRequiredVolunteers(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>
            <div>
              <label className="text-sm block mb-1">Event</label>
              <select
                value={editEventId}
                onChange={(e: any) => setEditEventId(e.target.value === '' ? '' : Number(e.target.value))}
                className="p-2 border rounded w-full"
              >
                <option value="">Select event</option>
                {(events || []).map((ev: any) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!selectedShift) return;
                updateShiftMutation.mutate({
                  id: selectedShift.id,
                  data: {
                    title: editTitle,
                    description: editDescription,
                    slot_count: typeof editRequiredVolunteers === 'number' ? editRequiredVolunteers : 0,
                    start_at: editDueDate || null,
                    event_id: editEventId || undefined
                  }
                });
                setShowEditDialog(false);
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Volunteers</DialogTitle>
            <DialogDescription>Assign volunteers to shift: {selectedShift?.title}</DialogDescription>
          </DialogHeader>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-auto">
              {(Array.isArray(allUsers) ? allUsers : []).map((u: any) => {
                const id = u?.id ?? u?.user_id ?? (typeof u === 'number' ? u : undefined);
                const display = u?.firstName ?? u?.first_name ?? u?.name ?? u?.email ?? `User ${id}`;
                const checked = Boolean(id ? selectedUserIds.includes(id) : selectedUserIds.includes(u));
                return (
                  <label key={String(id)} className="flex items-center gap-2 p-2 border rounded">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const thisId = id ?? u?.id ?? u;
                        if (e.target.checked)
                          setSelectedUserIds((s) => Array.from(new Set([...s, thisId])) as number[]);
                        else setSelectedUserIds((s) => s.filter((i) => i !== thisId));
                      }}
                    />
                    <div className="text-sm">{display}</div>
                  </label>
                );
              })}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!selectedShift) return;
                const taskAssignments = (allAssignments as any[]).filter(
                  (a: any) => a.task?.id === selectedShift.id || a.task_id === selectedShift.id
                );
                const currentUserIds = taskAssignments.map((a: any) => a.user?.id ?? a.user_id).filter(Boolean);
                const assignmentsByUser: Record<number, any> = {};
                taskAssignments.forEach((a: any) => {
                  const uid = a.user?.id ?? a.user_id;
                  if (uid) assignmentsByUser[uid] = a;
                });
                const toCreate = selectedUserIds.filter((id) => !currentUserIds.includes(id));
                const toDelete = currentUserIds.filter((id) => !selectedUserIds.includes(id));
                try {
                  await Promise.all([
                    ...toCreate.map((uid) =>
                      createAssignmentMutation.mutateAsync({ task_id: selectedShift.id, user_id: uid })
                    ),
                    ...toDelete.map((uid) => deleteAssignmentMutation.mutateAsync(assignmentsByUser[uid].id))
                  ]);
                  toast.success('Assignments updated');
                } catch (err) {
                  toast.error('Failed to update assignments');
                }
                setShowAssignDialog(false);
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Scheduled Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm block mb-1">Name</label>
              <Input value={name} onChange={(e: any) => setName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm block mb-1">Run at (ISO)</label>
              <Input value={runAt} onChange={(e: any) => setRunAt(e.target.value)} placeholder="2025-11-24T12:00:00Z" />
            </div>
            <div>
              <label className="text-sm block mb-1">Type</label>
              <select value={type} onChange={(e: any) => setType(e.target.value)} className="w-full">
                <option value="communication">Communication</option>
                <option value="reminder">Reminder</option>
              </select>
            </div>
            <div>
              <label className="text-sm block mb-1">Payload (JSON)</label>
              <Textarea value={payload} onChange={(e: any) => setPayload(e.target.value)} rows={4} />
            </div>
          </div>
          <div className="mb-4">
            <Button onClick={onCreate}>Create Scheduled Job</Button>
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
                    <TableCell>{j.runAt ? new Date(j.runAt).toLocaleString() : '-'}</TableCell>
                    <TableCell>{j.status}</TableCell>
                    <TableCell>{j.attempts}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => retryMutation.mutate(j.id)}>
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
