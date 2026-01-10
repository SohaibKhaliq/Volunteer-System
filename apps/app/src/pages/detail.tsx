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
// no local state required here
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { useToast } from '@/components/atoms/use-toast';
import { useStore } from '@/lib/store';

// Fix for default marker icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
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
  const { token } = useStore((state) => ({ token: state.token }));

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

  // Shifts for this event
  const { data: eventShifts } = useQuery({
    queryKey: ['event-shifts', id],
    queryFn: () => (id ? api.listShifts({ event_id: Number(id) }) : Promise.resolve([])),
    enabled: !!id
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
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Hero Image */}
      <div className="relative h-[450px] w-full bg-slate-900 group">
        <img
          src={
            event.image || 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?q=80&w=2074&auto=format&fit=crop'
          }
          alt={event.title}
          className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10" />
        <div className="absolute top-8 left-8 z-20">
          <Button variant="outline" className="gap-2 rounded-xl bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20 font-bold" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" /> {t('Back')}
          </Button>
        </div>
      </div>

      <div className="container px-4 -mt-32 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-10">
            <Card className="border-border/50 shadow-2xl shadow-primary/5 rounded-[2.5rem] bg-card overflow-hidden">
              <CardHeader className="p-10 pb-4">
                <div className="flex flex-wrap gap-2 mb-6">
                  {event.tags?.map((tag: string) => (
                    <Badge key={tag} className="bg-primary/10 text-primary border-none font-bold px-3 py-1 rounded-lg text-[10px] uppercase tracking-wider">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight leading-tight">{event.title}</h1>
                <div className="flex items-center gap-3 text-muted-foreground mt-4 font-bold">
                  <span className="text-primary hover:underline cursor-pointer transition-all" onClick={() => navigate(`/organizations/${event.organization?.id}`)}>{event.organization?.name}</span>
                  <span className="opacity-30">•</span>
                  <span className="text-sm font-medium">{t('Posted recently')}</span>
                </div>
              </CardHeader>
              <CardContent className="p-10 space-y-10">
                <div>
                  <h3 className="text-2xl font-black mb-4 text-foreground tracking-tight">{t('About this Opportunity')}</h3>
                  <p className="text-muted-foreground leading-relaxed font-medium text-lg">{event.description}</p>
                </div>

                <Separator className="bg-border/50" />

                {event.requirements && event.requirements.length > 0 && (
                  <>
                    <div className="bg-muted/30 p-8 rounded-3xl border border-border/50">
                      <h3 className="text-2xl font-black mb-6 text-foreground tracking-tight">{t('Requirements')}</h3>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {event.requirements.map((req: string, index: number) => (
                          <li key={index} className="flex items-center gap-4 text-muted-foreground font-bold text-sm bg-card p-4 rounded-xl border border-border/20">
                            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Separator className="bg-border/50" />
                  </>
                )}

                <div>
                  <h3 className="text-2xl font-black mb-6 text-foreground tracking-tight">{t('Location')}</h3>
                  <div className="flex items-center gap-3 mb-8 bg-muted/50 p-4 rounded-2xl border border-border/50 w-fit">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <p className="text-foreground font-bold">{event.location}</p>
                  </div>
                  {event.coordinates && (
                    <div className="h-[400px] w-full rounded-[2rem] overflow-hidden border border-border/50 shadow-inner">
                      <MapContainer center={event.coordinates as [number, number]} zoom={15} className="w-full h-full">
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />
                        <Marker position={event.coordinates as [number, number]}>
                          <Popup><div className="font-bold p-2">{event.location}</div></Popup>
                        </Marker>
                      </MapContainer>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Resources assigned to this event */}
            <Card className="rounded-[2.5rem] bg-card border-border/50 shadow-xl overflow-hidden mt-10">
              <CardHeader className="px-10 py-8 bg-muted/30 border-b border-border/50">
                <CardTitle className="text-2xl font-black tracking-tight">{t('Assigned Resources')}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow className="border-border/50 hover:bg-transparent">
                      <TableHead className="px-10 py-5 font-black uppercase tracking-widest text-[10px] text-muted-foreground">{t('Resource')}</TableHead>
                      <TableHead className="py-5 font-black uppercase tracking-widest text-[10px] text-muted-foreground">{t('Quantity')}</TableHead>
                      <TableHead className="py-5 font-black uppercase tracking-widest text-[10px] text-muted-foreground">{t('Assigned At')}</TableHead>
                      <TableHead className="px-10 py-5 font-black uppercase tracking-widest text-[10px] text-muted-foreground text-right">{t('Status')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!eventAssignments || (Array.isArray(eventAssignments) && eventAssignments.length === 0) ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-16 text-muted-foreground font-bold">
                          {t('No resources assigned')}
                        </TableCell>
                      </TableRow>
                    ) : (
                      (Array.isArray(eventAssignments) ? eventAssignments : (eventAssignments?.data ?? [])).map(
                        (a: any) => (
                          <TableRow key={a.id} className="border-border/30 hover:bg-muted/30 transition-colors">
                            <TableCell className="px-10 py-6 font-bold text-foreground">{a.resource?.name ?? a.resourceName ?? 'Resource'}</TableCell>
                            <TableCell className="py-6 font-bold">{a.quantity ?? 1}</TableCell>
                            <TableCell className="py-6 font-medium text-muted-foreground">{a.assignedAt ? new Date(a.assignedAt).toLocaleString() : '-'}</TableCell>
                            <TableCell className="px-10 py-6 text-right">
                              <Badge className="bg-primary/10 text-primary border-none font-bold rounded-lg text-xs">{a.status}</Badge>
                            </TableCell>
                          </TableRow>
                        )
                      )
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Shifts & Tasks for this event */}
            <Card className="rounded-[2.5rem] bg-card border-border/50 shadow-xl overflow-hidden mt-10">
              <CardHeader className="px-10 py-8 bg-muted/30 border-b border-border/50 flex flex-row items-center justify-between">
                <CardTitle className="text-2xl font-black tracking-tight">{t('Shifts & Tasks')}</CardTitle>
                <Button variant="ghost" className="font-bold text-primary hover:bg-primary/5 rounded-xl" onClick={() => (window.location.href = `/admin/shifts?eventId=${id}`)}>
                  {t('Manage Shifts')}
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow className="border-border/50 hover:bg-transparent">
                      <TableHead className="px-10 py-5 font-black uppercase tracking-widest text-[10px] text-muted-foreground">{t('Shift Title')}</TableHead>
                      <TableHead className="py-5 font-black uppercase tracking-widest text-[10px] text-muted-foreground">{t('Time Slot')}</TableHead>
                      <TableHead className="py-5 font-black uppercase tracking-widest text-[10px] text-muted-foreground">{t('Capacity')}</TableHead>
                      <TableHead className="px-10 py-5 font-black uppercase tracking-widest text-[10px] text-muted-foreground text-right">{t('Filled')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!eventShifts || (Array.isArray(eventShifts) && eventShifts.length === 0) ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-16 text-muted-foreground font-bold">
                          {t('No shifts scheduled')}
                        </TableCell>
                      </TableRow>
                    ) : (
                      (Array.isArray(eventShifts) ? eventShifts : (eventShifts?.data ?? [])).map((s: any) => (
                        <TableRow key={s.id} className="border-border/30 hover:bg-muted/30 transition-colors">
                          <TableCell className="px-10 py-6 font-bold text-foreground">{s.title}</TableCell>
                          <TableCell className="py-6 font-medium text-muted-foreground">
                            {s.start_at ?? s.startAt ?? ''} — {s.end_at ?? s.endAt ?? ''}
                          </TableCell>
                          <TableCell className="py-6 font-bold">{s.capacity ?? 0}</TableCell>
                          <TableCell className="px-10 py-6 text-right">
                            <div className="flex items-center justify-end gap-3 font-black text-primary">
                              {s.assignments_count ?? s.assigned_count ?? 0} / {s.capacity ?? 0}
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

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Action Card */}
            <Card className="border-border/50 shadow-2xl shadow-primary/10 rounded-3xl bg-card lg:sticky lg:top-24 overflow-hidden">
              <CardHeader className="bg-muted/30 border-b border-border/50">
                <CardTitle className="text-xl font-black tracking-tight">{t('Date & Time')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-8 p-8">
                <div className="space-y-6">
                  <div className="flex items-start gap-4 group">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      <Calendar className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="font-black text-foreground">{formatDate(event.startAt)}</div>
                      <div className="text-sm font-bold text-muted-foreground uppercase tracking-widest text-[10px] mt-1">{t('Event Date')}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 group">
                    <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform">
                      <Clock className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="font-black text-foreground">
                        {formatTime(event.startAt)} - {formatTime(event.endAt)}
                      </div>
                      <div className="text-sm font-bold text-muted-foreground uppercase tracking-widest text-[10px] mt-1">{t('Duration')}</div>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-border/50" />

                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <div className="text-2xl font-black text-primary">{event.spots?.filled || 0}</div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('Volunteers Joined')}</div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="text-2xl font-black text-foreground">{event.capacity || 0}</div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('Total Spots')}</div>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3 p-1">
                    <div
                      className="bg-gradient-to-r from-primary to-primary/80 h-full rounded-full transition-all duration-1000"
                      style={{ width: `${((event.spots?.filled || 0) / (event.capacity || 1)) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-4 pt-4">
                  <Button
                    size="lg"
                    className="w-full font-black text-lg h-16 rounded-2xl shadow-2xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    onClick={handleJoinEvent}
                    disabled={joinMutation.isPending}
                  >
                    {joinMutation.isPending ? t('Joining...') : t('Join Now')}
                  </Button>
                  <div className="flex gap-4">
                    <Button variant="outline" className="flex-1 h-12 rounded-xl border-border/50 font-bold hover:bg-muted">
                      <Share2 className="h-4 w-4 mr-2" /> {t('Share')}
                    </Button>
                    <Button variant="outline" className="flex-1 h-12 rounded-xl border-border/50 font-bold hover:bg-muted">
                      <Flag className="h-4 w-4 mr-2" /> {t('Report')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Organizer Card */}
            {event.organization && (
              <Card className="border-border/50 shadow-xl rounded-3xl bg-card overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border/50">
                  <CardTitle className="text-lg font-black tracking-tight">{t('Organizer')}</CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="flex items-center gap-4 mb-6 group cursor-pointer" onClick={() => navigate(`/organizations/${event.organization.id}`)}>
                    <Avatar className="h-14 w-14 rounded-2xl border-2 border-primary/20 p-1 bg-background">
                      <AvatarImage src={event.organization.logo} className="rounded-xl object-contain" />
                      <AvatarFallback className="rounded-xl bg-primary/5 text-primary font-black">{event.organization.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-black text-foreground group-hover:text-primary transition-colors">{event.organization.name}</div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('Verified Organization')}</div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {event.organization.email && (
                      <a href={`mailto:${event.organization.email}`} className="flex items-center gap-3 text-sm font-bold text-muted-foreground hover:text-primary transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                          <Mail className="h-4 w-4" />
                        </div>
                        {event.organization.email}
                      </a>
                    )}
                    {event.organization.phone && (
                      <a href={`tel:${event.organization.phone}`} className="flex items-center gap-3 text-sm font-bold text-muted-foreground hover:text-primary transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                          <Phone className="h-4 w-4" />
                        </div>
                        {event.organization.phone}
                      </a>
                    )}
                  </div>
                  <Button
                    variant="link"
                    className="px-0 mt-6 text-primary font-black uppercase tracking-widest text-[10px] hover:no-underline hover:opacity-70"
                    onClick={() => navigate(`/organizations/${event.organization.id}`)}
                  >
                    {t('View Profile')} <ArrowRight className="ml-2 h-3 w-3" />
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      {/* Assign dialog removed from this page — not defined here */}
    </div>
  );
};

export default Detail;
