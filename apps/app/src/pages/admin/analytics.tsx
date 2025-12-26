import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function AdminAnalytics() {
  const { data: dashboard, isLoading: loadingDash } = useQuery(['admin', 'dashboard'], () => api.getAdminDashboard());
  const { data: analytics } = useQuery(['admin', 'analytics'], () => api.getAdminAnalytics({ range: '6months' }));

  const dash = (dashboard as any) ?? {};

  // Normalize analytics data to [{ month, users, hours }] for the chart
  const chartData = useMemo(() => {
    if (!analytics) return [] as any[];

    // The backend returns { userGrowth: [], volunteerHours: [], ... }
    // We need to merge them by date
    const userGrowth = analytics.userGrowth || [];
    const volunteerHours = analytics.volunteerHours || [];

    const merged = new Map<string, { date: string; users: number; hours: number }>();

    // Process user growth
    userGrowth.forEach((item: any) => {
      // item.date is typically YYYY-MM-DDT... or YYYY-MM-DD
      const d = new Date(item.date);
      const key = d.toISOString().split('T')[0];
      if (!merged.has(key)) {
        merged.set(key, { date: key, users: 0, hours: 0 });
      }
      merged.get(key)!.users += Number(item.count || 0);
    });

    // Process hours
    volunteerHours.forEach((item: any) => {
      const d = new Date(item.date);
      const key = d.toISOString().split('T')[0];
      if (!merged.has(key)) {
        merged.set(key, { date: key, users: 0, hours: 0 });
      }
      merged.get(key)!.hours += Number(item.total_hours || 0);
    });
    
    // Convert map to array and sort by date
    return Array.from(merged.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(item => ({
        month: new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        users: item.users,
        hours: item.hours
      }));

  }, [analytics]);

  return (
    <div className="space-y-6 p-4 max-w-6xl mx-auto">
      <header className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Admin Analytics</h2>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Users</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">
            {loadingDash ? '—' : (dash.users?.total ?? dash.totalUsers ?? '—')}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Active Volunteers</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{loadingDash ? '—' : (dash.users?.active ?? dash.activeVolunteers ?? '—')}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Events Completed</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">
            {loadingDash ? '—' : (dash.events?.total ?? dash.eventsCompleted ?? dash.eventCompletion ?? '—')}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Hours (6mo)</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{loadingDash ? '—' : (dash.totalHours ?? '—')}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Overview (6 months)</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="users" stroke="#4f46e5" dot={false} />
              <Line type="monotone" dataKey="hours" stroke="#0ea5e9" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
