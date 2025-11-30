import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Calendar, MapPin, Clock, Share2, Flag, Mail, Phone, CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axios } from '@/lib/axios';
import api from '@/lib/api';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/atoms/use-toast';
import { useStore } from '@/lib/store';

// Fix for default marker icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const Detail = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, token } = useStore((state) => ({ user: state.user, token: state.token }));

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: async () => {
      const res = await axios.get(`/events/${id}`);
      return res as any;
    },
    enabled: !!id
  });

  // Assigned resources for this event
  const { data: eventAssignments } = useQuery({
    queryKey: ['event-assignments', id],
    queryFn: async () => {
      if (!id) return [] as any;
      const res = await axios.get(`/assignments?event_id=${id}`);
      return res as any;
    },
    enabled: !!id
  });

  const [assignOpen, setAssignOpen] = useState(false);
  const { data: orgResources } = useQuery({
    queryKey: ['org-resources-for-assign'],
    queryFn: () => api.listMyOrganizationResources(),
    enabled: assignOpen
  });

  // Shifts for this event
  const { data: eventShifts } = useQuery({
    queryKey: ['event-shifts', id],
    queryFn: () => (id ? api.listShifts({ event_id: Number(id) }) : Promise.resolve([])),
    enabled: !!id
  });

  const [assignVolunteerOpen, setAssignVolunteerOpen] = useState(false);
  const [selectedShiftId, setSelectedShiftId] = useState<number | null>(null);

  const assignVolunteerMutation = useMutation({
    mutationFn: (data: any) => api.assignToShift(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-shifts', id] });
      queryClient.invalidateQueries({ queryKey: ['event-assignments', id] });
      setAssignVolunteerOpen(false);
    }
  });

  const assignMutation = useMutation({
    mutationFn: ({ resourceId, qty }: any) =>
      api.assignResource(resourceId, { assignmentType: 'event', relatedId: Number(id), quantity: qty || 1 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-assignments', id] });
      queryClient.invalidateQueries({ queryKey: ['org-resources-for-assign'] });
      setAssignOpen(false);
    }
  });

  const joinMutation = useMutation({
    mutationFn: () => axios.post(`/events/${id}/join`),
    onSuccess: () => {
      toast({
        title: t('Success!'),
        description: t('You have successfully joined this event')
      });
      queryClient.invalidateQueries({ queryKey: ['event', id] });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || t('Failed to join event');
      toast({
        title: t('Error'),
        description: message,
        variant: 'destructive'
      });
    }
  });

  const handleJoinEvent = () => {
    // Ensure a stored auth token exists before attempting to join. We should
    // allow joining if a token exists even if the user's profile has not
    // finished loading into `user` yet (avoids redirecting logged-in users
    // to login while their profile is still being fetched).
    if (!token) {
      toast({
        title: t('Login Required'),
        description: t('Please log in to join this event'),
        variant: 'destructive'
      });
      // Preserve current URL for redirect after login
      const returnTo = encodeURIComponent(window.location.pathname + window.location.search + window.location.hash);
      navigate(`/login?returnTo=${returnTo}`);
      return;
    }
    // user and token present — execute join request
    joinMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">{t('Event not found')}</h1>
        <Button onClick={() => navigate(-1)}>{t('Go Back')}</Button>
      </div>
    );
  }

  // Quick assign dialog content
  const AssignDialog = () => (
    <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Resource to Event</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <div className="space-y-4">
            <div>
              <Input placeholder="Search resources..." />
            </div>
            <div className="space-y-2 max-h-64 overflow-auto">
              {(Array.isArray(orgResources) ? orgResources : (orgResources?.data ?? [])).map((r: any) => (
                <div key={r.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <div className="font-medium">{r.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Available: {r.quantityAvailable ?? r.quantity_available ?? 0}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input type="number" placeholder="Qty" defaultValue={1} className="w-20" />
                    <Button
                      onClick={() => assignMutation.mutate({ resourceId: r.id, qty: 1 })}
                      disabled={assignMutation.isLoading}
                    >
                      Assign
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setAssignOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const AssignVolunteerDialog = () => (
    <Dialog open={assignVolunteerOpen} onOpenChange={setAssignVolunteerOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Volunteer to Shift</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <div className="space-y-4">
            <div>
              <label className="text-sm block mb-1">Select Shift</label>
              <select
                className="w-full p-2 border rounded"
                value={selectedShiftId ?? ''}
                onChange={(e) => setSelectedShiftId(e.target.value === '' ? null : Number(e.target.value))}
              >
                <option value="">Select shift</option>
                {(Array.isArray(eventShifts) ? eventShifts : (eventShifts?.data ?? [])).map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.title} — {s.start_at ?? s.startAt}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm block mb-1">Volunteer (user id)</label>
              <Input type="number" id="assign-user-id" placeholder="User ID" />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  const el: any = document.getElementById('assign-user-id');
                  const uid = Number(el?.value);
                  if (!selectedShiftId || !uid) {
                    toast({ title: 'Please select shift and volunteer', variant: 'destructive' });
                    return;
                  }
                  assignVolunteerMutation.mutate({ shift_id: selectedShiftId, user_id: uid });
                }}
              >
                Assign
              </Button>
              <Button variant="outline" onClick={() => setAssignVolunteerOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
  // Helper to format date/time
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Hero Image */}
      <div className="relative h-[400px] w-full bg-slate-900">
        <img
          src={
            event.image || 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?q=80&w=2074&auto=format&fit=crop'
          }
          alt={event.title}
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute top-6 left-6">
          <Button variant="secondary" size="sm" className="gap-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" /> {t('Back')}
          </Button>
        </div>
      </div>

      <div className="container px-4 -mt-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex flex-wrap gap-2 mb-4">
                  {event.tags?.map((tag: string) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <h1 className="text-3xl font-bold text-slate-900">{event.title}</h1>
                <div className="flex items-center gap-2 text-muted-foreground mt-2">
                  <span className="font-medium text-primary">{event.organization?.name}</span>
                  <span>•</span>
                  <span>{t('Posted recently')}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-8">
                <div>
                  <h3 className="text-xl font-semibold mb-3">{t('About this Opportunity')}</h3>
                  <p className="text-slate-600 leading-relaxed">{event.description}</p>
                </div>

                <Separator />

                {event.requirements && event.requirements.length > 0 && (
                  <>
                    <div>
                      <h3 className="text-xl font-semibold mb-3">{t('Requirements')}</h3>
                      <ul className="space-y-2">
                        {event.requirements.map((req: string, index: number) => (
                          <li key={index} className="flex items-start gap-3 text-slate-600">
                            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Separator />
                  </>
                )}

                <div>
                  <h3 className="text-xl font-semibold mb-3">{t('Location')}</h3>
                  <p className="text-slate-600 mb-4 flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> {event.location}
                  </p>
                  {event.coordinates && (
                    <div className="h-[300px] w-full rounded-lg overflow-hidden border">
                      <MapContainer center={event.coordinates as [number, number]} zoom={15} className="w-full h-full">
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />
                        <Marker position={event.coordinates as [number, number]}>
                          <Popup>{event.location}</Popup>
                        </Marker>
                      </MapContainer>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Resources assigned to this event */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Assigned Resources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex justify-between">
                  <div />
                  <div className="flex gap-2">
                    <Button onClick={() => setAssignOpen(true)}>Quick Assign Resource</Button>
                    <Button onClick={() => setAssignVolunteerOpen(true)}>Quick Assign Volunteer</Button>
                  </div>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Resource</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Assigned At</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!eventAssignments || (Array.isArray(eventAssignments) && eventAssignments.length === 0) ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                          No resources assigned
                        </TableCell>
                      </TableRow>
                    ) : (
                      (Array.isArray(eventAssignments) ? eventAssignments : (eventAssignments?.data ?? [])).map(
                        (a: any) => (
                          <TableRow key={a.id}>
                            <TableCell>{a.resource?.name ?? a.resourceName ?? 'Resource'}</TableCell>
                            <TableCell>{a.quantity ?? 1}</TableCell>
                            <TableCell>{a.assignedAt ? new Date(a.assignedAt).toLocaleString() : '-'}</TableCell>
                            <TableCell>{a.status}</TableCell>
                          </TableRow>
                        )
                      )
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Shifts & Tasks for this event */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Shifts & Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex justify-between">
                  <div />
                  <Button onClick={() => (window.location.href = `/admin/shifts?eventId=${id}`)}>Manage Shifts</Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Shift</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Assigned</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!eventShifts || (Array.isArray(eventShifts) && eventShifts.length === 0) ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                          No shifts scheduled
                        </TableCell>
                      </TableRow>
                    ) : (
                      (Array.isArray(eventShifts) ? eventShifts : (eventShifts?.data ?? [])).map((s: any) => (
                        <TableRow key={s.id}>
                          <TableCell>{s.title}</TableCell>
                          <TableCell>
                            {s.start_at ?? s.startAt ?? ''} — {s.end_at ?? s.endAt ?? ''}
                          </TableCell>
                          <TableCell>{s.capacity ?? 0}</TableCell>
                          <TableCell>{s.assignments_count ?? s.assigned_count ?? 0}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Action Card */}
            <Card className="border-none shadow-lg sticky top-24">
              <CardHeader>
                <CardTitle>{t('Date & Time')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium">{formatDate(event.startAt)}</div>
                      <div className="text-sm text-muted-foreground">{t('Add to Calendar')}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium">
                        {formatTime(event.startAt)} - {formatTime(event.endAt)}
                      </div>
                      <div className="text-sm text-muted-foreground">{t('Duration')}</div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span>
                      {event.spots?.filled || 0} {t('volunteers signed up')}
                    </span>
                    <span className="text-muted-foreground">
                      {event.capacity || 0} {t('spots total')}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${((event.spots?.filled || 0) / (event.capacity || 1)) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                  <Button
                    size="lg"
                    className="w-full font-semibold text-lg h-12"
                    onClick={handleJoinEvent}
                    disabled={joinMutation.isPending}
                  >
                    {joinMutation.isPending ? t('Joining...') : t('Join Now')}
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1">
                      <Share2 className="h-4 w-4 mr-2" /> {t('Share')}
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <Flag className="h-4 w-4 mr-2" /> {t('Report')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Organizer Card */}
            {event.organization && (
              <Card className="border-none shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg">{t('Organizer')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={event.organization.logo} />
                      <AvatarFallback>{event.organization.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold">{event.organization.name}</div>
                      <div className="text-sm text-muted-foreground">{t('Organization')}</div>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    {event.organization.email && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Mail className="h-4 w-4" /> {event.organization.email}
                      </div>
                    )}
                    {event.organization.phone && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Phone className="h-4 w-4" /> {event.organization.phone}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="link"
                    className="px-0 mt-2 text-primary"
                    onClick={() => navigate(`/organizations/${event.organization.id}`)}
                  >
                    {t('View Organization Profile')}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      <AssignDialog />
    </div>
  );
};

export default Detail;
