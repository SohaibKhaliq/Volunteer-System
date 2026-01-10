import { useState, useEffect, useRef } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTheme } from '@/providers/theme-provider';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import TagInput from '@/components/molecules/tag-input';
import { cn } from '@/lib/utils';
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
  AlertCircle,
  Bell,
  MessageSquare,
  CalendarClock
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
import { AssignmentStatus } from '@/lib/constants/assignmentStatus';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Profile() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  // use profile endpoint to get user data with org statuses
  const { data: meResponse, isLoading } = useQuery(['volunteer-profile'], () => api.getVolunteerProfile());
  const { token, setToken, setUser } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { theme, setTheme } = useTheme();
  // tab state for compact navigation
  const [activeTab, setActiveTab] = useState('overview');
  // Cache buster for avatar
  const [avatarVersion, setAvatarVersion] = useState(Date.now());
  // Pagination state for schedule (must be before any early returns)
  const [schedulePage, setSchedulePage] = useState(1);

  // Preference state
  const [prefsFormData, setPrefsFormData] = useState<any>({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    newsletterSubscription: false,
    eventReminders: true,
    shiftReminders: true,
    opportunityAlerts: true,
    profilePublic: true,
    showEmail: false,
    showPhone: false,
    preferredDays: [],
    preferredTime: 'flexible',
    maxHoursPerWeek: 40,
    language: 'en',
    timezone: 'UTC',
    theme: 'auto'
  });

  // Fetch preferences
  const { data: prefsResponse } = useQuery(['user-preferences'], () => api.getPreferences());

  useEffect(() => {
    if (prefsResponse?.preferences) {
      setPrefsFormData(prefsResponse.preferences);
    }
  }, [prefsResponse]);

  const preferencesMutation = useMutation({
    mutationFn: (data: any) => api.updatePreferences(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['user-preferences']);
      // Apply theme change immediately if it was updated
      if (prefsFormData.theme && prefsFormData.theme !== theme) {
        setTheme(prefsFormData.theme as any);
      }
      toast({ title: 'Preferences updated', description: 'Your preferences have been saved.' });
    },
    onError: () => {
      toast({
        title: 'Update failed',
        description: 'Could not update preferences.',
        variant: 'destructive'
      });
    }
  });

  const handlePrefChange = (key: string, value: any) => {
    setPrefsFormData((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSaveAll = async () => {
    try {
      // 1. Update Profile Information
      await updateMutation.mutateAsync({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        profileMetadata: {
          ...userData.profileMetadata,
          bio: formData.bio,
          address: formData.address,
          skills: formData.skills,
          interests: formData.interests,
          availability: formData.availability
        }
      });

      // 2. Update Preferences
      await preferencesMutation.mutateAsync(prefsFormData);

      // Note: Individual success toasts are handled by mutations,
      // but we could add a final summary toast if desired.
    } catch (error) {
      // Errors are handled by individual mutation onError handlers
      console.error('Unified save error:', error);
    }
  };

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
    skills: [] as string[],
    interests: [] as string[],
    availability: ''
  });

  useEffect(() => {
    const raw = (meResponse as any)?.profile ?? (meResponse as any)?.data ?? (meResponse as any) ?? null;
    if (raw) {
      const u = {
        ...raw,
        profileMetadata: raw.profileMetadata || raw.profile_metadata || {}
      };
      setFormData({
        firstName: u.firstName || u.first_name || '',
        lastName: u.lastName || u.last_name || '',
        email: u.email || '',
        phone: u.phone || '',
        bio: u.profileMetadata?.bio || u.bio || '',
        address: u.profileMetadata?.address || '',
        skills: Array.isArray(u.profileMetadata?.skills) ? u.profileMetadata.skills : [],
        interests: Array.isArray(u.profileMetadata?.interests) ? u.profileMetadata.interests : [],
        availability: u.profileMetadata?.availability || ''
      });
      // Force re-render of completion percentage
      console.log('Profile data updated, form synced');
    }
  }, [meResponse]);

  // Normalize user payload early so hooks can be declared in stable order
  const userDataEarly = (meResponse as any)?.profile ?? (meResponse as any)?.data ?? (meResponse as any) ?? undefined;
  const userId = userDataEarly?.id ?? undefined;

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.updateVolunteerProfile(data),
    onSuccess: (updatedUser: any) => {
      // Refresh the session user in Zustand store
      if (updatedUser) {
        setUser(updatedUser);
      }

      // Invalidate both keys to ensure full UI consistency
      Promise.all([queryClient.invalidateQueries(['volunteer-profile']), queryClient.invalidateQueries(['me'])]).then(
        () => {
          // After the query refreshes, the form data will auto-sync via the useEffect
          // This ensures the UI shows the fresh data
        }
      );
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

  // Normalize userData for robust property access
  const userData = {
    ...meRaw,
    // Support both camelCase and snake_case
    firstName: meRaw.firstName || meRaw.first_name,
    lastName: meRaw.lastName || meRaw.last_name,
    profileMetadata: meRaw.profileMetadata || meRaw.profile_metadata || {},
    emailVerifiedAt: meRaw.emailVerifiedAt || meRaw.email_verified_at || meRaw.emailVerified
  };

  // Profile completion: required fields help volunteers understand next steps
  // Use ONLY userData (from server) to ensure fresh data after updates
  const completionCriteria = [
    { label: 'Phone Number', filled: !!userData.phone },
    { label: 'Address', filled: !!userData.profileMetadata?.address },
    {
      label: 'Skills',
      filled: Array.isArray(userData.profileMetadata?.skills) && userData.profileMetadata.skills.length > 0
    },
    {
      label: 'Availability',
      filled:
        !!userData.profileMetadata?.availability ||
        !!userData.profileMetadata?.preferred_time ||
        !!userData.profileMetadata?.preferred_days
    },
    { label: 'Email Verification', filled: !!userData.emailVerifiedAt },
    { label: 'Preferred Days', filled: prefsResponse?.preferences?.preferredDays?.length > 0 },
    { label: 'Max Hours per Week', filled: prefsResponse?.preferences?.maxHoursPerWeek > 0 }
  ];

  const _filledChecks = completionCriteria.filter((c) => c.filled).length;
  const profileCompletion = Math.round(((_filledChecks || 0) / completionCriteria.length) * 100);
  const missingFields = completionCriteria.filter((c) => !c.filled).map((c) => c.label);

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

  const paginatedShifts = upcomingShifts.slice((schedulePage - 1) * schedulePerPage, schedulePage * schedulePerPage);

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
    <div className="min-h-screen bg-background pb-12">
      {/* Header / Banner */}
      <div className="relative bg-gradient-to-b from-primary/10 via-background to-background pt-16 pb-32 px-4 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-500/20 rounded-full blur-[100px]" />
        </div>
        <div className="container mx-auto max-w-5xl relative z-10">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-8">
            <div className="relative group">
              <Avatar className="h-40 w-40 border-4 border-card shadow-2xl transition-transform group-hover:scale-[1.02]">
                <AvatarImage src={`${userData.profileImageUrl}?v=${avatarVersion}`} />
                <AvatarFallback className="bg-primary/10 text-primary text-5xl font-bold">
                  {userData.firstName?.[0]}
                  {userData.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              {profileCompletion < 100 && (
                <div className="absolute -top-2 -right-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg border-2 border-background animate-pulse">
                  {profileCompletion}%
                </div>
              )}
            </div>
            <div className="text-center md:text-left flex-1 space-y-2">
              <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2 flex flex-col md:flex-row items-center gap-3">
                <span>{userData.firstName || userData.first_name} {userData.lastName || userData.last_name}</span>
                {userData.isBackgroundChecked && (
                  <Badge variant="default" className="bg-emerald-500 text-white border-none px-2 py-0 h-6 flex items-center gap-1 shadow-lg shadow-emerald-500/20">
                    <CheckCircle2 className="h-3 w-3" /> Verified
                  </Badge>
                )}
              </h1>
              <p className="text-muted-foreground flex items-center gap-2 justify-center md:justify-start text-lg">
                <Shield className="h-5 w-5 text-primary" />
                <span className="font-medium">Volunteer Member</span>
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

              {/* Profile completion indicator */}
              <div className="mt-6 w-full md:w-3/4">
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-3 bg-muted/50 rounded-full overflow-hidden backdrop-blur-sm border border-border/50" aria-hidden>
                    <div
                      className="h-full bg-gradient-to-r from-primary via-primary shadow-[0_0_20px_rgba(var(--primary),0.3)] transition-all duration-1000 ease-out"
                      style={{ width: `${profileCompletion}%` }}
                    />
                  </div>
                  <div className="text-sm font-bold text-foreground">{profileCompletion}% Complete</div>
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
                            onClick={() => setSchedulePage((p) => Math.max(1, p - 1))}
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
                            onClick={() => setSchedulePage((p) => Math.min(totalPages, p + 1))}
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
                {profileCompletion < 100 && (
                  <Alert variant="warning" className="mb-6 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900/50">
                    <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between w-full gap-3">
                      <div>
                        <AlertTitle className="text-amber-800 dark:text-amber-300">Incomplete profile</AlertTitle>
                        <AlertDescription className="text-amber-700 dark:text-amber-400/80">
                          <p className="mb-2">Your profile is {profileCompletion}% complete. Finish the following fields to reach 100%:</p>
                          <div className="flex flex-wrap gap-2">
                            {missingFields.map(field => (
                              <Badge key={field} variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300 border-none transition-colors">
                                + {field}
                              </Badge>
                            ))}
                          </div>
                        </AlertDescription>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-40 h-2 bg-amber-200 dark:bg-amber-900/30 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 dark:bg-amber-600 transition-all duration-500 ease-out"
                            style={{ width: `${profileCompletion}%` }}
                          ></div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-white hover:bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-900/20 dark:hover:bg-amber-900/40 dark:border-amber-800 dark:text-amber-300 transition-colors"
                          onClick={() => setActiveTab('settings')}
                        >
                          Complete now
                        </Button>
                      </div>
                    </div>
                  </Alert>
                )}

                <div className="flex flex-col md:flex-row gap-8">
                  {/* Avatar Upload Section */}
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative group">
                      <Avatar className="h-40 w-40 border-4 border-card shadow-2xl transition-transform group-hover:scale-[1.02]">
                        <AvatarImage
                          src={`${userData.profileImageUrl || userData.profileMetadata?.avatar_url}?v=${avatarVersion}`}
                        />
                        <AvatarFallback className="bg-primary/10 text-primary text-5xl font-bold">
                          {userData.firstName?.[0]}
                          {userData.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-1 right-1 bg-primary text-white p-2.5 rounded-full shadow-lg hover:bg-primary/90 transition-all hover:scale-110 active:scale-95 z-10"
                        title="Change Avatar"
                      >
                        <Camera className="h-5 w-5" />
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;

                          if (file.size > 5 * 1024 * 1024) {
                            toast({
                              title: 'File too large',
                              description: 'Maximum file size is 5MB.',
                              variant: 'destructive' as any
                            });
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
                    <div className="text-center">
                      <h3 className="font-bold text-xl leading-tight">{userData.firstName} {userData.lastName}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{userData.email}</p>
                    </div>

                    {/* Role Card */}
                    <div className="w-full p-4 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent border border-primary/10 space-y-3">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
                        <span>Status</span>
                        <Badge variant="default" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none px-2 py-0 h-5">
                          {userData.isBackgroundChecked ? 'Verified' : 'Member'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Shield className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-bold">Volunteer</p>
                          <p className="text-[10px] text-muted-foreground uppercase font-medium">Role Type</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Main Form */}
                  <div className="flex-1 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 border rounded-2xl bg-background shadow-sm">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-foreground/80 font-medium">First name</Label>
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          className="bg-card/50 focus:bg-card transition-colors border-border/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-foreground/80 font-medium">Last name</Label>
                        <Input
                          id="lastName"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          className="bg-card/50 focus:bg-card transition-colors border-border/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-foreground/80 font-medium">
                          Email <span className="text-xs text-muted-foreground font-normal">(Read-only)</span>
                        </Label>
                        <Input id="email" value={formData.email} disabled className="bg-muted border-border/50 opacity-80" />
                        {userData.emailVerifiedAt && (
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1 font-medium italic">
                            <CheckCircle2 className="h-3 w-3" /> Email Verified
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-foreground/80 font-medium">Phone number {formData.phone ? '' : '*'}</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+1234567890"
                          className="bg-card/50 focus:bg-card transition-colors border-border/50"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-foreground/80 font-medium px-1">Address {formData.address ? '' : '*'}</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="123 Volunteer Lane, City"
                        className="bg-card/50 focus:bg-card transition-colors border-border/50 rounded-xl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio" className="text-foreground/80 font-medium px-1">Bio</Label>
                      <Textarea
                        id="bio"
                        rows={3}
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        placeholder="Tell us about yourself..."
                        className="bg-card/50 focus:bg-card transition-colors border-border/50 rounded-xl resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="skills" className="text-foreground/80 font-medium px-1">Skills {formData.skills.length > 0 ? '' : '*'}</Label>
                        <TagInput
                          id="skills"
                          placeholder="Add a skill and press Enter"
                          value={formData.skills}
                          onChange={(vals) => setFormData({ ...formData, skills: vals })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="interests" className="text-foreground/80 font-medium px-1">Interests</Label>
                        <TagInput
                          id="interests"
                          placeholder="Add an interest and press Enter"
                          value={formData.interests}
                          onChange={(vals) => setFormData({ ...formData, interests: vals })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="availability" className="text-foreground/80 font-medium px-1">General Availability</Label>
                      <Input
                        id="availability"
                        value={formData.availability}
                        onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                        placeholder="Weekends, Evenings, Mon-Fri 9-5..."
                        className="bg-card/50 focus:bg-card transition-colors border-border/50 rounded-xl"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 mt-4 border-t border-border/50">
                      <div className="space-y-2 p-4 rounded-xl bg-card/30 border border-border/30">
                        <Label className="text-muted-foreground font-semibold text-[10px] uppercase tracking-wider">Background Check</Label>
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "h-8 w-8 rounded-lg flex items-center justify-center transition-colors",
                            userData.isBackgroundChecked ? 'bg-emerald-500/10' : 'bg-muted'
                          )}>
                            <Shield className={cn(
                              "h-4 w-4",
                              userData.isBackgroundChecked ? 'text-emerald-500' : 'text-muted-foreground/50'
                            )} />
                          </div>
                          <span className="text-sm font-semibold">
                            {userData.isBackgroundChecked ? 'Verified' : 'Pending'}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2 p-4 rounded-xl bg-card/30 border border-border/30">
                        <Label className="text-muted-foreground font-semibold text-[10px] uppercase tracking-wider">Certified Volunteer</Label>
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "h-8 w-8 rounded-lg flex items-center justify-center transition-colors",
                            userData.isCertified ? 'bg-blue-500/10' : 'bg-muted'
                          )}>
                            <Award className={cn(
                              "h-4 w-4",
                              userData.isCertified ? 'text-blue-500' : 'text-muted-foreground/50'
                            )} />
                          </div>
                          <span className="text-sm font-semibold">{userData.isCertified ? 'Yes' : 'No'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Save Buttons Removed from here */}
                  </div>
                </div>

                <Separator className="my-8" />

                <div className="space-y-6 px-0 md:px-0">
                  <div>
                    <h3 className="text-lg font-medium">User Preferences</h3>
                    <p className="text-sm text-muted-foreground">
                      Manage your notifications, privacy, and app settings.
                    </p>
                  </div>

                  {/* Notification Preferences */}
                  <div className="space-y-4 pt-6 mt-6 border-t border-border/50">
                    <h4 className="font-bold text-foreground flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Bell className="h-4 w-4 text-primary" />
                      </div>
                      Notifications
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[
                        { id: 'emailNotifications', label: 'Email', desc: 'Receive updates via email' },
                        { id: 'smsNotifications', label: 'SMS', desc: 'Receive updates via SMS' },
                        { id: 'pushNotifications', label: 'Push', desc: 'Receive updates via device push' }
                      ].map(pref => (
                        <div key={pref.id} className="flex items-center justify-between p-4 border border-border/50 rounded-2xl bg-card/50 hover:bg-card transition-colors shadow-sm">
                          <div className="space-y-0.5">
                            <Label className="font-semibold">{pref.label}</Label>
                            <p className="text-[10px] text-muted-foreground">{pref.desc}</p>
                          </div>
                          <Switch
                            checked={(prefsFormData as any)[pref.id]}
                            onCheckedChange={(checked) => handlePrefChange(pref.id, checked)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Communication Preferences */}
                  <div className="space-y-4 pt-6 mt-6 border-t border-border/50">
                    <h4 className="font-bold text-foreground flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <MessageSquare className="h-4 w-4 text-primary" />
                      </div>
                      Communication
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[
                        { id: 'newsletterSubscription', label: 'Newsletter', desc: 'Subscribe to our newsletter' },
                        { id: 'eventReminders', label: 'Event Reminders', desc: 'Reminders for events you joined' },
                        { id: 'shiftReminders', label: 'Shift Reminders', desc: 'Reminders for your volunteer shifts' },
                        { id: 'opportunityAlerts', label: 'Opportunity Alerts', desc: 'Alerts for matching opportunities' }
                      ].map(pref => (
                        <div key={pref.id} className="flex items-center justify-between p-4 border border-border/50 rounded-2xl bg-card/50 hover:bg-card transition-colors shadow-sm">
                          <div className="space-y-0.5">
                            <Label className="font-semibold">{pref.label}</Label>
                            <p className="text-[10px] text-muted-foreground">{pref.desc}</p>
                          </div>
                          <Switch
                            checked={(prefsFormData as any)[pref.id]}
                            onCheckedChange={(checked) => handlePrefChange(pref.id, checked)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Privacy Preferences */}
                  <div className="space-y-4 pt-6 mt-6 border-t border-border/50">
                    <h4 className="font-bold text-foreground flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Shield className="h-4 w-4 text-primary" />
                      </div>
                      Privacy
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[
                        { id: 'profilePublic', label: 'Public Profile', desc: 'Allow others to see your profile' },
                        { id: 'showEmail', label: 'Show Email', desc: 'Display email in public profile' },
                        { id: 'showPhone', label: 'Show Phone', desc: 'Display phone in public profile' }
                      ].map(pref => (
                        <div key={pref.id} className="flex items-center justify-between p-4 border border-border/50 rounded-2xl bg-card/50 hover:bg-card transition-colors shadow-sm">
                          <div className="space-y-0.5">
                            <Label className="font-semibold">{pref.label}</Label>
                            <p className="text-[10px] text-muted-foreground">{pref.desc}</p>
                          </div>
                          <Switch
                            checked={(prefsFormData as any)[pref.id]}
                            onCheckedChange={(checked) => handlePrefChange(pref.id, checked)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Availability Preferences */}
                  <div className="space-y-4 pt-6 mt-6 border-t border-border/50">
                    <h4 className="font-bold text-foreground flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <CalendarClock className="h-4 w-4 text-primary" />
                      </div>
                      Availability & Commitment
                    </h4>
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold px-1">Preferred Days</Label>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 p-4 border border-border/50 rounded-2xl bg-card/30">
                          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                            <div key={day} className="flex items-center space-x-2 bg-background/50 p-2 rounded-lg border border-border/30 hover:border-primary/30 transition-colors">
                              <Checkbox
                                id={`day-${day}`}
                                checked={(prefsFormData.preferredDays || []).includes(day.toLowerCase())}
                                onCheckedChange={(checked) => {
                                  const lowerDay = day.toLowerCase();
                                  const currentDays = prefsFormData.preferredDays || [];
                                  if (checked) {
                                    handlePrefChange('preferredDays', [...currentDays, lowerDay]);
                                  } else {
                                    handlePrefChange(
                                      'preferredDays',
                                      currentDays.filter((d: string) => d !== lowerDay)
                                    );
                                  }
                                }}
                              />
                              <label
                                htmlFor={`day-${day}`}
                                className="text-xs font-medium leading-none cursor-pointer"
                              >
                                {day.substring(0, 3)}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold px-1">Preferred Time of Day</Label>
                          <Select
                            value={prefsFormData.preferredTime}
                            onValueChange={(value) => handlePrefChange('preferredTime', value)}
                          >
                            <SelectTrigger className="bg-card/50 border-border/50 rounded-xl">
                              <SelectValue placeholder="Select Preferred Time" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              <SelectItem value="morning">Morning (8AM - 12PM)</SelectItem>
                              <SelectItem value="afternoon">Afternoon (12PM - 5PM)</SelectItem>
                              <SelectItem value="evening">Evening (5PM - 9PM)</SelectItem>
                              <SelectItem value="flexible">Flexible / Any Time</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold px-1">Max Hours per Week</Label>
                          <Input
                            type="number"
                            min={1}
                            max={168}
                            value={prefsFormData.maxHoursPerWeek}
                            onChange={(e) => handlePrefChange('maxHoursPerWeek', parseInt(e.target.value) || 0)}
                            className="bg-card/50 border-border/50 rounded-xl"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* App Settings */}
                  <div className="space-y-4 pt-6 mt-6 border-t border-border/50">
                    <h4 className="font-bold text-foreground flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Settings className="h-4 w-4 text-primary" />
                      </div>
                      App Settings
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold px-1">Language</Label>
                        <Select
                          value={prefsFormData.language}
                          onValueChange={(value) => handlePrefChange('language', value)}
                        >
                          <SelectTrigger className="bg-card/50 border-border/50 rounded-xl">
                            <SelectValue placeholder="Select Language" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="ar">Arabic</SelectItem>
                            <SelectItem value="fr">French</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold px-1">Timezone</Label>
                        <Select
                          value={prefsFormData.timezone}
                          onValueChange={(value) => handlePrefChange('timezone', value)}
                        >
                          <SelectTrigger className="bg-card/50 border-border/50 rounded-xl">
                            <SelectValue placeholder="Select Timezone" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="UTC">UTC</SelectItem>
                            <SelectItem value="GMT">GMT</SelectItem>
                            <SelectItem value="Australia/Sydney">AEST (Sydney)</SelectItem>
                            <SelectItem value="Australia/Melbourne">AEST (Melbourne)</SelectItem>
                            <SelectItem value="Australia/Perth">AWST (Perth)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold px-1">Theme</Label>
                        <Select value={prefsFormData.theme || 'auto'} onValueChange={(value) => handlePrefChange('theme', value)}>
                          <SelectTrigger className="bg-card/50 border-border/50 rounded-xl">
                            <SelectValue placeholder="Select Theme" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="light">Light</SelectItem>
                            <SelectItem value="dark">Dark</SelectItem>
                            <SelectItem value="auto">System Default</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-8" />

                  <div className="flex justify-end gap-4 p-6 bg-muted/30 rounded-2xl border border-border/50 shadow-inner">
                    <Button
                      variant="outline"
                      className="rounded-xl px-8"
                      onClick={() => {
                        queryClient.invalidateQueries(['volunteer-profile']);
                        queryClient.invalidateQueries(['user-preferences']);
                        toast({
                          title: 'Changes discarded',
                          description: 'Your settings have been reset to the last saved state.'
                        });
                      }}
                      disabled={updateMutation.isLoading || preferencesMutation.isLoading}
                    >
                      Discard Changes
                    </Button>
                    <Button
                      onClick={handleSaveAll}
                      disabled={updateMutation.isLoading || preferencesMutation.isLoading}
                      className="min-w-[150px] rounded-xl px-8 shadow-lg shadow-primary/20"
                    >
                      {updateMutation.isLoading || preferencesMutation.isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        'Save All Changes'
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-destructive/10 dark:bg-destructive/5 border-t border-destructive/20 p-8 flex flex-col md:flex-row justify-between items-center mt-8 rounded-b-3xl gap-4">
                <div className="text-center md:text-left">
                  <h4 className="text-destructive font-bold text-lg">Danger Zone</h4>
                  <p className="text-sm text-destructive/70 max-w-sm">
                    Manage your account security and session. Sign out of your account on this device.
                  </p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                  <Button
                    variant="outline"
                    className="border-destructive/20 text-destructive hover:bg-destructive/10 rounded-xl flex-1 md:flex-none"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4 mr-2" /> Sign Out
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
