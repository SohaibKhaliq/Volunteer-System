import { useState, useEffect, useMemo, startTransition } from 'react';
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
  // AI Match state
  const [showAiMatchesDialog, setShowAiMatchesDialog] = useState(false);
  const [aiMatches, setAiMatches] = useState<any[]>([]);
  const navigate = useNavigate();
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStartAt, setEditStartAt] = useState<string | null>(null);
  const [editEndAt, setEditEndAt] = useState<string | null>(null);
  const [editLocation, setEditLocation] = useState('');
  const [editLatitude, setEditLatitude] = useState<number | ''>('');
  const [editLongitude, setEditLongitude] = useState<number | ''>('');
  const [editRequiredVolunteers, setEditRequiredVolunteers] = useState<number | ''>('');
  const [editStatus, setEditStatus] = useState<'draft' | 'published'>('draft');
  const [editIsRecurring, setEditIsRecurring] = useState<boolean>(false);
  const [editOrganizationId, setEditOrganizationId] = useState<number | ''>('');
  // Create form state
  const [createTitle, setCreateTitle] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createStartAt, setCreateStartAt] = useState<string | null>(null);
  const [createEndAt, setCreateEndAt] = useState<string | null>(null);
  const [createLocation, setCreateLocation] = useState('');
  const [createLatitude, setCreateLatitude] = useState<number | ''>('');
  const [createLongitude, setCreateLongitude] = useState<number | ''>('');
  const [createCapacity, setCreateCapacity] = useState<number | ''>('');
  const [createOrganizationId, setCreateOrganizationId] = useState<number | ''>('');

  useEffect(() => {
    if (editEvent) {
      setEditTitle(editEvent.title || '');
      setEditDescription(editEvent.description || '');
      setEditStartAt(editEvent.startAt || null);
      setEditEndAt(editEvent.endAt || null);
      setEditLocation(editEvent.location || '');
      setEditLatitude((editEvent as any).latitude ?? '');
      setEditLongitude((editEvent as any).longitude ?? '');
      setEditRequiredVolunteers(editEvent.requiredVolunteers || 0);
      setEditStatus(
        (editEvent.status === 'published' || (editEvent as any).isPublished || (editEvent as any).is_published
          ? 'published'
          : 'draft') as 'draft' | 'published'
      );
      setEditIsRecurring(Boolean(editEvent.isRecurring));
      setEditOrganizationId((editEvent as any).organizationId ?? '');
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
        // derive status from publish flag if server doesn't provide a status string
        status: e.status ?? ((e.is_published ?? e.isPublished) ? 'published' : 'draft'),
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
      // reset create form
      setCreateTitle('');
      setCreateDescription('');
      setCreateStartAt(null);
      setCreateEndAt(null);
      setCreateLocation('');
      setCreateCapacity('');
      setCreateOrganizationId('');
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
    onSuccess: (data: any) => {
      queryClient.invalidateQueries(['events']);
      // data.data.matches contains the array
      const matches = data?.data?.matches || data?.matches || [];
      setAiMatches(matches);
      setShowAiMatchesDialog(true);
      toast({ title: 'AI matching completed', variant: 'success' });
    }
  });

  // Fetch organizations to resolve names when events only contain organizationId
  const { data: orgs = [] } = useQuery<any[]>(['organizations'], api.listOrganizations, {
    select: (data: any) => {
      if (!data) return [] as any[];
      const list: any[] = Array.isArray(data) ? data : data.data || [];
      return list.map((o) => ({
        id: o.id,
        name: o.name ?? o.title ?? o.organization_name ?? ''
      }));
    }
  });

  const orgMap = useMemo(() => {
    const m: Record<number, string> = {};
    (orgs || []).forEach((o: any) => {
      if (o && o.id) m[o.id] = o.name;
    });
    return m;
  }, [orgs]);

  const getOrgName = (e: any) =>
    e?.organizationName ||
    e?.organization?.name ||
    orgMap[e?.organizationId || e?.organization_id] ||
    orgMap[e?.organizationId ?? e?.organization_id] ||
    '';

  // Compute event counts on the client using start/end times (no API calls)
  const eventCounts = useMemo(() => {
    const total = events?.length || 0;
    const now = new Date().getTime();
    let upcoming = 0;
    let ongoing = 0;
    let completed = 0;

    (events || []).forEach((e) => {
      const s = e.startAt ? new Date(e.startAt).getTime() : null;
      const en = e.endAt ? new Date(e.endAt).getTime() : null;

      if (s !== null && en !== null) {
        if (en < now) {
          completed += 1;
        } else if (s <= now && now <= en) {
          ongoing += 1;
        } else if (s > now) {
          upcoming += 1;
        }
      } else if (s !== null && en === null) {
        // Has start but no end: if start in future -> upcoming, else ongoing
        if (s > now) upcoming += 1;
        else ongoing += 1;
      } else if (s === null && en !== null) {
        // Has end but no start: if end in past -> completed, else ongoing
        if (en < now) completed += 1;
        else ongoing += 1;
      } else {
        // No dates: count as upcoming by default
        upcoming += 1;
      }
    });

    return { total, upcoming, ongoing, completed };
  }, [events]);

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

  const toSQLDatetime = (input?: string | null) => {
    if (!input) return null;
    const d = new Date(input);
    if (Number.isNaN(d.getTime())) return null;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

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
                <Input value={createTitle} onChange={(e) => setCreateTitle(e.target.value)} placeholder="Event Title" />
                <Input
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  placeholder="Description"
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="datetime-local"
                    value={createStartAt ?? ''}
                    onChange={(e) => setCreateStartAt(e.target.value)}
                    placeholder="Start Date & Time"
                  />
                  <Input
                    type="datetime-local"
                    value={createEndAt ?? ''}
                    onChange={(e) => setCreateEndAt(e.target.value)}
                    placeholder="End Date & Time"
                  />
                </div>
                <Input
                  value={createLocation}
                  onChange={(e) => setCreateLocation(e.target.value)}
                  placeholder="Location"
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="number"
                    step="0.000001"
                    value={createLatitude === '' ? '' : String(createLatitude)}
                    onChange={(e) => setCreateLatitude(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Latitude (optional)"
                  />
                  <Input
                    type="number"
                    step="0.000001"
                    value={createLongitude === '' ? '' : String(createLongitude)}
                    onChange={(e) => setCreateLongitude(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Longitude (optional)"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="number"
                    value={typeof createCapacity === 'number' ? createCapacity : ''}
                    onChange={(e) => setCreateCapacity(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Capacity"
                  />
                  <select
                    value={createOrganizationId}
                    onChange={(e) => setCreateOrganizationId(e.target.value === '' ? '' : Number(e.target.value))}
                    className="p-2 border rounded"
                  >
                    <option value="">No organization</option>
                    {(orgs || []).map((o: any) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input id="create-recurring" type="checkbox" checked={false} onChange={() => { }} />
                  <label htmlFor="create-recurring" className="text-sm">
                    Recurring Event
                  </label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    const payload: any = {
                      title: createTitle,
                      description: createDescription,
                      start_at: toSQLDatetime(createStartAt),
                      end_at: toSQLDatetime(createEndAt),
                      location: createLocation,
                      capacity: createCapacity || 0
                    };
                    if (typeof createLatitude === 'number') payload.latitude = createLatitude;
                    if (typeof createLongitude === 'number') payload.longitude = createLongitude;
                    if (createOrganizationId) payload.organization_id = createOrganizationId;
                    createMutation.mutate(payload);
                  }}
                >
                  Create Event
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center bg-white p-4 rounded-lg shadow-sm">
        <div className="flex-1">
          <label className="text-sm block mb-1">Contact Person (optional)</label>
          <div className="flex gap-2 items-start">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-48 justify-start">
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
                    onValueChange={(v) => startTransition(() => setContactQuery(v))}
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

            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
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
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Stats Cards (computed client-side from event start/end times) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="text-sm font-medium text-muted-foreground">Total Events</div>
          <div className="text-2xl font-bold">{eventCounts.total}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="text-sm font-medium text-muted-foreground">Upcoming</div>
          <div className="text-2xl font-bold text-blue-600">{eventCounts.upcoming}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="text-sm font-medium text-muted-foreground">Ongoing</div>
          <div className="text-2xl font-bold text-green-600">{eventCounts.ongoing}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="text-sm font-medium text-muted-foreground">Completed</div>
          <div className="text-2xl font-bold text-purple-600">{eventCounts.completed}</div>
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
                        <div className="text-sm text-muted-foreground mt-1">{getOrgName(event) || ''}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{getOrgName(event) || 'N/A'}</TableCell>
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
                              // Open the public-facing event detail page so admins can view the full detail view
                              navigate(`/events/${event.id}`);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Open Public Page
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedEvent(event);
                              setShowDetailsDialog(true);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Quick Details (Dialog)
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
                              navigate(`/admin/tasks?eventId=${event.id}`);
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
                          {['draft', 'published'].map((s) => (
                            <DropdownMenuItem
                              key={s}
                              onClick={() => {
                                if (s === 'published') {
                                  updateMutation.mutate({ id: event.id, data: { is_published: true } as any });
                                } else {
                                  updateMutation.mutate({ id: event.id, data: { is_published: false } as any });
                                }
                              }}
                            >
                              {s.charAt(0).toUpperCase() + s.slice(1)}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() =>
                              updateMutation.mutate({ id: event.id, data: { isRecurring: !event.isRecurring } })
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
                <div className="mt-1 text-sm">{getOrgName(selectedEvent) || 'N/A'}</div>
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

      {/* AI Matches Dialog */}
      <Dialog open={showAiMatchesDialog} onOpenChange={setShowAiMatchesDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>AI Volunteer Recommendations</DialogTitle>
            <DialogDescription>
              Based on skills, availability, and past activity.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
            {aiMatches.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No matching volunteers found for this event.
              </div>
            ) : (
              aiMatches.map((match: any, i: number) => (
                <div key={i} className="flex items-start justify-between p-4 border rounded-lg bg-gray-50">
                  <div className="space-y-1">
                    <div className="font-medium">{match.user.name}</div>
                    <div className="text-sm text-muted-foreground">{match.user.email}</div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {match.reasons.map((r: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-xs bg-white">
                          {r}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">{match.score}</div>
                    <div className="text-xs text-muted-foreground">Match Score</div>
                  </div>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAiMatchesDialog(false)}>
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
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                step="0.000001"
                value={editLatitude === '' ? '' : String(editLatitude)}
                onChange={(e) => setEditLatitude(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Latitude (optional)"
              />
              <Input
                type="number"
                step="0.000001"
                value={editLongitude === '' ? '' : String(editLongitude)}
                onChange={(e) => setEditLongitude(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Longitude (optional)"
              />
            </div>
            <Input
              type="number"
              value={typeof editRequiredVolunteers === 'number' ? editRequiredVolunteers : ''}
              onChange={(e) => setEditRequiredVolunteers(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="Required Volunteers"
            />
            <div className="grid grid-cols-2 gap-4">
              <select
                value={editOrganizationId}
                onChange={(e) => setEditOrganizationId(e.target.value === '' ? '' : Number(e.target.value))}
                className="p-2 border rounded"
              >
                <option value="">No organization</option>
                {(orgs || []).map((o: any) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
              <div />
            </div>
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
                onChange={(e) => setEditStatus(e.target.value as 'draft' | 'published')}
                className="w-full p-2 border rounded"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
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
                  start_at: toSQLDatetime(editStartAt),
                  end_at: toSQLDatetime(editEndAt),
                  location: editLocation,
                  latitude: typeof editLatitude === 'number' ? editLatitude : undefined,
                  longitude: typeof editLongitude === 'number' ? editLongitude : undefined,
                  capacity: typeof editRequiredVolunteers === 'number' ? editRequiredVolunteers : 0,
                  is_published: editStatus === 'published'
                };
                // include organization_id if selected
                if (editOrganizationId) payload.organization_id = editOrganizationId;
                else if ((editEvent as any).organizationId) payload.organization_id = (editEvent as any).organizationId;
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
