import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/atoms/popover';
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
  Calendar,
  Users,
  MapPin,
  Clock,
  Eye,
  Edit,
  Trash2,
  Repeat,
  Sparkles
} from 'lucide-react';
import { toast } from '@/components/atoms/use-toast';
import { Command, CommandGroup, CommandInput, CommandItem } from '@/components/atoms/command';

interface Event {
  id: number;
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  location?: string;
  status: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';
  isRecurring: boolean;
  requiredVolunteers: number;
  assignedVolunteers: number;
  organizationId?: number;
  organizationName?: string;
  resourcesAllocated?: {
    equipment?: string[];
    supervisors?: number;
  };
}

export default function AdminEvents() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editEvent, setEditEvent] = useState<Event | null>(null);
  const navigate = useNavigate();
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStartAt, setEditStartAt] = useState<string | null>(null);
  const [editEndAt, setEditEndAt] = useState<string | null>(null);
  const [editLocation, setEditLocation] = useState('');
  const [editRequiredVolunteers, setEditRequiredVolunteers] = useState<number | ''>('');
  const [editStatus, setEditStatus] = useState<Event['status']>('draft');
  const [editIsRecurring, setEditIsRecurring] = useState<boolean>(false);

  useEffect(() => {
    if (editEvent) {
      setEditTitle(editEvent.title || '');
      setEditDescription(editEvent.description || '');
      setEditStartAt(editEvent.startAt || null);
      setEditEndAt(editEvent.endAt || null);
      setEditLocation(editEvent.location || '');
      setEditRequiredVolunteers(editEvent.requiredVolunteers || 0);
      setEditStatus(editEvent.status || 'draft');
      setEditIsRecurring(Boolean(editEvent.isRecurring));
    }
  }, [editEvent]);

  const { data: events, isLoading } = useQuery<Event[]>(['events'], api.listEvents, {
    select: (data: any) => {
      if (!data) return [] as Event[];
      const list: any[] = Array.isArray(data) ? data : data.data || [];
      return list.map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description,
        startAt: e.start_at ?? e.startAt ?? null,
        endAt: e.end_at ?? e.endAt ?? null,
        location: e.location ?? null,
        status: e.status ?? 'draft',
        isRecurring: e.is_recurring ?? e.isRecurring ?? false,
        requiredVolunteers: e.required_volunteers ?? e.requiredVolunteers ?? 0,
        assignedVolunteers: e.assigned_volunteers ?? e.assignedVolunteers ?? 0,
        organizationId: e.organization_id ?? e.organizationId ?? undefined,
        organizationName: e.organization_name ?? e.organizationName ?? e.organization?.name ?? undefined,
        resourcesAllocated: e.resources_allocated ?? e.resourcesAllocated ?? undefined
      })) as Event[];
    }
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: Partial<Event>) => api.createEvent(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['events']);
      toast({ title: 'Event created successfully', variant: 'success' });
      setShowCreateDialog(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Event> }) => api.updateEvent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['events']);
      toast({ title: 'Event updated', variant: 'success' });
    }
  });

  const [contactQuery, setContactQuery] = useState('');
  const [debouncedContactQuery, setDebouncedContactQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState<any | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedContactQuery(contactQuery), 300);
    return () => clearTimeout(t);
  }, [contactQuery]);

  const { data: contactResults = [] } = useQuery(['users', debouncedContactQuery], () =>
    api.listUsers(debouncedContactQuery)
  );
  const deleteMutation = useMutation({
    mutationFn: (eventId: number) => api.deleteEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries(['events']);
      toast({ title: 'Event deleted', variant: 'success' });
    }
  });

  const aiMatchMutation = useMutation({
    mutationFn: (eventId: number) => api.aiMatchVolunteers(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries(['events']);
      toast({ title: 'AI matching completed', variant: 'success' });
    }
  });

  // Filter events
  const filteredEvents = events?.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || event.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; label: string }> = {
      draft: { color: 'bg-gray-500', label: 'Draft' },
      published: { color: 'bg-blue-500', label: 'Published' },
      ongoing: { color: 'bg-green-500', label: 'Ongoing' },
      completed: { color: 'bg-purple-500', label: 'Completed' },
      cancelled: { color: 'bg-red-500', label: 'Cancelled' }
    };
    const variant = variants[status] || variants.draft;
    return <Badge className={variant.color}>{variant.label}</Badge>;
  };

  const getVolunteerFillRate = (event: Event) => {
    if (!event.requiredVolunteers) return 0;
    return Math.round((event.assignedVolunteers / event.requiredVolunteers) * 100);
  };

  const formatDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString() : 'TBD');
  const formatTime = (iso?: string | null) => (iso ? new Date(iso).toLocaleTimeString() : 'TBD');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading events...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Event & Task Management</h2>
          <p className="text-muted-foreground">Create, schedule, and manage volunteer events and tasks</p>
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
                Create Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Event</DialogTitle>
                <DialogDescription>Schedule a new volunteer event or recurring task</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Input placeholder="Event Title" />
                <Input placeholder="Description" />
                <div className="grid grid-cols-2 gap-4">
                  <Input type="datetime-local" placeholder="Start Date & Time" />
                  <Input type="datetime-local" placeholder="End Date & Time" />
                </div>
                <Input placeholder="Location" />
                <Input type="number" placeholder="Required Volunteers" />
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="recurring" />
                  <label htmlFor="recurring" className="text-sm">
                    Recurring Event
                  </label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button>Create Event</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center bg-white p-4 rounded-lg shadow-sm">
        <div className="flex-1 relative">
          <div>
            <label className="text-sm block mb-1">Contact Person (optional)</label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    {selectedContact
                      ? `${selectedContact.firstName || selectedContact.name} ${selectedContact.lastName || ''}`
                      : 'Select contact'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput
                      placeholder="Search users..."
                      value={contactQuery}
                      onValueChange={(v) => React.startTransition(() => setContactQuery(v))}
                    />
                    <CommandGroup>
                      {contactResults.map((u: any) => (
                        <CommandItem key={u.id} onSelect={() => setSelectedContact(u)}>
                          {u.firstName || u.name} {u.lastName || ''} {u.email ? `(${u.email})` : ''}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
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
            <DropdownMenuItem onClick={() => setStatusFilter('draft')}>Draft</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('published')}>Published</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('ongoing')}>Ongoing</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('completed')}>Completed</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('cancelled')}>Cancelled</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="text-sm font-medium text-muted-foreground">Total Events</div>
          <div className="text-2xl font-bold">{events?.length || 0}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="text-sm font-medium text-muted-foreground">Upcoming</div>
          <div className="text-2xl font-bold text-blue-600">
            {events?.filter((e) => e.status === 'published').length || 0}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="text-sm font-medium text-muted-foreground">Ongoing</div>
          <div className="text-2xl font-bold text-green-600">
            {events?.filter((e) => e.status === 'ongoing').length || 0}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="text-sm font-medium text-muted-foreground">Completed</div>
          <div className="text-2xl font-bold text-purple-600">
            {events?.filter((e) => e.status === 'completed').length || 0}
          </div>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white rounded-lg shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Volunteers</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEvents && filteredEvents.length > 0 ? (
              filteredEvents.map((event) => {
                const fillRate = getVolunteerFillRate(event);
                return (
                  <TableRow key={event.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{event.title}</div>
                        <div className="text-sm text-muted-foreground line-clamp-1">{event.description}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{event.organizationName || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{formatDate(event.startAt)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>
                          {formatTime(event.startAt)}
                          {event.endAt ? ` — ${formatTime(event.endAt)}` : ''}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="line-clamp-1">{event.location || 'TBD'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {event.assignedVolunteers}/{event.requiredVolunteers}
                        </span>
                        <Badge
                          className={fillRate >= 100 ? 'bg-green-500' : fillRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'}
                        >
                          {fillRate}%
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(event.status)}</TableCell>
                    <TableCell>
                      {event.isRecurring && (
                        <Badge variant="outline" className="gap-1">
                          <Repeat className="h-3 w-3" />
                          Recurring
                        </Badge>
                      )}
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
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedEvent(event);
                              setShowDetailsDialog(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setEditEvent(event);
                              setShowEditDialog(true);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Event
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              navigate(`/admin/assignments?eventId=${event.id}`);
                            }}
                          >
                            <Users className="h-4 w-4 mr-2" />
                            Manage Volunteers
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => aiMatchMutation.mutate(event.id)}
                            className="text-purple-600"
                          >
                            <Sparkles className="h-4 w-4 mr-2" />
                            AI Match Volunteers
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                          {['draft', 'published', 'ongoing', 'completed', 'cancelled'].map((s) => (
                            <DropdownMenuItem
                              key={s}
                              onClick={() => updateMutation.mutate({ id: event.id, data: { status: s } })}
                            >
                              {s.charAt(0).toUpperCase() + s.slice(1)}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() =>
                              updateMutation.mutate({ id: event.id, data: { is_recurring: !event.isRecurring } })
                            }
                          >
                            {event.isRecurring ? 'Set as One-time' : 'Set as Recurring'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              if (
                                confirm('Are you sure you want to delete this event? This action cannot be undone.')
                              ) {
                                deleteMutation.mutate(event.id);
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
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No events found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
            <DialogDescription>{selectedEvent?.description}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Organization</div>
                <div className="mt-1 text-sm">{selectedEvent?.organizationName || 'N/A'}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Type</div>
                <div className="mt-1">{selectedEvent?.isRecurring ? 'Recurring' : 'One-time'}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Date</div>
                <div className="mt-1">{formatDate(selectedEvent?.startAt)}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Time</div>
                <div className="mt-1">
                  {selectedEvent
                    ? `${formatTime(selectedEvent.startAt)}${selectedEvent.endAt ? ` — ${formatTime(selectedEvent.endAt)}` : ''}`
                    : 'TBD'}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Location</div>
                <div className="mt-1">{selectedEvent?.location || 'TBD'}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Volunteers</div>
                <div className="mt-1">
                  {selectedEvent ? `${selectedEvent.assignedVolunteers}/${selectedEvent.requiredVolunteers}` : '0/0'}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Status</div>
                <div className="mt-1">{selectedEvent ? selectedEvent.status : 'N/A'}</div>
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

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription>Modify event details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Event Title" />
            <Input
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Description"
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="datetime-local"
                value={editStartAt ?? ''}
                onChange={(e) => setEditStartAt(e.target.value)}
                placeholder="Start Date & Time"
              />
              <Input
                type="datetime-local"
                value={editEndAt ?? ''}
                onChange={(e) => setEditEndAt(e.target.value)}
                placeholder="End Date & Time"
              />
            </div>
            <Input value={editLocation} onChange={(e) => setEditLocation(e.target.value)} placeholder="Location" />
            <Input
              type="number"
              value={typeof editRequiredVolunteers === 'number' ? editRequiredVolunteers : ''}
              onChange={(e) => setEditRequiredVolunteers(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="Required Volunteers"
            />
            <div className="flex items-center gap-2">
              <input
                id="edit-recurring"
                type="checkbox"
                checked={editIsRecurring}
                onChange={(e) => setEditIsRecurring(e.target.checked)}
              />
              <label htmlFor="edit-recurring" className="text-sm">
                Recurring Event
              </label>
            </div>
            <div>
              <label className="text-sm block mb-1">Status</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as Event['status'])}
                className="w-full p-2 border rounded"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!editEvent) return;
                const payload: any = {
                  title: editTitle,
                  description: editDescription,
                  start_at: editStartAt,
                  end_at: editEndAt,
                  location: editLocation,
                  required_volunteers: editRequiredVolunteers || 0,
                  status: editStatus,
                  is_recurring: editIsRecurring
                };
                updateMutation.mutate({ id: editEvent.id, data: payload });
                setShowEditDialog(false);
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
