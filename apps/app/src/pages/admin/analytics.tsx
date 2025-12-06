import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function AdminAnalytics() {
  const { data: dashboard, isLoading: loadingDash } = useQuery(['admin', 'dashboard'], () => api.getAdminDashboard());
  const { data: analytics } = useQuery(['admin', 'analytics'], () => api.getAdminAnalytics({ range: '6months' }));

  const dash = (dashboard as any) ?? {};

  // Normalize analytics data to [{ label, value }] for the chart
  const chartData = useMemo(() => {
    if (!analytics) return [] as any[];
    // server might return array or wrapper
    const raw = Array.isArray(analytics) ? analytics : (analytics?.data ?? analytics);
    if (!Array.isArray(raw)) return [] as any[];
    // try to map common shapes
    return raw.map((r: any) => ({
      month: r.month || r.name || r.label || String(r.date ?? ''),
      users: Number(r.users ?? r.user_count ?? r.activeUsers ?? r.value ?? 0),
      hours: Number(r.hours ?? r.totalHours ?? r.value ?? 0)
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
            {loadingDash ? '—' : (dash.totalUsers ?? dash.users ?? '—')}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Active Volunteers</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{loadingDash ? '—' : (dash.activeVolunteers ?? '—')}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Events Completed</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">
            {loadingDash ? '—' : (dash.eventsCompleted ?? dash.eventCompletion ?? '—')}
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
