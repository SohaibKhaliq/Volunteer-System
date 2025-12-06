// src/pages/admin/dashboard.tsx

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users, Calendar, AlertTriangle, TrendingUp } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
  CartesianGrid
} from 'recharts';
import { Badge } from '@/components/ui/badge';

export default function AdminDashboard() {
  const { data: overviewRes, isLoading: loadingOverview } = useQuery(['reports', 'overview'], () =>
    api.getReportsOverview({ range: '30days' })
  );
  const { data: hoursStats, isLoading: loadingHours } = useQuery(['reports', 'hours'], () =>
    api.getHoursStats({ range: '30days' })
  );
  const { data: eventStats, isLoading: loadingEvents } = useQuery(['reports', 'events'], () =>
    api.getEventStats({ range: '30days' })
  );
  const { data: chartDataRes, isLoading: loadingChart } = useQuery(['reports', 'chartData'], () => api.getChartData());
  const { data: tasksRaw } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => api.listTasks(),
    staleTime: 60 * 1000
  });

  const [topVols, setTopVols] = useState<Array<{ name: string; hours: number }>>([]);
  const { data: shiftsRaw } = useQuery(['shifts-overview'], () => api.listShifts(), { staleTime: 60 * 1000 });
  const { data: shiftAssignmentsRaw } = useQuery(['shift-assignments-overview'], () => api.listShiftAssignments(), {
    staleTime: 60 * 1000
  });

  useEffect(() => {
    const resolve = async () => {
      const tops = (hoursStats as any)?.topVolunteers ?? [];
      if (!Array.isArray(tops) || tops.length === 0) return setTopVols([]);

      try {
        const resolved = await Promise.all(
          tops.map(async (t: any) => {
            try {
              const res: any = await api.getUser(t.user_id);
              const u = res?.data ?? res;
              const name = u?.firstName || u?.first_name || u?.email || `User ${t.user_id}`;
              return { name, hours: t.totalHours || t.total_hours || 0 };
            } catch {
              return { name: `User ${t.user_id}`, hours: t.totalHours || t.total_hours || 0 };
            }
          })
        );

        setTopVols(resolved);
      } catch {
        setTopVols([]);
      }
    };

    resolve();
  }, [hoursStats]);

  const o = (overviewRes as any) ?? {};
  const stats = {
    volunteers: o?.volunteerParticipation?.total ?? 0,
    events: o?.eventCompletion?.total ?? 0,
    pendingTasks: Array.isArray(tasksRaw)
      ? tasksRaw.filter((t: any) => (t.status || '').toLowerCase() !== 'completed').length
      : 0,
    compliance: o?.complianceAdherence?.adherenceRate ?? 0
  };

  // Shift metrics
  const totalShifts = Array.isArray(shiftsRaw) ? shiftsRaw.length : (shiftsRaw?.data?.length ?? 0);
  const totalAssignments = Array.isArray(shiftAssignmentsRaw)
    ? shiftAssignmentsRaw.length
    : (shiftAssignmentsRaw?.data?.length ?? 0);

  const loading = loadingOverview || loadingHours || loadingEvents || loadingChart;

  const chartData = Array.isArray(chartDataRes)
    ? chartDataRes
    : (chartDataRes?.data ??
      chartDataRes ?? [
        { month: 'Jan', volunteers: 50, hours: 120 },
        { month: 'Feb', volunteers: 60, hours: 140 },
        { month: 'Mar', volunteers: 80, hours: 160 },
        { month: 'Apr', volunteers: 90, hours: 200 },
        { month: 'May', volunteers: 110, hours: 240 },
        { month: 'Jun', volunteers: 130, hours: 260 }
      ]);

  const eventDistribution = Array.isArray((eventStats as any)?.byStatus)
    ? (eventStats as any).byStatus.map((s: any) => ({
        name: s.status || 'Other',
        value: s.count || 0
      }))
    : chartData.slice(0, 3).map((d: any) => ({
        name: d.month,
        value: d.volunteers || d.hours || 0
      }));

  const chartColors = ['#4f46e5', '#0ea5e9', '#f97316', '#10b981'];

  const { data: activityRaw } = useQuery(['admin', 'activity'], () => api.getAdminActivity(), {
    staleTime: 60 * 1000
  });

  // Normalize remote activity into a safe array of {time, desc}
  const activity = Array.isArray(activityRaw?.data ?? activityRaw) ? (activityRaw?.data ?? activityRaw) : [];

  return (
    <div className="space-y-6" aria-busy={loading}>
      {/* HEADER */}
      <header className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Admin Dashboard</h2>
        <Badge variant="secondary">Live</Badge>
      </header>

      {/* METRICS */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between">
            <Users className="h-6 w-6 opacity-80" />
            <Badge variant="outline">Volunteers</Badge>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{loading ? '—' : stats.volunteers}</CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between">
            <Calendar className="h-6 w-6 opacity-80" />
            <Badge variant="outline">Events</Badge>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{loading ? '—' : stats.events}</CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between">
            <AlertTriangle className="h-6 w-6 opacity-80" />
            <Badge variant="outline">Pending Tasks</Badge>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{loading ? '—' : stats.pendingTasks}</CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between">
            <TrendingUp className="h-6 w-6 opacity-80" />
            <Badge variant="outline">Compliance</Badge>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{loading ? '—' : `${stats.compliance}%`}</CardContent>
        </Card>
      </div>

      {/* Shift metrics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Shifts</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{totalShifts ?? '—'}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Shift Assignments</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{totalAssignments ?? '—'}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Assigned vs Unassigned</CardTitle>
          </CardHeader>
          <CardContent className="text-lg">{totalAssignments ?? 0} assigned</CardContent>
        </Card>
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Volunteer Growth (6 months)</CardTitle>
          </CardHeader>
          <CardContent className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  labelFormatter={(label: any) => (typeof label === 'object' ? JSON.stringify(label) : String(label))}
                  formatter={(value: any) => (value == null ? '' : value)}
                />
                <Line type="monotone" dataKey="volunteers" stroke="#4f46e5" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Event Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-48 flex items-center justify-center">
            <ResponsiveContainer width="80%" height={150}>
              <PieChart>
                <Pie data={eventDistribution} dataKey="value" nameKey="name" outerRadius={60}>
                  {eventDistribution.map((_: any, idx: number) => (
                    <Cell key={idx} fill={chartColors[idx % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  labelFormatter={(label: any) => (typeof label === 'object' ? JSON.stringify(label) : String(label))}
                  formatter={(value: any) => (value == null ? '' : value)}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Last 6 Months - Hours Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  labelFormatter={(label: any) => (typeof label === 'object' ? JSON.stringify(label) : String(label))}
                  formatter={(value: any) => (value == null ? '' : value)}
                />
                <Bar dataKey="hours" fill="#0ea5e9" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {activity.map((a: any, i: number) => (
            <div key={i} className="flex justify-between text-sm text-muted-foreground">
              <span>{a.desc}</span>
              <span>{a.time}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Top Volunteers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Volunteers (Hours)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {(topVols.length ? topVols : [{ name: 'No data', hours: 0 }]).map((v, i) => (
            <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white font-medium">
                {i + 1}
              </div>
              <div>
                <p className="font-medium">{v.name}</p>
                <p className="text-xs text-muted-foreground">{v.hours} hrs</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
