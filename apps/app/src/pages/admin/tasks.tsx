import React, { useState } from 'react';
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
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [assignTask, setAssignTask] = useState<Task | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);

  const { data: tasks, isLoading } = useQuery<Task[]>(['tasks'], () => api.list('tasks'));

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: Partial<Task>) => api.create('tasks', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      toast({ title: 'Task created successfully', variant: 'success' });
      setShowCreateDialog(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Task> }) => api.update('tasks', id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      toast({ title: 'Task updated', variant: 'success' });
    }
  });

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
                  {(allUsers || []).map((u: any) => (
                    <label key={u.id} className="flex items-center gap-2 p-2 border rounded">
                      <input
                        type="checkbox"
                        checked={selectedUserIds.includes(u.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedUserIds((s) => Array.from(new Set([...s, u.id])));
                          else setSelectedUserIds((s) => s.filter((id) => id !== u.id));
                        }}
                      />
                      <div className="text-sm">
                        {u.firstName || u.name} {u.lastName ? u.lastName : ''} {u.email ? `(${u.email})` : ''}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    if (!assignTask) return;
                    // current assignments for this task
                    const taskAssignments = (allAssignments || []).filter(
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
                <Input placeholder="Task Title" />
                <Input placeholder="Description" />
                <div className="grid grid-cols-2 gap-4">
                  <Input type="number" placeholder="Required Volunteers" />
                  <Input type="date" placeholder="Due Date" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button>Create Task</Button>
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
                          <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                        </div>
                        {isOverdue(task.dueDate) && task.status !== 'completed' && (
                          <Badge className="bg-red-500 mt-1">Overdue</Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">No deadline</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(task.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Task
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setAssignTask(task);
                            // compute selected users from assignments
                            const taskAssignments = (allAssignments || []).filter(
                              (a: any) => a.task?.id === task.id || a.task_id === task.id
                            );
                            const ids = taskAssignments.map((a: any) => a.user?.id ?? a.user_id).filter(Boolean);
                            setSelectedUserIds(ids);
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
    </div>
  );
}
