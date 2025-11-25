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
    queryFn: api.getOrganizationDashboardStats
  });

  // Fetch additional data used on the dashboard
  const { data: events } = useQuery({
    queryKey: ['organizationEvents'],
    queryFn: api.listOrganizationEvents
  });
  const { data: volunteers } = useQuery({
    queryKey: ['organizationVolunteers'],
    queryFn: api.listOrganizationVolunteers
  });
  const { data: compliance } = useQuery({
    queryKey: ['organizationComplianceStats'],
    queryFn: api.getOrganizationComplianceStats
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

  // Build small chart dataset from events grouped by date
  // build a simple chart dataset from the first few events
  type EventItem = { startAt?: string | number; assigned_volunteers?: number; title?: string };
  const chartData = Array.isArray(events)
    ? (events as EventItem[]).slice(0, 8).map((ev) => ({
        date: new Date(String(ev.startAt)).toLocaleDateString(),
        attendees: Number(ev.assigned_volunteers ?? 0)
      }))
    : [];

  type RecentItem = { type: 'event' | 'volunteer'; text: string; when?: string };
  const recentActivity: RecentItem[] = [];
  if (Array.isArray(events)) {
    for (const e of events.slice(0, 5)) {
      recentActivity.push({ type: 'event', text: `Event: ${e.title}`, when: e.startAt });
    }
  }
  type VolunteerItem = {
    user?: { first_name?: string; firstName?: string; email?: string };
    createdAt?: string;
    created_at?: string;
  };
  if (Array.isArray(volunteers)) {
    for (const v of (volunteers as VolunteerItem[]).slice(0, 5)) {
      recentActivity.push({
        type: 'volunteer',
        text: `Volunteer: ${v.user?.first_name || v.user?.firstName || v.user?.email}`,
        when: v.createdAt || v.created_at
      });
    }
  }

  // use compliance in UI to avoid unused var
  type ComplianceStats = { compliantVolunteers?: number; pendingDocuments?: number; expiringSoon?: number };
  const pendingDocuments = (compliance as ComplianceStats)?.pendingDocuments ?? null;

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
                    <XAxis dataKey="date" hide />
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
              <div className="flex items-center">
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">Sarah Ahmed joined &quot;Beach Cleanup&quot;</p>
                  <p className="text-sm text-muted-foreground">2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">New volunteer application: John Doe</p>
                  <p className="text-sm text-muted-foreground">1 hour ago</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">Compliance document expiring soon</p>
                  <p className="text-sm text-muted-foreground">5 hours ago</p>
                </div>
              </div>
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
              <p className="text-blue-100 text-sm mb-4">Schedule a new volunteer activity</p>
              <Button size="sm" variant="secondary" className="text-blue-600">
                Create Now
              </Button>
            </div>
            <Calendar className="h-12 w-12 text-blue-200 opacity-50" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-none shadow-md">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg mb-1">Verify Hours</h3>
              <p className="text-purple-100 text-sm mb-4">12 pending hour logs</p>
              <Button size="sm" variant="secondary" className="text-purple-600">
                Review Logs
              </Button>
            </div>
            <Clock className="h-12 w-12 text-purple-200 opacity-50" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-none shadow-md">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg mb-1">Invite Volunteers</h3>
              <p className="text-green-100 text-sm mb-4">Grow your impact team</p>
              <Button size="sm" variant="secondary" className="text-green-600">
                Send Invites
              </Button>
            </div>
            <Users className="h-12 w-12 text-green-200 opacity-50" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
