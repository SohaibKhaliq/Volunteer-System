import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  MoreVertical,
  Search,
  Filter,
  Download,
  Plus,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  Users,
  Clock,
  AlertCircle
} from 'lucide-react';
import { toast } from '@/components/atoms/use-toast';

interface Task {
  id: number;
  title: string;
  description: string;
  eventId?: number;
  eventTitle?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedVolunteers: number;
  requiredVolunteers: number;
  dueDate?: string;
  createdAt: string;
}

export default function AdminTasks() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editTaskItem, setEditTaskItem] = useState<Task | null>(null);

  // Create form state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newRequiredVolunteers, setNewRequiredVolunteers] = useState<number | ''>('');
  const [newDueDate, setNewDueDate] = useState<string | null>(null);
  const [newEventId, setNewEventId] = useState<number | ''>('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  // Edit form state
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editRequiredVolunteers, setEditRequiredVolunteers] = useState<number | ''>('');
  const [editDueDate, setEditDueDate] = useState<string | null>(null);
  const [editEventId, setEditEventId] = useState<number | ''>('');
  const [editPriority, setEditPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [assignTask, setAssignTask] = useState<Task | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const { data: tasksRaw, isLoading } = useQuery<any>(['tasks'], () => api.list('tasks'));
  // normalize tasks from API (handle snake_case or camelCase and paginated responses)
  const tasks: Task[] | undefined = React.useMemo(() => {
    const list: any[] = Array.isArray(tasksRaw) ? tasksRaw : (tasksRaw?.data ?? []);
    return list.map((item) => ({
      id: item.id,
      title: item.title ?? item.name ?? 'Untitled',
      description: item.description ?? item.body ?? '',
      eventId: item.event_id ?? item.eventId ?? item.event?.id,
      eventTitle: item.event_title ?? item.eventTitle ?? item.event?.title,
      status: item.status ?? 'pending',
      priority: item.priority ?? 'medium',
      assignedVolunteers:
        item.assigned_volunteers ?? item.assignedVolunteers ?? (item.assignments ? item.assignments.length : 0) ?? 0,
      requiredVolunteers: item.required_volunteers ?? item.requiredVolunteers ?? item.slot_count ?? 0,
      dueDate: item.start_at ?? item.due_date ?? item.dueDate ?? null,
      createdAt: item.created_at ?? item.createdAt ?? null
    }));
  }, [tasksRaw]);
  const { data: events = [] } = useQuery(['events'], () => api.listEvents());

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: Partial<Task>) => api.create('tasks', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      toast({ title: 'Task created successfully', variant: 'success' });
      setShowCreateDialog(false);
      // reset create form
      setNewTitle('');
      setNewDescription('');
      setNewRequiredVolunteers('');
      setNewDueDate(null);
      setNewEventId('');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Task> }) => api.update('tasks', id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      toast({ title: 'Task updated', variant: 'success' });
    }
  });

  useEffect(() => {
    if (editTaskItem) {
      setEditTitle(editTaskItem.title || '');
      setEditDescription(editTaskItem.description || '');
      setEditRequiredVolunteers(editTaskItem.requiredVolunteers || 0);
      setEditDueDate(editTaskItem.dueDate ?? null);
      setEditEventId(editTaskItem.eventId ?? '');
      setEditPriority(editTaskItem.priority ?? 'medium');
    }
  }, [editTaskItem]);

  const deleteMutation = useMutation({
    mutationFn: (taskId: number) => api.delete('tasks', taskId),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      toast({ title: 'Task deleted', variant: 'success' });
    }
  });

  // Assignment flow: list users and assignments, create/delete assignments
  const { data: allUsers = [] } = useQuery(['users', 'all'], () => api.listUsers(), { staleTime: 60 * 1000 });
  const { data: allAssignments = [] } = useQuery(['assignments'], () => api.listAssignments());

  // Normalize API responses which may be AxiosResponse or raw arrays
  const usersList: any[] = Array.isArray(allUsers) ? (allUsers as any) : ((allUsers as any)?.data ?? []);
  const assignmentsList: any[] = Array.isArray(allAssignments)
    ? (allAssignments as any)
    : ((allAssignments as any)?.data ?? []);

  const createAssignmentMutation = useMutation({
    mutationFn: (data: any) => api.createAssignment(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      queryClient.invalidateQueries(['events']);
      queryClient.invalidateQueries(['assignments']);
      toast({ title: 'Assignments updated', variant: 'success' });
    }
  });

  const deleteAssignmentMutation = useMutation({
    mutationFn: (id: number) => api.deleteAssignment(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      queryClient.invalidateQueries(['events']);
      queryClient.invalidateQueries(['assignments']);
    }
  });

  // Filter tasks
  const filteredTasks = tasks?.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; label: string }> = {
      pending: { color: 'bg-yellow-500', label: 'Pending' },
      in_progress: { color: 'bg-blue-500', label: 'In Progress' },
      completed: { color: 'bg-green-500', label: 'Completed' },
      cancelled: { color: 'bg-red-500', label: 'Cancelled' }
    };
    const variant = variants[status] || variants.pending;
    return <Badge className={variant.color}>{variant.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, { color: string; label: string }> = {
      low: { color: 'bg-gray-500', label: 'Low' },
      medium: { color: 'bg-blue-500', label: 'Medium' },
      high: { color: 'bg-orange-500', label: 'High' },
      urgent: { color: 'bg-red-500', label: 'Urgent' }
    };
    const variant = variants[priority] || variants.low;
    return <Badge className={variant.color}>{variant.label}</Badge>;
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const formatDate = (d?: string | null) => {
    if (!d) return '—';
    const dt = new Date(d);
    if (!isNaN(dt.getTime())) return dt.toLocaleDateString();
    // Try a fallback by converting space to T for MySQL DATETIME strings
    try {
      const alt = String(d).trim().replace(' ', 'T');
      const dt2 = new Date(alt);
      if (!isNaN(dt2.getTime())) return dt2.toLocaleDateString();
    } catch (e) {
      // ignore
    }
    return '—';
  };

  // Safely resolve a display string from a value that may be a string, number, or nested object
  const resolveDisplayString = (val: any): string | undefined => {
    if (val === null || val === undefined) return undefined;
    if (typeof val === 'string') return val.trim() || undefined;
    if (typeof val === 'number') return String(val);
    if (typeof val === 'object') {
      // try common name keys
      const keys = ['full_name', 'fullName', 'name', 'displayName', 'firstName', 'first_name'];
      for (const k of keys) {
        if (typeof val[k] === 'string' && val[k].trim()) return val[k].trim();
      }
      // fallback: find first string property value
      for (const k of Object.keys(val)) {
        const v = val[k];
        if (typeof v === 'string' && v.trim()) return v.trim();
      }
      return undefined;
    }
    return undefined;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading tasks...</div>
      </div>
    );
  }

  const pendingCount = tasks?.filter((t) => t.status === 'pending').length || 0;
  const inProgressCount = tasks?.filter((t) => t.status === 'in_progress').length || 0;
  const completedCount = tasks?.filter((t) => t.status === 'completed').length || 0;
  const overdueCount = tasks?.filter((t) => isOverdue(t.dueDate) && t.status !== 'completed').length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Task Management</h2>

          {/* Assign Volunteers Dialog */}
          <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Assign Volunteers</DialogTitle>
                <DialogDescription>Assign volunteers to task: {assignTask ? assignTask.title : ''}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="text-sm text-muted-foreground">Select volunteers to assign</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-auto">
                  {usersList.map((u: any) => {
                    // support multiple shapes: object with camelCase/snake_case, primitive id or string
                    const id = u?.id ?? u?.user_id ?? (typeof u === 'number' ? u : undefined);
                    const rawName = u?.first_name ?? u?.firstName ?? u?.name ?? (typeof u === 'string' ? u : undefined);
                    const fname = resolveDisplayString(rawName);
                    const lname = resolveDisplayString(u?.last_name ?? u?.lastName);
                    const mail = resolveDisplayString(u?.email ?? u?.email_address ?? u?.user_email);
                    const display = fname ?? mail ?? (id ? `User ${id}` : 'Unknown');
                    const checked = Boolean(id ? selectedUserIds.includes(id) : selectedUserIds.includes(u));
                    const uid = id ?? (typeof u === 'string' ? u : String(u?.id ?? ''));
                    return (
                      <label key={String(uid)} className="flex items-center gap-2 p-2 border rounded">
                        <input
                          type="checkbox"
                          aria-label={`assign-${display}`}
                          checked={checked}
                          onChange={(e) => {
                            const thisId = id ?? u?.id ?? u;
                            if (e.target.checked)
                              setSelectedUserIds((s) => Array.from(new Set([...s, thisId])) as number[]);
                            else setSelectedUserIds((s) => s.filter((id) => id !== thisId));
                          }}
                        />
                        <div className="text-sm">
                          {display}
                          {lname ? ` ${lname}` : ''}
                          {mail && fname ? ` (${mail})` : ''}
                        </div>
                      </label>
                    );
                  })}
                </div>
                {usersList.length === 0 && (
                  <div className="text-sm text-muted-foreground">No volunteers available to assign.</div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    if (!assignTask) return;
                    // current assignments for this task
                    const taskAssignments = assignmentsList.filter(
                      (a: any) => a.task?.id === assignTask.id || a.task_id === assignTask.id
                    );
                    const currentUserIds = taskAssignments.map((a: any) => a.user?.id ?? a.user_id).filter(Boolean);
                    const assignmentsByUser: Record<number, any> = {};
                    taskAssignments.forEach((a: any) => {
                      const uid = a.user?.id ?? a.user_id;
                      if (uid) assignmentsByUser[uid] = a;
                    });

                    // create for newly selected
                    const toCreate = selectedUserIds.filter((id) => !currentUserIds.includes(id));
                    // delete for deselected
                    const toDelete = currentUserIds.filter((id) => !selectedUserIds.includes(id));

                    try {
                      await Promise.all([
                        ...toCreate.map((uid) =>
                          createAssignmentMutation.mutateAsync({ task_id: assignTask.id, user_id: uid })
                        ),
                        ...toDelete.map((uid) => deleteAssignmentMutation.mutateAsync(assignmentsByUser[uid].id))
                      ]);
                      toast({ title: 'Assignments updated', variant: 'success' });
                    } catch (err) {
                      toast({ title: 'Failed to update assignments', variant: 'destructive' });
                    }
                    setShowAssignDialog(false);
                  }}
                >
                  Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Task</DialogTitle>
                <DialogDescription>Modify task details</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Input placeholder="Task Title" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                <Input
                  placeholder="Description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="number"
                    placeholder="Required Volunteers"
                    value={typeof editRequiredVolunteers === 'number' ? editRequiredVolunteers : ''}
                    onChange={(e) => setEditRequiredVolunteers(e.target.value === '' ? '' : Number(e.target.value))}
                  />
                  <Input
                    type="date"
                    placeholder="Due Date"
                    value={editDueDate ?? ''}
                    onChange={(e) => setEditDueDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm block mb-1">Event</label>
                  <select
                    value={editEventId}
                    onChange={(e) => setEditEventId(e.target.value === '' ? '' : Number(e.target.value))}
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
                <div>
                  <label className="text-sm block mb-1">Priority</label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as 'low' | 'medium' | 'high' | 'urgent')}
                    className="p-2 border rounded w-full"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (!editTaskItem) return;
                    const payload = {
                      title: editTitle,
                      description: editDescription,
                      slot_count: typeof editRequiredVolunteers === 'number' ? editRequiredVolunteers : 0,
                      start_at: editDueDate || null
                    };
                    if (editEventId) payload.event_id = editEventId;
                    payload.priority = editPriority;
                    updateMutation.mutate({ id: editTaskItem.id, data: payload });
                    setShowEditDialog(false);
                  }}
                >
                  Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <p className="text-muted-foreground"> Assign and track volunteer tasks across events</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
                <DialogDescription>Assign a new task to volunteers</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Input placeholder="Task Title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
                <Input
                  placeholder="Description"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="number"
                    placeholder="Required Volunteers"
                    value={typeof newRequiredVolunteers === 'number' ? newRequiredVolunteers : ''}
                    onChange={(e) => setNewRequiredVolunteers(e.target.value === '' ? '' : Number(e.target.value))}
                  />
                  <Input
                    type="date"
                    placeholder="Due Date"
                    value={newDueDate ?? ''}
                    onChange={(e) => setNewDueDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm block mb-1">Event</label>
                  <select
                    value={newEventId}
                    onChange={(e) => setNewEventId(e.target.value === '' ? '' : Number(e.target.value))}
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
                <div>
                  <label className="text-sm block mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as 'low' | 'medium' | 'high' | 'urgent')}
                    className="p-2 border rounded w-full"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    const payload = {
                      title: newTitle,
                      description: newDescription,
                      slot_count: typeof newRequiredVolunteers === 'number' ? newRequiredVolunteers : 0,
                      start_at: newDueDate || null,
                      priority: newPriority
                    } as const;
                    if (newEventId) (payload as any).event_id = newEventId;
                    createMutation.mutate(payload as any);
                  }}
                >
                  Create Task
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center bg-white p-4 rounded-lg shadow-sm">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Status: {statusFilter}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setStatusFilter('all')}>All</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('pending')}>Pending</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('in_progress')}>In Progress</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('completed')}>Completed</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('cancelled')}>Cancelled</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Priority: {priorityFilter}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setPriorityFilter('all')}>All</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPriorityFilter('urgent')}>Urgent</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPriorityFilter('high')}>High</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPriorityFilter('medium')}>Medium</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPriorityFilter('low')}>Low</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="text-sm font-medium text-muted-foreground">Pending Tasks</div>
          <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="text-sm font-medium text-muted-foreground">In Progress</div>
          <div className="text-2xl font-bold text-blue-600">{inProgressCount}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="text-sm font-medium text-muted-foreground">Completed</div>
          <div className="text-2xl font-bold text-green-600">{completedCount}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-red-500">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <div className="text-sm font-medium">Overdue</div>
          </div>
          <div className="text-2xl font-bold mt-2">{overdueCount}</div>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-white rounded-lg shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Volunteers</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTasks && filteredTasks.length > 0 ? (
              filteredTasks.map((task) => (
                <TableRow
                  key={task.id}
                  className={isOverdue(task.dueDate) && task.status !== 'completed' ? 'bg-red-50' : ''}
                >
                  <TableCell>
                    <div>
                      <div className="font-medium">{task.title}</div>
                      <div className="text-sm text-muted-foreground line-clamp-1">{task.description}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{task.eventTitle || 'N/A'}</TableCell>
                  <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                  <TableCell>{getStatusBadge(task.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {task.assignedVolunteers}/{task.requiredVolunteers}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {task.dueDate ? (
                      <div className="text-sm">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{formatDate(task.dueDate)}</span>
                        </div>
                        {isOverdue(task.dueDate) && task.status !== 'completed' && (
                          <Badge className="bg-red-500 mt-1">Overdue</Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">No deadline</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(task.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedTask(task);
                            setShowDetailsDialog(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setEditTaskItem(task);
                            setShowEditDialog(true);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Task
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setAssignTask(task);
                            // compute selected users from assignments
                            const taskAssignments = assignmentsList.filter(
                              (a: any) => a.task?.id === task.id || a.task_id === task.id
                            );
                            const ids = taskAssignments.map((a: any) => a.user?.id ?? a.user_id).filter(Boolean);
                            setSelectedUserIds(ids);
                            // debug: log users and assignments so we can inspect shapes in the browser console
                            // eslint-disable-next-line no-console
                            console.log('Opening Assign dialog', { task, usersList, taskAssignments });
                            setShowAssignDialog(true);
                          }}
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Assign Volunteers
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {task.status !== 'completed' && (
                          <DropdownMenuItem
                            onClick={() =>
                              updateMutation.mutate({
                                id: task.id,
                                data: { status: 'completed' }
                              })
                            }
                            className="text-green-600"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark Complete
                          </DropdownMenuItem>
                        )}
                        {task.status !== 'cancelled' && (
                          <DropdownMenuItem
                            onClick={() =>
                              updateMutation.mutate({
                                id: task.id,
                                data: { status: 'cancelled' }
                              })
                            }
                            className="text-orange-600"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Cancel Task
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
                              deleteMutation.mutate(task.id);
                            }
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No tasks found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedTask?.title}</DialogTitle>
            <DialogDescription>{selectedTask?.description}</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Event</div>
              <div className="mt-1">{selectedTask?.eventTitle || 'N/A'}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Volunteers</div>
              <div className="mt-1">
                <ul className="list-disc pl-5">
                  {assignmentsList
                    .filter((a: any) => a.task?.id === selectedTask?.id || a.task_id === selectedTask?.id)
                    .map((a: any) => (
                      <li key={a.id}>
                        {a.user?.firstName ?? a.user?.name ?? a.user_email ?? `User ${a.user_id ?? ''}`}
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
