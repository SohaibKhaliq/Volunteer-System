import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Calendar, Clock, TrendingUp, Loader2, ArrowRight } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip } from 'recharts';

export default function OrganizationDashboard() {
  // Dashboard stats (fetched)
  const {
    data: stats,
    isLoading,
    error
  } = useQuery({
    queryKey: ['organizationDashboardStats'],
    queryFn: () => api.getOrganizationDashboardStats()
  });

  // Fetch additional data used on the dashboard
  const { data: events } = useQuery({
    queryKey: ['organizationEvents'],
    queryFn: () => api.listOrganizationEvents()
  });
  const { data: volunteers } = useQuery({
    queryKey: ['organizationVolunteers'],
    queryFn: () => api.listOrganizationVolunteers()
  });
  const { data: compliance } = useQuery({
    queryKey: ['organizationComplianceStats'],
    queryFn: () => api.getOrganizationComplianceStats()
  });

  // Fetch organization documents so we can generate recent compliance activity (expiries, uploads)
  const { data: documents } = useQuery({
    queryKey: ['organizationDocuments'],
    queryFn: () => api.listOrganizationDocuments()
  });

  const { data: pendingHoursData } = useQuery({
    queryKey: ['organizationPendingHours', 'count'],
    queryFn: () => api.getOrganizationPendingHours({ page: 1, limit: 1 })
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const displayStats = (stats as unknown as {
    activeVolunteers: number;
    upcomingEvents: number;
    totalHours: number;
    impactScore: number;
  }) || {
    activeVolunteers: 0,
    upcomingEvents: 0,
    totalHours: 0,
    impactScore: 0
  };

  // Build small chart dataset from events (use a reliable human-friendly label `dateLabel` for tooltip)
  type EventItem = {
    startAt?: string | number;
    start_at?: string | number;
    start_date?: string | number;
    assigned_volunteers?: number;
    volunteer_count?: number;
    title?: string;
    createdAt?: string;
    created_at?: string;
  };
  const eventsList = Array.isArray(events) ? (events as EventItem[]) : ((events as any)?.data ?? []);

  const chartData = eventsList
    .slice(0, 8)
    .map((ev: EventItem) => {
      // prefer explicit start date fields, fall back to created time
      const rawDate = ev.startAt ?? ev.start_at ?? ev.start_date ?? ev.createdAt ?? ev.created_at;
      const ts = rawDate ? Date.parse(String(rawDate)) : NaN;
      const dateLabel = !Number.isNaN(ts) ? new Date(ts).toLocaleDateString() : 'Unknown';
      const attendees = Number(ev.assigned_volunteers ?? ev.volunteer_count ?? 0);
      return { dateLabel, dateRaw: ts, attendees };
    })
    .filter((d: { dateLabel: string }) => d.dateLabel !== 'Unknown');

  type RecentItem = {
    id?: string | number;
    type: 'event' | 'volunteer' | 'compliance';
    text: string;
    when?: string;
    ts?: number;
  };

  const recentActivity: RecentItem[] = [];

  // Add latest events
  if (Array.isArray(eventsList)) {
    for (const e of eventsList.slice(0, 10)) {
      const raw =
        (e as any).startAt ??
        (e as any).start_at ??
        (e as any).start_date ??
        (e as any).createdAt ??
        (e as any).created_at;
      const ts = raw ? Date.parse(String(raw)) : Date.now();
      recentActivity.push({
        id: (e as any).id ?? (e as any).title,
        type: 'event',
        text: `Event created: ${e.title ?? 'Unnamed event'}`,
        when: raw ? new Date(ts).toLocaleString() : undefined,
        ts
      });
    }
  }
  type VolunteerItem = {
    user?: { first_name?: string; firstName?: string; email?: string };
    createdAt?: string;
    created_at?: string;
  };
  const volunteersList = Array.isArray(volunteers)
    ? (volunteers as VolunteerItem[])
    : ((volunteers as any)?.data ?? []);
  if (Array.isArray(volunteersList)) {
    for (const v of volunteersList.slice(0, 10)) {
      const raw = (v as any).createdAt ?? (v as any).created_at;
      const ts = raw ? Date.parse(String(raw)) : Date.now();
      recentActivity.push({
        id: (v as any).id ?? (v as any).user?.email,
        type: 'volunteer',
        text: `New volunteer: ${v.user?.first_name ?? v.user?.firstName ?? v.user?.email ?? 'Unknown'}`,
        when: raw ? new Date(ts).toLocaleString() : undefined,
        ts
      });
    }
  }

  // Add recent compliance changes (uploads, expiring soon)
  const docsList = Array.isArray(documents) ? (documents as any[]) : ((documents as any)?.data ?? []);
  if (Array.isArray(docsList)) {
    for (const d of docsList.slice(0, 20)) {
      // use created_at / uploadedAt / issued_at as event time; also check expires_at for expiring soon
      const createdRaw = d.createdAt ?? d.created_at ?? d.uploadedAt ?? d.uploaded_at;
      const createdTs = createdRaw ? Date.parse(String(createdRaw)) : NaN;

      // Expiring soon: within 30 days
      const expiresRaw = d.expiresAt ?? d.expires_at ?? d.expiration_date;
      const expiresTs = expiresRaw ? Date.parse(String(expiresRaw)) : NaN;
      if (!Number.isNaN(expiresTs)) {
        const now = Date.now();
        const thirtyDays = 30 * 24 * 60 * 60 * 1000;
        if (expiresTs > now && expiresTs - now <= thirtyDays) {
          recentActivity.push({
            id: d.id,
            type: 'compliance',
            text: `Compliance doc expiring soon: ${d.name ?? d.doc_type ?? 'document'}`,
            when: new Date(expiresTs).toLocaleString(),
            ts: expiresTs
          });
        }
      }

      // Newly uploaded
      if (!Number.isNaN(createdTs)) {
        recentActivity.push({
          id: d.id,
          type: 'compliance',
          text: `Compliance uploaded: ${d.name ?? d.doc_type ?? 'document'}`,
          when: new Date(createdTs).toLocaleString(),
          ts: createdTs
        });
      }
    }
  }

  // sort by timestamp desc and take up to 5 most recent
  recentActivity.sort((a: RecentItem, b: RecentItem) => (b.ts || 0) - (a.ts || 0));
  const recentSlice = recentActivity.slice(0, 5);

  // compute upcoming events and the next event label
  const nowTs = Date.now();
  const upcomingEvents = eventsList.filter((ev: EventItem) => {
    const raw = (ev as any).startAt ?? (ev as any).start_at ?? (ev as any).start_date;
    const ts = raw ? Date.parse(String(raw)) : NaN;
    return !Number.isNaN(ts) && ts > nowTs;
  });

  const upcomingEventsCount = upcomingEvents.length || (displayStats.upcomingEvents ?? 0);

  const nextEvent = upcomingEvents
    .map((ev: EventItem) => {
      const raw = (ev as any).startAt ?? (ev as any).start_at ?? (ev as any).start_date;
      const ts = raw ? Date.parse(String(raw)) : NaN;
      return { ev, ts };
    })
    .filter((x: { ts: number }) => !Number.isNaN(x.ts))
    .sort((a: { ts: number }, b: { ts: number }) => a.ts - b.ts)[0];

  const nextEventLabel = nextEvent
    ? `${nextEvent.ev.title ?? 'Untitled'} — ${new Date(nextEvent.ts).toLocaleString()}`
    : null;

  // use compliance in UI to avoid unused var
  type ComplianceStats = { compliantVolunteers?: number; pendingDocuments?: number; expiringSoon?: number };
  const pendingDocuments = (compliance as ComplianceStats)?.pendingDocuments ?? null;

  // compute pending hours count (paginated responses contain meta.total)
  const pendingHoursCount = (() => {
    if (!pendingHoursData) return 0;
    // axios wrapper sometimes returns full response / paginated object
    // check .data.meta.total or .meta.total or if it's an array
    // Support both shapes
    const paged = (pendingHoursData as any).data ?? pendingHoursData;
    return paged?.meta?.total ?? paged?.total ?? (Array.isArray(paged) ? paged.length : 0);
  })();

  // number of volunteers for invite card - prefer volunteers query, fallback to dashboard stats
  const volunteersCount = Array.isArray(volunteers) ? volunteers.length : (displayStats.activeVolunteers ?? 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s what&apos;s happening with your organization.
          </p>
        </div>
        <Button asChild>
          <Link to="/organization/events">
            Create Event <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Volunteers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayStats.activeVolunteers}</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayStats.upcomingEvents}</div>
            <p className="text-xs text-muted-foreground">Next event in 2 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayStats.totalHours}</div>
            <p className="text-xs text-muted-foreground">+8% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Impact Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayStats.impactScore}</div>
            <p className="text-xs text-muted-foreground">Top 10% of organizations</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <XAxis dataKey="dateLabel" hide />
                    <Tooltip />
                    <Area type="monotone" dataKey="attendees" stroke="#0ea5e9" fill="#0ea5e9" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-sm text-muted-foreground">No activity yet. Create an event to get started.</div>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest actions from your volunteers. {pendingDocuments ? `${pendingDocuments} pending docs` : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {recentSlice.length === 0 ? (
                <div className="text-sm text-muted-foreground">No recent activity</div>
              ) : (
                recentSlice.map((item) => (
                  <div className="flex items-center" key={`${item.type}-${item.id ?? item.ts ?? Math.random()}`}>
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none">{item.text}</p>
                      <p className="text-sm text-muted-foreground">{item.when ?? 'Just now'}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none shadow-md">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg mb-1">Create Event</h3>
              <p className="text-blue-100 text-sm mb-4">
                {upcomingEventsCount > 0
                  ? `${upcomingEventsCount} upcoming event${upcomingEventsCount === 1 ? '' : 's'}`
                  : 'No upcoming events — create one to get started'}
              </p>
              <Button asChild size="sm" variant="secondary" className="text-blue-600">
                <Link to="/organization/events">{nextEventLabel ? `Next: ${nextEventLabel}` : 'Create Now'}</Link>
              </Button>
            </div>
            <Calendar className="h-12 w-12 text-blue-200 opacity-50" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-none shadow-md">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg mb-1">Verify Hours</h3>
              <p className="text-purple-100 text-sm mb-4">
                {pendingHoursCount > 0
                  ? `${pendingHoursCount} pending hour log${pendingHoursCount === 1 ? '' : 's'}`
                  : 'No pending hour logs'}
              </p>
              <Button asChild size="sm" variant="secondary" className="text-purple-600">
                <Link to="/organization/hours-approval">Review Logs</Link>
              </Button>
            </div>
            <Clock className="h-12 w-12 text-purple-200 opacity-50" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-none shadow-md">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg mb-1">Invite Volunteers</h3>
              <p className="text-green-100 text-sm mb-4">{volunteersCount} volunteers — grow your impact team</p>
              <Button asChild size="sm" variant="secondary" className="text-green-600">
                <Link to="/organization/volunteers">Send Invites</Link>
              </Button>
            </div>
            <Users className="h-12 w-12 text-green-200 opacity-50" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
