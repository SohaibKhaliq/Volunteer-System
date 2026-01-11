import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Plus, MoreVertical, Edit, Trash2, Users, Calendar, RefreshCw } from 'lucide-react';
import { useApp } from '@/providers/app-provider';

interface EventItem {
  id: number;
  title: string;
}

interface ShiftItem {
  id: number;
  title?: string;
  start_at?: string;
  startAt?: string;
  end_at?: string;
  endAt?: string;
  capacity?: number;
  event?: { id?: number; title?: string; name?: string } | null;
  assignments?: any[];
}

function formatDateTime(value?: string): string {
  if (!value) return '';
  const ts = Date.parse(String(value));
  if (Number.isNaN(ts)) return String(value);
  return new Date(ts).toLocaleString();
}

export default function OrganizationShifts() {
  const { selectedOrganization } = useApp();
  const queryClient = useQueryClient();
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [recurringDialogOpen, setRecurringDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<ShiftItem | null>(null);

  const { data: eventsRaw } = useQuery({
    queryKey: ['organizationEvents'],
    queryFn: () => api.listOrganizationEvents()
  });

  const { data: shiftsRaw, isLoading } = useQuery({
    queryKey: ['organizationShifts', selectedEvent],
    queryFn: async () => {
      const shifts = await api.listShifts({
        scope: 'organization',
        event_id: selectedEvent || undefined
      });
      // Preload assignments for each shift
      const shiftsArray = Array.isArray(shifts) ? shifts : (shifts as any)?.data || [];
      const shiftsWithAssignments = await Promise.all(
        shiftsArray.map(async (shift: any) => {
          try {
            const assignments = await api.listShiftAssignments({ shift_id: shift.id });
            return { ...shift, assignments: Array.isArray(assignments) ? assignments : (assignments as any)?.data || [] };
          } catch {
            return { ...shift, assignments: [] };
          }
        })
      );
      return shiftsWithAssignments;
    }
  });

  const { data: volunteersRaw } = useQuery({
    queryKey: ['organizationVolunteers', selectedOrganization?.id],
    queryFn: () => api.listOrganizationVolunteers({ organizationId: selectedOrganization?.id }),
    enabled: !!selectedOrganization?.id
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteShift(id),
    onSuccess: () => {
      toast.success('Shift deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['organizationShifts'] });
      setDeleteDialogOpen(false);
    },
    onError: () => toast.error('Failed to delete shift')
  });

  const events: EventItem[] = (Array.isArray(eventsRaw) ? eventsRaw : (eventsRaw as any)?.data || []) as any;
  const shifts: ShiftItem[] = (Array.isArray(shiftsRaw) ? shiftsRaw : (shiftsRaw as any)?.data || []) as any;
  const volunteers = (Array.isArray(volunteersRaw) ? volunteersRaw : (volunteersRaw as any)?.data || []) as any;

  const handleEdit = (shift: ShiftItem) => {
    setSelectedShift(shift);
    setEditDialogOpen(true);
  };

  const handleDelete = (shift: ShiftItem) => {
    setSelectedShift(shift);
    setDeleteDialogOpen(true);
  };

  const handleAssign = (shift: ShiftItem) => {
    setSelectedShift(shift);
    setAssignDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Shifts</h2>
          <p className="text-muted-foreground">Manage scheduled shifts for your events</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setRecurringDialogOpen(true)} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Create Recurring
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Shift
          </Button>
        </div>
      </div>

      <div className="flex gap-4">
        <Select value={selectedEvent} onValueChange={setSelectedEvent}>
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Filter by event" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Events</SelectItem>
            {events
              .filter((ev) => ev?.id)
              .map((ev) => (
                <SelectItem key={ev.id} value={ev.id.toString()}>
                  {ev.title}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Shifts ({shifts.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Assigned</TableHead>
                <TableHead className="w-[70px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shifts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No shifts found
                  </TableCell>
                </TableRow>
              ) : (
                shifts.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.title || `Shift #${s.id}`}</TableCell>
                    <TableCell>{s.event?.title ?? s.event?.name ?? '—'}</TableCell>
                    <TableCell>{formatDateTime(s.start_at ?? s.startAt)}</TableCell>
                    <TableCell>{formatDateTime(s.end_at ?? s.endAt)}</TableCell>
                    <TableCell>{s.capacity ?? 0}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {s.assignments?.length || 0} / {s.capacity || 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleAssign(s)}>
                            <Users className="h-4 w-4 mr-2" />
                            Assign Volunteers
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(s)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(s)} className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CreateShiftDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        events={events}
        organizationId={selectedOrganization?.id}
      />

      <RecurringShiftDialog
        open={recurringDialogOpen}
        onOpenChange={setRecurringDialogOpen}
        events={events}
        organizationId={selectedOrganization?.id}
      />

      <EditShiftDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        shift={selectedShift}
        events={events}
      />

      <AssignVolunteersDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        shift={selectedShift}
        volunteers={volunteers}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Shift</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedShift?.title || `Shift #${selectedShift?.id}`}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedShift && deleteMutation.mutate(selectedShift.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Create Shift Dialog Component
function CreateShiftDialog({ open, onOpenChange, events, organizationId }: any) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_id: '',
    start_at: '',
    end_at: '',
    capacity: ''
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.createShift(data),
    onSuccess: () => {
      toast.success('Shift created successfully');
      queryClient.invalidateQueries({ queryKey: ['organizationShifts'] });
      onOpenChange(false);
      setFormData({ title: '', description: '', event_id: '', start_at: '', end_at: '', capacity: '' });
    },
    onError: () => toast.error('Failed to create shift')
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      event_id: Number(formData.event_id),
      capacity: Number(formData.capacity),
      organization_id: organizationId
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Shift</DialogTitle>
          <DialogDescription>Add a new shift to your schedule</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event">Event *</Label>
              <Select value={formData.event_id} onValueChange={(v) => setFormData({ ...formData, event_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select event" />
                </SelectTrigger>
                <SelectContent>
                  {events.map((e: any) => (
                    <SelectItem key={e.id} value={e.id.toString()}>
                      {e.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start">Start Date & Time *</Label>
              <Input
                id="start"
                type="datetime-local"
                value={formData.start_at}
                onChange={(e) => setFormData({ ...formData, start_at: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end">End Date & Time *</Label>
              <Input
                id="end"
                type="datetime-local"
                value={formData.end_at}
                onChange={(e) => setFormData({ ...formData, end_at: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="capacity">Capacity *</Label>
            <Input
              id="capacity"
              type="number"
              min="1"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Shift
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Recurring Shift Dialog Component
function RecurringShiftDialog({ open, onOpenChange, events, organizationId }: any) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventId: '',
    startAt: '',
    endAt: '',
    capacity: '',
    recurrenceRule: 'daily',
    endDate: ''
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.createRecurringShift(data),
    onSuccess: (data: any) => {
      toast.success(`Created ${data.count || 0} recurring shifts`);
      queryClient.invalidateQueries({ queryKey: ['organizationShifts'] });
      onOpenChange(false);
      setFormData({
        title: '',
        description: '',
        eventId: '',
        startAt: '',
        endAt: '',
        capacity: '',
        recurrenceRule: 'daily',
        endDate: ''
      });
    },
    onError: () => toast.error('Failed to create recurring shifts')
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      eventId: Number(formData.eventId),
      capacity: Number(formData.capacity),
      organizationId
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Recurring Shifts</DialogTitle>
          <DialogDescription>Create multiple shifts based on a recurring pattern</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="r-title">Title *</Label>
              <Input
                id="r-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="r-event">Event *</Label>
              <Select value={formData.eventId} onValueChange={(v) => setFormData({ ...formData, eventId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select event" />
                </SelectTrigger>
                <SelectContent>
                  {events.map((e: any) => (
                    <SelectItem key={e.id} value={e.id.toString()}>
                      {e.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="r-description">Description</Label>
            <Textarea
              id="r-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="r-start">Start Time *</Label>
              <Input
                id="r-start"
                type="datetime-local"
                value={formData.startAt}
                onChange={(e) => setFormData({ ...formData, startAt: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="r-end">End Time *</Label>
              <Input
                id="r-end"
                type="datetime-local"
                value={formData.endAt}
                onChange={(e) => setFormData({ ...formData, endAt: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="r-capacity">Capacity *</Label>
              <Input
                id="r-capacity"
                type="number"
                min="1"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="r-pattern">Recurrence Pattern *</Label>
              <Select
                value={formData.recurrenceRule}
                onValueChange={(v) => setFormData({ ...formData, recurrenceRule: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Bi-weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="r-enddate">Repeat Until *</Label>
              <Input
                id="r-enddate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Recurring Shifts
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Edit Shift Dialog Component
function EditShiftDialog({ open, onOpenChange, shift, events }: any) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_id: '',
    start_at: '',
    end_at: '',
    capacity: ''
  });

  // Update form when shift changes
  useEffect(() => {
    if (shift) {
      setFormData({
        title: shift.title || '',
        description: shift.description || '',
        event_id: shift.event?.id?.toString() || '',
        start_at: shift.start_at || shift.startAt || '',
        end_at: shift.end_at || shift.endAt || '',
        capacity: shift.capacity?.toString() || ''
      });
    }
  }, [shift]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.updateShift(shift?.id, data),
    onSuccess: () => {
      toast.success('Shift updated successfully');
      queryClient.invalidateQueries({ queryKey: ['organizationShifts'] });
      onOpenChange(false);
    },
    onError: () => toast.error('Failed to update shift')
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      ...formData,
      event_id: Number(formData.event_id),
      capacity: Number(formData.capacity)
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Shift</DialogTitle>
          <DialogDescription>Update shift details</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="e-title">Title *</Label>
              <Input
                id="e-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="e-event">Event *</Label>
              <Select value={formData.event_id} onValueChange={(v) => setFormData({ ...formData, event_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select event" />
                </SelectTrigger>
                <SelectContent>
                  {events.map((e: any) => (
                    <SelectItem key={e.id} value={e.id.toString()}>
                      {e.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="e-description">Description</Label>
            <Textarea
              id="e-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="e-start">Start Date & Time *</Label>
              <Input
                id="e-start"
                type="datetime-local"
                value={formData.start_at}
                onChange={(e) => setFormData({ ...formData, start_at: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="e-end">End Date & Time *</Label>
              <Input
                id="e-end"
                type="datetime-local"
                value={formData.end_at}
                onChange={(e) => setFormData({ ...formData, end_at: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="e-capacity">Capacity *</Label>
            <Input
              id="e-capacity"
              type="number"
              min="1"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update Shift
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Assign Volunteers Dialog Component
function AssignVolunteersDialog({ open, onOpenChange, shift, volunteers }: any) {
  const queryClient = useQueryClient();
  const [selectedVolunteer, setSelectedVolunteer] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  const { data: suggestionsData } = useQuery({
    queryKey: ['shiftSuggestions', shift?.id],
    queryFn: () => api.getShiftSuggestions(shift?.id, 10),
    enabled: !!shift?.id && open
  });

  useEffect(() => {
    if (suggestionsData) {
      setSuggestions((suggestionsData as any)?.suggestions || []);
    }
  }, [suggestionsData]);

  const checkConflictMutation = useMutation({
    mutationFn: ({ shiftId, userId }: any) => api.checkShiftConflicts(shiftId, userId),
    onSuccess: (data: any) => {
      if (data.hasConflict) {
        setConflictWarning(data.message || 'This volunteer has conflicting commitments');
      } else {
        setConflictWarning(null);
      }
    }
  });

  const assignMutation = useMutation({
    mutationFn: ({ shiftId, userId, ignoreConflicts }: any) =>
      api.assignVolunteerToShift(shiftId, userId, ignoreConflicts),
    onSuccess: () => {
      toast.success('Volunteer assigned successfully');
      queryClient.invalidateQueries({ queryKey: ['organizationShifts'] });
      onOpenChange(false);
      setSelectedVolunteer('');
      setConflictWarning(null);
    },
    onError: (error: any) => {
      if (error?.response?.status === 409) {
        setConflictWarning(error.response.data.conflictMessage || 'Conflict detected');
      } else {
        toast.error('Failed to assign volunteer');
      }
    }
  });

  const handleVolunteerSelect = (volunteerId: string) => {
    setSelectedVolunteer(volunteerId);
    if (shift?.id && volunteerId) {
      checkConflictMutation.mutate({ shiftId: shift.id, userId: Number(volunteerId) });
    }
  };

  const handleAssign = (ignoreConflicts = false) => {
    if (shift?.id && selectedVolunteer) {
      assignMutation.mutate({
        shiftId: shift.id,
        userId: Number(selectedVolunteer),
        ignoreConflicts
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Assign Volunteers</DialogTitle>
          <DialogDescription>
            Assign volunteers to "{shift?.title || `Shift #${shift?.id}`}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {suggestions.length > 0 && (
            <div className="space-y-2">
              <Label>Suggested Volunteers (AI-matched)</Label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {suggestions.map((s: any) => (
                  <Button
                    key={s.user.id}
                    variant="outline"
                    size="sm"
                    onClick={() => handleVolunteerSelect(s.user.id.toString())}
                    className="justify-start"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    {s.user.firstName} {s.user.lastName}
                    <Badge variant="secondary" className="ml-auto">
                      Score: {s.score}
                    </Badge>
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="volunteer">Select Volunteer</Label>
            <Select value={selectedVolunteer} onValueChange={handleVolunteerSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a volunteer" />
              </SelectTrigger>
              <SelectContent>
                {volunteers.map((v: any) => (
                  <SelectItem key={v.id} value={v.id.toString()}>
                    {v.firstName || v.first_name} {v.lastName || v.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {conflictWarning && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">⚠️ Conflict Detected</p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">{conflictWarning}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {conflictWarning && (
            <Button variant="destructive" onClick={() => handleAssign(true)} disabled={assignMutation.isPending}>
              {assignMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Assign Anyway
            </Button>
          )}
          <Button onClick={() => handleAssign(false)} disabled={assignMutation.isPending || !selectedVolunteer}>
            {assignMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Assign Volunteer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
