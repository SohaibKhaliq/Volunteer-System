import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
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
  CheckCircle2,
  History,
  Camera,
  AlertCircle
} from 'lucide-react';

// Import Volunteer Pages
import VolunteerDashboard from '@/pages/volunteer/dashboard';
import VolunteerApplicationsPage from '@/pages/volunteer/applications';
import VolunteerOrganizationsPage from '@/pages/volunteer/organizations';
import VolunteerCompliance from '@/pages/volunteer/compliance';
import { Building2, List } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useStore } from '@/lib/store';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import volunteerApi from '@/lib/api/volunteerApi';
import { AssignmentStatus } from '@/lib/constants/assignmentStatus';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Profile() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  // use profile endpoint to get user data with org statuses
  const { data: meResponse, isLoading } = useQuery(['me'], () => api.getVolunteerProfile());
  const { setToken } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();
  // tab state for compact navigation
  const [activeTab, setActiveTab] = useState('overview');
  // Cache buster for avatar
  const [avatarVersion, setAvatarVersion] = useState(Date.now());
  // Pagination state for schedule (must be before any early returns)
  const [schedulePage, setSchedulePage] = useState(1);

  // Initialize active tab from URL, then localStorage or navigation state
  useEffect(() => {
    const urlTab = searchParams.get('tab');
    const saved = localStorage.getItem('profile.activeTab');
    const stateScrollTo = (location.state as any)?.scrollTo as string | undefined;

    const initial = urlTab || saved || stateScrollTo || 'overview';
    setActiveTab(initial);

    // If navigation sent a scroll instruction, scroll to that section
    if (stateScrollTo) {
      setTimeout(() => {
        const el = document.getElementById(stateScrollTo);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
    }
  }, []);

  // Update URL and localStorage when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value }, { replace: true });
    try {
      localStorage.setItem('profile.activeTab', value);
    } catch (e) { }
  };

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

  // Reset schedule page when source changes (must be before early returns)
  useEffect(() => {
    setSchedulePage(1);
  }, [meResponse, assignments]);

  // allow cancelling assignments (mark status cancelled)
  const cancelMutation = useMutation({
    mutationFn: (id: number) => api.updateAssignment(id, { status: AssignmentStatus.Cancelled }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-assignments', userId] })
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

  // Profile completion: required fields help volunteers understand next steps
  const _filledChecks = [
    userData.phone || formData.phone,
    userData.profileMetadata?.address || formData.address,
    (Array.isArray(userData.profileMetadata?.skills) && userData.profileMetadata.skills.length > 0) || (formData.skills && formData.skills.trim().length > 0),
    userData.profileMetadata?.availability || formData.availability,
    userData.emailVerifiedAt || userData.email_verified_at || userData.emailVerified
  ].filter(Boolean).length;
  const profileCompletion = Math.round(((_filledChecks || 0) / 5) * 100);

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

  const schedulePerPage = 5;

  const paginatedShifts = upcomingShifts.slice(
    (schedulePage - 1) * schedulePerPage,
    schedulePage * schedulePerPage
  );

  const totalPages = Math.ceil(upcomingShifts.length / schedulePerPage);

  // Transform volunteer-hours into history rows
  const history = (myHours ?? []).map((h: any) => ({
    id: h.id,
    title: h.event?.title || h.activity || 'Volunteer Activity',
    date: h.date ? new Date(h.date).toLocaleDateString() : '',
    hours: h.hours || 0,
    status: h.status || 'Verified'
  }));



  return (
    <div className="min-h-screen bg-slate-50/50 pb-12">
      {/* Header / Banner */}
      <div className="bg-slate-900 text-white pt-12 pb-24 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
            <Avatar className="h-32 w-32 border-4 border-white shadow-xl">
              <AvatarImage src={`${userData.profileImageUrl}?v=${avatarVersion}`} />
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
                    } catch (e) { }
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

              {/* Profile completion indicator (accessibility-friendly) */}
              <div className="mt-3 w-full md:w-2/3">
                <div className="flex items-center gap-4">
                  <div className="flex-1" aria-hidden>
                    <Progress
                      value={profileCompletion}
                      className="bg-slate-700/50 h-2"
                      aria-label={`Profile completion ${profileCompletion} percent`}
                    />
                  </div>
                  <div className="text-sm text-white/90 font-medium">{profileCompletion}%</div>
                </div>
                {profileCompletion < 100 && (
                  <div className="mt-2 flex items-center gap-3">
                    <div className="text-xs text-white/80 flex-1">
                      Complete your profile to unlock more opportunities and improve matching accuracy.
                    </div>
                    <Button size="sm" variant="secondary" onClick={() => setActiveTab('settings')}>
                      Complete profile
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-5xl px-4 -mt-12">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="bg-white shadow-sm p-1 h-12 w-full md:w-auto grid grid-cols-3 md:flex">
            <TabsTrigger value="overview" className="flex gap-2">
              <Award className="h-4 w-4" /> <span className="hidden md:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="applications" className="flex gap-2">
              <List className="h-4 w-4" /> <span className="hidden md:inline">Applications</span>
            </TabsTrigger>
            <TabsTrigger value="organizations" className="flex gap-2">
              <Building2 className="h-4 w-4" /> <span className="hidden md:inline">Organizations</span>
            </TabsTrigger>
            <TabsTrigger value="compliance" className="flex gap-2">
              <Shield className="h-4 w-4" /> <span className="hidden md:inline">Compliance</span>
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
            <VolunteerDashboard />
          </TabsContent>

          <TabsContent value="dashboard" className="space-y-6">
            <VolunteerDashboard />
          </TabsContent>

          <TabsContent value="applications" className="space-y-6">
            <VolunteerApplicationsPage />
          </TabsContent>

          <TabsContent value="organizations" className="space-y-6">
            <VolunteerOrganizationsPage />
          </TabsContent>

          <TabsContent value="compliance" className="space-y-6">
            <VolunteerCompliance embed={true} />
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
                    <>
                      {paginatedShifts.map((shift: any) => (
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
                      ))}

                      {/* Pagination Controls */}
                      {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 pt-4 border-t mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSchedulePage(p => Math.max(1, p - 1))}
                            disabled={schedulePage === 1}
                          >
                            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                          </Button>
                          <span className="text-sm text-muted-foreground">
                            Page {schedulePage} of {totalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSchedulePage(p => Math.min(totalPages, p + 1))}
                            disabled={schedulePage === totalPages}
                          >
                            Next <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      )}
                    </>
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
                {(profileCompletion < 100) && (
                  <Alert className="mb-4" variant={profileCompletion < 50 ? 'destructive' : 'default'}>
                    <AlertCircle className="h-4 w-4" />
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between w-full gap-3">
                      <div>
                        <AlertTitle>Incomplete profile</AlertTitle>
                        <AlertDescription>
                          Your profile is {profileCompletion}% complete. Finish required fields to be eligible for more
                          opportunities and receive reminders about upcoming commitments.
                        </AlertDescription>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-40">
                          <Progress value={profileCompletion} aria-label={`Profile completion ${profileCompletion} percent`} />
                        </div>
                        <Button size="sm" onClick={() => setActiveTab('settings')}>
                          Complete now
                        </Button>
                      </div>
                    </div>
                  </Alert>
                )}

                <div className="flex flex-col md:flex-row gap-6">
                  {/* Avatar Upload Section */}
                  <div className="flex flex-col items-center space-y-3">
                    <div className="relative">
                      <Avatar className="h-32 w-32 border-4 border-white shadow-xl">
                        <AvatarImage src={`${userData.profileImageUrl || userData.profileMetadata?.avatar_url}?v=${avatarVersion}`} />
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

                          if (file.size > 5 * 1024 * 1024) {
                            toast({ title: 'File too large', description: 'Maximum file size is 5MB.', variant: 'destructive' as any });
                            return;
                          }

                          const fd = new FormData();
                          fd.append('avatar', file);

                          try {
                            await api.updateVolunteerAvatar(fd);
                            queryClient.invalidateQueries(['me']);
                            setAvatarVersion(Date.now());
                            toast({ title: 'Avatar updated', description: 'Your profile picture has been updated.' });
                          } catch (err: any) {
                            console.error('Avatar upload error:', err);
                            toast({
                              title: 'Upload failed',
                              description: err?.response?.data?.error?.message || 'Could not upload avatar.',
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
    </div >
  );
}
