import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
// Render volunteer sections as stacked content instead of tabs
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/atoms/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Award,
  Clock,
  Calendar,
  MapPin,
  User,
  Settings,
  LogOut,
  Shield,
  Heart,
  CheckCircle2,
  History,
  ArrowRight,
  Building2,
  Users,
  Camera,
  AlertCircle
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useStore } from '@/lib/store';
import { Link, useLocation } from 'react-router-dom';
import volunteerApi from '@/lib/api/volunteerApi';
import { AssignmentStatus } from '@/lib/constants/assignmentStatus';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  // use combined endpoint (profile + dashboard)
  const { data: meResponse, isLoading } = useQuery(['me'], () => api.getVolunteerDashboard());
  const { setToken } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useStore();
  // tab state for compact navigation
  const [activeTab, setActiveTab] = useState('overview');

  // Initialize active tab from localStorage or navigation state (scroll instruction)
  useEffect(() => {
    const saved = localStorage.getItem('profile.activeTab');
    const stateScrollTo = (location.state as any)?.scrollTo as string | undefined;
    const initial = saved || stateScrollTo || 'overview';
    setActiveTab(initial);

    // If navigation sent a scroll instruction, scroll to that section once
    if (stateScrollTo) {
      // clear the navigation state so repeated navigations don't re-trigger
      navigate(location.pathname, { replace: true, state: {} });
      setTimeout(() => {
        const el = document.getElementById(stateScrollTo);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist active tab across reloads
  useEffect(() => {
    try {
      localStorage.setItem('profile.activeTab', activeTab);
    } catch (e) {}
  }, [activeTab]);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    bio: '',
    address: '',
    skills: '',
    interests: '',
    availability: ''
  });

  useEffect(() => {
    const u = (meResponse as any)?.profile ?? (meResponse as any)?.data ?? (meResponse as any) ?? null;
    if (u) {
      setFormData({
        firstName: u.firstName || u.first_name || '',
        lastName: u.lastName || u.last_name || '',
        email: u.email || '',
        phone: u.phone || '',
        bio: u.profileMetadata?.bio || u.bio || '',
        address: u.profileMetadata?.address || '',
        skills: Array.isArray(u.profileMetadata?.skills)
          ? u.profileMetadata.skills.join(', ')
          : u.profileMetadata?.skills || '',
        interests: Array.isArray(u.profileMetadata?.interests)
          ? u.profileMetadata.interests.join(', ')
          : u.profileMetadata?.interests || '',
        availability: u.profileMetadata?.availability || ''
      });
    }
  }, [meResponse]);

  // Normalize user payload early so hooks can be declared in stable order
  const userDataEarly = (meResponse as any)?.profile ?? (meResponse as any)?.data ?? (meResponse as any) ?? undefined;
  const userId = userDataEarly?.id ?? undefined;

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.updateUser(userId as any, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['me']);
      toast({ title: 'Profile updated', description: 'Your changes have been saved successfully.' });
    },
    onError: () => {
      toast({
        title: 'Update failed',
        description: 'Could not update profile. Please try again.',
        variant: 'destructive'
      });
    }
  });

  const handleLogout = () => {
    api.logout().finally(() => {
      setToken('');
      navigate('/login');
    });
  };

  // Load assignments for the current user (server returns assignment objects with `task` relation)
  const { data: assignments } = useQuery(
    ['my-assignments', userId],
    async () => {
      if (!userId) return [] as any;
      const res = await api.getMyAssignments({ user_id: userId });
      if (!res) return [] as any;
      const list = Array.isArray(res) ? res : ((res as any).data ?? []);
      // server should already filter, but be defensive
      return list.filter((a: any) => (a.userId || a.user?.id) === userId);
    },
    { enabled: !!userId }
  );

  const { data: myHours } = useQuery(
    ['my-hours', userId],
    async () => {
      if (!userId) return [] as any;
      const res = await api.getMyVolunteerHours({ user_id: userId });
      if (!res) return [] as any;
      const list = Array.isArray(res) ? res : ((res as any).data ?? []);
      return list.filter((h: any) => (h.user?.id || h.userId) === userId);
    },
    { enabled: !!userId }
  );

  // Browse opportunities (show a few suggestions on profile)
  const { data: opportunitiesData } = useQuery({
    queryKey: ['volunteer-browse-opportunities'],
    queryFn: async () => {
      try {
        const res = await volunteerApi.browseOpportunities({ perPage: 6 });
        return (res as any)?.data || [];
      } catch {
        return [];
      }
    }
  });

  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );

  // If there is no auth token, redirect to login so the profile page isn't accessible anonymously
  if (!token) {
    const returnTo = encodeURIComponent(window.location.pathname + window.location.search + window.location.hash);
    navigate(`/login?returnTo=${returnTo}`);
    return null;
  }

  const meRaw = (meResponse as any)?.profile ?? (meResponse as any)?.data ?? (meResponse as any) ?? null;
  if (!meRaw) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h2 className="text-2xl font-bold">Please log in to view your profile</h2>
        <Button onClick={() => navigate('/login')}>Log In</Button>
      </div>
    );
  }
  const userData = (meResponse as any)?.profile ?? (meResponse as any)?.data ?? (meResponse as any) ?? {};

  // Transform assignments into the UI's expected `upcomingShifts` structure
  const upcomingShifts = (assignments ?? [])
    .map((a: any) => {
      const task = a.task || a.task || {};
      const start = task?.startAt ? new Date(task.startAt) : null;
      const date = start ? start.toLocaleDateString() : task?.date || '';
      const time = start ? start.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '';
      const location = task?.location || a.location || (task?.event && task.event.location) || '';
      return {
        id: a.id || task.id,
        title: task?.title || a.title || (task?.event && task.event.title) || 'Volunteer Shift',
        date: date,
        time: time,
        location: location,
        role: a.role || task?.role || 'Volunteer',
        eventId: task?.eventId || task?.event?.id || a.eventId || null,
        startAt: start
      };
    })
    .filter((s: any) => !s.startAt || s.startAt >= new Date())
    .sort((a: any, b: any) => {
      if (!a.startAt) return 1;
      if (!b.startAt) return -1;
      return a.startAt.getTime() - b.startAt.getTime();
    });

  // Pagination state for schedule
  const [schedulePage, setSchedulePage] = useState(1);
  const schedulePerPage = 5;
  // Reset page when source changes
  useEffect(() => {
    setSchedulePage(1);
  }, [meResponse, assignments]);

  // Transform volunteer-hours into history rows
  const history = (myHours ?? []).map((h: any) => ({
    id: h.id,
    title: h.event?.title || h.activity || 'Volunteer Activity',
    date: h.date ? new Date(h.date).toLocaleDateString() : '',
    hours: h.hours || 0,
    status: h.status || 'Verified'
  }));

  // allow cancelling assignments (mark status cancelled)
  // NOTE: keep hooks at top-level and in stable order — declare mutations before any early returns
  const cancelMutation = useMutation({
    mutationFn: (id: number) => api.updateAssignment(id, { status: AssignmentStatus.Cancelled }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-assignments', userId] })
  });

  // Organization join/leave mutations
  const joinOrgMutation = useMutation({
    mutationFn: (id: number) => volunteerApi.joinOrganization(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['me']);
      toast({ title: 'Request submitted', description: 'Your request to join the organization was submitted.' });
    },
    onError: (error: any) => {
      const status = error?.response?.status;
      const serverMessage = error?.response?.data?.message;
      if (status === 401) {
        toast({ title: 'Login required', description: 'Please sign in to join organizations', variant: 'destructive' });
        queryClient.invalidateQueries(['me']);
        return;
      }
      if (status === 409) {
        toast({
          title: 'Already a member',
          description: serverMessage || 'You are already a member of this organization'
        });
        queryClient.invalidateQueries(['me']);
        return;
      }
      toast({
        title: 'Request failed',
        description: serverMessage || 'Could not submit join request',
        variant: 'destructive'
      });
    }
  });

  const leaveOrgMutation = useMutation({
    mutationFn: (id: number) => volunteerApi.leaveOrganization(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['me']);
      toast({ title: 'Left organization', description: 'You have left the organization.' });
    },
    onError: () => {
      toast({ title: 'Action failed', description: 'Could not leave organization', variant: 'destructive' });
    }
  });

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12">
      {/* Header / Banner */}
      <div className="bg-slate-900 text-white pt-12 pb-24 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
            <Avatar className="h-32 w-32 border-4 border-white shadow-xl">
              <AvatarImage src={userData.profileImageUrl} />
              <AvatarFallback className="bg-primary text-white text-4xl font-bold">
                {userData.firstName?.[0]}
                {userData.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="text-center md:text-left flex-1">
              <h1 className="text-3xl font-bold mb-1">
                {userData.firstName || userData.first_name} {userData.lastName || userData.last_name}
              </h1>
              <p className="text-slate-300 flex items-center gap-2 justify-center md:justify-start">
                <Shield className="h-4 w-4" /> Verified Volunteer
              </p>
              <div className="flex gap-2 mt-3 justify-center md:justify-start">
                {(() => {
                  // compute badges dynamically from available user data
                  const computed: string[] = [];
                  const hoursCount = Number(userData.hours || userData.totalHours || 0);
                  const impact = Number(userData.impactScore || 0);
                  const joinedAt = userData.createdAt || userData.created_at || userData.joinedAt || null;
                  if (impact >= 800) computed.push('Top Contributor');
                  if (hoursCount >= 50) computed.push('50 Hours Club');
                  if (joinedAt) {
                    try {
                      const d = new Date(joinedAt);
                      if (!isNaN(d.getTime()) && d.getFullYear() <= new Date().getFullYear() - 2) {
                        computed.push('Early Adopter');
                      }
                    } catch (e) {}
                  } else {
                    computed.push('Member');
                  }

                  // ensure at least one badge
                  if (computed.length === 0) computed.push('Member');

                  return computed.map((b: any) => (
                    <Badge key={b} variant="secondary" className="px-3 py-1">
                      <Award className="h-3 w-3 mr-1 text-yellow-500" /> {b}
                    </Badge>
                  ));
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-5xl px-4 -mt-12">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white shadow-sm p-1 h-12 w-full md:w-auto grid grid-cols-3 md:flex">
            <TabsTrigger value="overview" className="flex gap-2">
              <User className="h-4 w-4" /> <span className="hidden md:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex gap-2">
              <Calendar className="h-4 w-4" /> <span className="hidden md:inline">My Schedule</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex gap-2">
              <History className="h-4 w-4" /> <span className="hidden md:inline">History</span>
            </TabsTrigger>
            <TabsTrigger value="resources" className="flex gap-2">
              <Award className="h-4 w-4" /> <span className="hidden md:inline">Resources</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex gap-2">
              <Settings className="h-4 w-4" /> <span className="hidden md:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Stats Cards */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Hours</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold flex items-center gap-2">
                    {userData.hours || 0}
                    <Clock className="h-5 w-5 text-blue-500" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {typeof userData.hoursChangePercent === 'number'
                      ? `${userData.hoursChangePercent > 0 ? '+' : ''}${userData.hoursChangePercent}% from last month`
                      : '+0% from last month'}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Impact Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold flex items-center gap-2">
                    {userData.impactScore}
                    <Heart className="h-5 w-5 text-red-500" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {userData.impactPercentile ? `Top ${userData.impactPercentile}% of volunteers` : 'Top contributors'}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Events Attended</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold flex items-center gap-2">
                    {userData.participationCount || 0}
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{upcomingShifts.length} upcoming</p>
                </CardContent>
              </Card>

              {/* Upcoming Schedule Preview */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Upcoming Schedule</CardTitle>
                  <CardDescription>Your next commitments</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Paginate upcoming schedule */}
                  {(() => {
                    const source = (meResponse as any)?.dashboard?.upcomingEvents ?? upcomingShifts;
                    const total = Array.isArray(source) ? source.length : 0;
                    const totalPages = Math.max(1, Math.ceil(total / schedulePerPage));
                    const start = (schedulePage - 1) * schedulePerPage;
                    const paged = Array.isArray(source) ? source.slice(start, start + schedulePerPage) : [];
                    return (
                      <>
                        {paged.map((shift: any) => (
                          <div
                            key={shift.id}
                            className="flex items-center justify-between p-4 border rounded-lg bg-slate-50/50"
                          >
                            <div className="flex items-center gap-4">
                              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                {shift.date.split(' ')[1]}
                              </div>
                              <div>
                                <h4 className="font-semibold">{shift.title}</h4>
                                <p className="text-sm text-muted-foreground flex items-center gap-2">
                                  <Clock className="h-3 w-3" /> {shift.time} • <MapPin className="h-3 w-3" />{' '}
                                  {shift.location}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                navigate(shift.eventId ? `/detail/event/${shift.eventId}` : `/events/${shift.id}`)
                              }
                            >
                              View
                            </Button>
                          </div>
                        ))}

                        {/* Pagination controls */}
                        {total > schedulePerPage && (
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                              Showing {start + 1}-{Math.min(start + schedulePerPage, total)} of {total}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSchedulePage((p) => Math.max(1, p - 1))}
                                disabled={schedulePage === 1}
                              >
                                Prev
                              </Button>
                              <div className="text-sm">
                                {schedulePage} / {totalPages}
                              </div>
                              <Button
                                size="sm"
                                onClick={() => setSchedulePage((p) => Math.min(totalPages, p + 1))}
                                variant="outline"
                                disabled={schedulePage === totalPages}
                              >
                                Next
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Badges/Achievements */}
              <Card>
                <CardHeader>
                  <CardTitle>Achievements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {((meResponse as any)?.dashboard?.recentAchievements ?? userData.achievements) &&
                    ((meResponse as any)?.dashboard?.recentAchievements ?? userData.achievements).length > 0 ? (
                      ((meResponse as any)?.dashboard?.recentAchievements ?? userData.achievements).map((a: any) => (
                        <Badge key={a.id} variant="secondary" className="px-3 py-1">
                          <Award className="h-3 w-3 mr-1 text-yellow-500" /> {a.title}
                        </Badge>
                      ))
                    ) : (
                      <>
                        <Badge variant="secondary" className="px-3 py-1">
                          <Award className="h-3 w-3 mr-1 text-yellow-500" /> Early Adopter
                        </Badge>
                        <Badge variant="secondary" className="px-3 py-1">
                          <Award className="h-3 w-3 mr-1 text-blue-500" /> 50 Hours Club
                        </Badge>
                        <Badge variant="secondary" className="px-3 py-1">
                          <Award className="h-3 w-3 mr-1 text-green-500" /> Eco Warrior
                        </Badge>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Organization Memberships */}
              <Card>
                <CardHeader>
                  <CardTitle>Organization Memberships</CardTitle>
                  <CardDescription>Your current organizations and pending requests</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(((meResponse as any)?.profile?.organizations ?? userData.organizations) || []).length === 0 &&
                    (((meResponse as any)?.profile?.organizationStatuses ?? []) || []).length === 0 ? (
                      <div className="text-sm text-muted-foreground">You are not a member of any organizations.</div>
                    ) : (
                      // Build a union of organizations + any status-only entries
                      (() => {
                        const orgs = (meResponse as any)?.profile?.organizations ?? userData.organizations ?? [];
                        const statuses = (meResponse as any)?.profile?.organizationStatuses ?? [];
                        // Map statuses by organization id for quick lookup
                        const statusMap: Record<string | number, any> = {};
                        statuses.forEach((s: any) => {
                          statusMap[s.organization_id ?? s.organizationId ?? s.id] = s;
                        });

                        // Combine orgs with any status-only entries (e.g., pending requests where org not preloaded)
                        const extraStatuses = statuses.filter(
                          (s: any) => !orgs.find((o: any) => o.id === (s.organization_id ?? s.organizationId ?? s.id))
                        );

                        const rows: any[] = [...orgs, ...extraStatuses];

                        return rows.map((o: any) => {
                          const id = o.id ?? o.organization_id ?? o.organizationId;
                          const status = (statusMap[id] && statusMap[id].status) || 'not_member';
                          const name = o.name || o.title || 'Organization';
                          return (
                            <div key={String(id)} className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <div className="font-medium">{name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {status === 'active'
                                    ? 'Member'
                                    : status === 'pending'
                                      ? 'Pending approval'
                                      : 'Not a member'}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {status === 'active' ? (
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => leaveOrgMutation.mutate(id)}
                                    disabled={leaveOrgMutation.isLoading}
                                  >
                                    Leave
                                  </Button>
                                ) : status === 'pending' ? (
                                  <div className="text-sm text-muted-foreground">Request pending</div>
                                ) : (
                                  <Button
                                    size="sm"
                                    onClick={() => joinOrgMutation.mutate(id)}
                                    disabled={joinOrgMutation.isLoading}
                                  >
                                    Request to join
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        });
                      })()
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Browse Opportunities */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Browse Opportunities</h2>
                <Link to="/organizations">
                  <Button variant="ghost" size="sm">
                    View All <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(opportunitiesData || []).slice(0, 6).map((opp: any) => (
                  <div
                    key={opp.id}
                    className="bg-white border rounded-xl overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="h-32 bg-gradient-to-r from-blue-500 to-indigo-600 relative">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <div className="absolute bottom-3 left-3 text-white font-semibold">{opp.title}</div>
                      {opp.organization && (
                        <div className="absolute top-3 left-3">
                          <Badge className="bg-white/20 text-white border-0">{opp.organization.name}</Badge>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="text-sm text-slate-600 line-clamp-2 mb-3">{opp.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                        <Calendar className="h-3 w-3" />
                        <span>{opp.startAt ? new Date(opp.startAt || opp.start_at).toLocaleDateString() : 'TBD'}</span>
                        {opp.capacity && (
                          <>
                            <Users className="h-3 w-3 ml-2" />
                            <span>{opp.capacity} spots</span>
                          </>
                        )}
                      </div>
                      <Link to={`/opportunities/${opp.id}`}>
                        <Button className="w-full" variant="outline">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* SCHEDULE SECTION */}
          <TabsContent value="schedule">
            <Card>
              <CardHeader>
                <CardTitle>My Schedule</CardTitle>
                <CardDescription>Manage your upcoming volunteer shifts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingShifts.length > 0 ? (
                    upcomingShifts.map((shift: any) => (
                      <div
                        key={shift.id}
                        className="flex flex-col md:flex-row md:items-center justify-between p-6 border rounded-lg gap-4"
                      >
                        <div className="flex gap-4">
                          <div className="flex flex-col items-center justify-center w-16 h-16 bg-slate-100 rounded-lg shrink-0">
                            <span className="text-xs font-bold uppercase text-slate-500">
                              {shift.date.split(' ')[0]}
                            </span>
                            <span className="text-xl font-bold">{shift.date.split(' ')[1]}</span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{shift.title}</h3>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {shift.time}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" /> {shift.location}
                              </span>
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" /> {shift.role}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                          <Button
                            variant="outline"
                            className="flex-1 md:flex-none"
                            onClick={() => {
                              const confirmed = window.confirm(
                                'Cancel this signup? This will mark your assignment as cancelled.'
                              );
                              if (confirmed) cancelMutation.mutate(shift.id);
                            }}
                            disabled={cancelMutation.isLoading}
                          >
                            {cancelMutation.isLoading ? 'Cancelling...' : 'Cancel'}
                          </Button>
                          <Button
                            className="flex-1 md:flex-none"
                            onClick={() =>
                              navigate(shift.eventId ? `/detail/event/${shift.eventId}` : `/events/${shift.id}`)
                            }
                          >
                            Details
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      No upcoming shifts.{' '}
                      <Button variant="link" onClick={() => navigate('/map')}>
                        Find opportunities
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* HISTORY SECTION */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Volunteer History</CardTitle>
                <CardDescription>Your past contributions and verified hours</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b">
                      <tr>
                        <th className="p-4">Activity</th>
                        <th className="p-4">Date</th>
                        <th className="p-4">Hours</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {history.map((item: any) => (
                        <tr key={item.id}>
                          <td className="p-4 font-medium">{item.title}</td>
                          <td className="p-4 text-slate-500">{item.date}</td>
                          <td className="p-4">{item.hours}h</td>
                          <td className="p-4">
                            <Badge
                              variant={item.status === 'Verified' ? 'default' : 'secondary'}
                              className={item.status === 'Verified' ? 'bg-green-500 hover:bg-green-600' : ''}
                            >
                              {item.status}
                            </Badge>
                          </td>
                          <td className="p-4 text-right">
                            <Button variant="ghost" size="sm">
                              Certificate
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* RESOURCES SECTION */}
          <TabsContent value="resources">
            <Card>
              <CardHeader>
                <CardTitle>My Resource Assignments</CardTitle>
                <CardDescription>Items currently assigned to you</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(assignments ?? []).filter((a: any) => a.resourceId || a.resource).length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">No resource assignments</div>
                  ) : (
                    <div className="space-y-2">
                      {(assignments ?? [])
                        .filter((a: any) => a.resourceId || a.resource)
                        .map((a: any) => (
                          <div key={a.id} className="p-4 border rounded flex items-center justify-between">
                            <div>
                              <div className="font-medium">{a.resource?.name ?? a.resourceName ?? 'Resource'}</div>
                              <div className="text-sm text-muted-foreground">
                                Assigned: {a.assignedAt ? new Date(a.assignedAt).toLocaleString() : '-'}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm">Qty: {a.quantity ?? 1}</div>
                              <div className="text-sm text-muted-foreground">Status: {a.status}</div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SETTINGS SECTION */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>Update your personal information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Incomplete Profile Warning */}
                {(!formData.phone || !formData.address || !formData.skills) && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Profile Incomplete</AlertTitle>
                    <AlertDescription>
                      Please complete your profile (Phone, Address, Skills) to be eligible for all opportunities.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex flex-col md:flex-row gap-6">
                  {/* Avatar Upload Section */}
                  <div className="flex flex-col items-center space-y-3">
                    <div className="relative">
                      <Avatar className="h-32 w-32 border-4 border-white shadow-xl">
                        <AvatarImage src={userData.profileImageUrl || userData.profileMetadata?.avatar_url} />
                        <AvatarFallback className="bg-primary text-white text-4xl font-bold">
                          {userData.firstName?.[0]}
                          {userData.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <Button
                        size="icon"
                        variant="secondary"
                        className="absolute bottom-0 right-0 rounded-full shadow-md"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;

                          const fd = new FormData();
                          fd.append('avatar', file);

                          try {
                            await api.updateVolunteerAvatar(fd);
                            queryClient.invalidateQueries(['me']);
                            toast({ title: 'Avatar updated', description: 'Your profile picture has been updated.' });
                          } catch (err) {
                            toast({
                              title: 'Upload failed',
                              description: 'Could not upload avatar.',
                              variant: 'destructive'
                            });
                          }
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Click camera icon to change</p>
                  </div>

                  {/* Main Form */}
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First name</Label>
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last name</Label>
                        <Input
                          id="lastName"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email <span className="text-xs text-muted-foreground">(Read-only)</span></Label>
                        <Input id="email" value={formData.email} disabled className="bg-slate-50" />
                        {userData.emailVerifiedAt && (
                           <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                             <CheckCircle2 className="h-3 w-3" /> Email Verified
                           </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone number {formData.phone ? '' : '*'}</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+1234567890"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Address {formData.address ? '' : '*'}</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="123 Volunteer Lane, City"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        rows={3}
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        placeholder="Tell us about yourself..."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="skills">Skills (comma separated) {formData.skills ? '' : '*'}</Label>
                        <Input
                          id="skills"
                          value={formData.skills}
                          onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                          placeholder="Teaching, First Aid, Driving..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="interests">Interests (comma separated)</Label>
                        <Input
                          id="interests"
                          value={formData.interests}
                          onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                          placeholder="Education, Environment, Health..."
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="availability">General Availability</Label>
                      <Input
                        id="availability"
                        value={formData.availability}
                        onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                        placeholder="Weekends, Evenings, Mon-Fri 9-5..."
                      />
                    </div>

                    {/* Read-only System Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                      <div className="space-y-1">
                        <Label className="text-muted-foreground">Background Check</Label>
                        <div className="flex items-center gap-2">
                           <Shield className={userData.isBackgroundChecked ? "h-4 w-4 text-green-500" : "h-4 w-4 text-slate-400"} />
                           <span className="text-sm">{userData.isBackgroundChecked ? 'Verified' : 'Not Verified / Pending'}</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-muted-foreground">Certified Volunteer</Label>
                         <div className="flex items-center gap-2">
                           <Award className={userData.isCertified ? "h-4 w-4 text-blue-500" : "h-4 w-4 text-slate-400"} />
                           <span className="text-sm">{userData.isCertified ? 'Yes' : 'No'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-4">
                      <Button
                        onClick={() =>
                          updateMutation.mutate({
                            firstName: formData.firstName,
                            lastName: formData.lastName,
                            phone: formData.phone,
                            profileMetadata: {
                              ...userData.profileMetadata,
                              bio: formData.bio,
                              address: formData.address,
                              skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
                              interests: formData.interests.split(',').map(s => s.trim()).filter(Boolean),
                              availability: formData.availability
                            }
                          })
                        }
                        disabled={updateMutation.isLoading}
                      >
                        {updateMutation.isLoading ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-red-50 border-t border-red-100 p-6 flex justify-between items-center mt-6">
                <div>
                  <h4 className="text-red-900 font-medium">Danger Zone</h4>
                  <p className="text-red-700 text-sm">Sign out or delete your account</p>
                </div>
                <Button
                  variant="destructive"
                  className="border-red-200 text-red-700 hover:bg-red-100 hover:text-red-900"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" /> Sign Out
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
