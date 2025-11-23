// src/pages/admin/dashboard.tsx
import React from 'react';
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
import {
  dashboardStats as stats,
  activityFeed as activity,
  topVolunteers,
  chartData,
  eventDistribution,
  chartColors
} from '@/lib/mock/adminMock';

export default function AdminDashboard() {
  // Using shared mock data from /src/lib/mock/adminMock.ts

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Admin Dashboard</h2>
        <Badge variant="secondary">Live Demo</Badge>
      </header>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between">
            <Users className="h-6 w-6 opacity-80" />
            <Badge variant="outline">Volunteers</Badge>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{stats.volunteers}</CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between">
            <Calendar className="h-6 w-6 opacity-80" />
            <Badge variant="outline">Events</Badge>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{stats.events}</CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between">
            <AlertTriangle className="h-6 w-6 opacity-80" />
            <Badge variant="outline">Pending Tasks</Badge>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{stats.pendingTasks}</CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between">
            <TrendingUp className="h-6 w-6 opacity-80" />
            <Badge variant="outline">Compliance</Badge>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{stats.compliance}%</CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Volunteer Growth (Line) */}
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
                <Tooltip />
                <Line type="monotone" dataKey="volunteers" stroke="#4f46e5" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Event Distribution (Pie) */}
        <Card>
          <CardHeader>
            <CardTitle>Event Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-48 flex items-center justify-center">
            <ResponsiveContainer width="80%" height={150}>
              <PieChart>
                <Pie data={eventDistribution} dataKey="value" nameKey="name" outerRadius={60} fill="#8884d8">
                  {eventDistribution.map((_, idx) => (
                    <Cell key={`cell-${idx}`} fill={chartColors[idx % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Hour Trends (Bar) */}
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
                <Tooltip />
                <Bar dataKey="hours" fill="#0ea5e9" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {activity.map((a, i) => (
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
          {topVolunteers.map((v, i) => (
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
