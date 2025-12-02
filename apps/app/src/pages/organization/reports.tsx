import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { Download, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function OrganizationReports() {
  const [dateRange, setDateRange] = React.useState('last-6-months');

  // Fetch analytics data
  const { data: analyticsData, isLoading: isAnalyticsLoading } = useQuery({
    queryKey: ['volunteerAnalytics'],
    queryFn: () => api.getVolunteerAnalytics()
  });

  // Fetch leaderboard
  const { data: leaderboardData, isLoading: isLeaderboardLoading } = useQuery({
    queryKey: ['volunteerLeaderboard'],
    queryFn: () => api.getVolunteerLeaderboard({ metric: 'hours', limit: 5 })
  });

  // Fetch trends
  const { data: trendsData, isLoading: isTrendsLoading } = useQuery({
    queryKey: ['volunteerTrends', dateRange],
    queryFn: () => api.getVolunteerTrends({ interval: 'month' })
  });

  if (isAnalyticsLoading || isLeaderboardLoading || isTrendsLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const analytics = analyticsData || {};
  const leaderboard = Array.isArray(leaderboardData) ? leaderboardData : [];
  const trends = trendsData || {};

  // Transform hours trend for chart
  const hoursTrendData = Array.isArray(trends.hours_trend)
    ? trends.hours_trend.map((item: any) => ({
        month: new Date(item.period).toLocaleDateString('en-US', { month: 'short' }),
        volunteers: item.volunteer_count || 0,
        hours: item.total_hours || 0
      }))
    : [];

  // Transform status distribution for pie chart
  const statusData = Array.isArray(analytics.status_distribution)
    ? analytics.status_distribution.map((item: any) => ({
        name: item.status,
        value: item.count
      }))
    : [];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Reports & Analytics</h2>
          <p className="text-muted-foreground">Insights into your organization's impact and performance.</p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last-month">Last Month</SelectItem>
              <SelectItem value="last-6-months">Last 6 Months</SelectItem>
              <SelectItem value="last-year">Last Year</SelectItem>
              <SelectItem value="all-time">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Volunteer Participation</CardTitle>
            <CardDescription>Monthly active volunteers and total hours contributed.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {hoursTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={hoursTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="volunteers" stroke="#8884d8" name="Volunteers" />
                    <Line yAxisId="right" type="monotone" dataKey="hours" stroke="#82ca9d" name="Hours" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">No data available</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Volunteers</CardTitle>
            <CardDescription>Leaderboard by hours contributed.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {leaderboard.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={leaderboard} margin={{ top: 20, right: 30, left: 80, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis
                      dataKey="first_name"
                      type="category"
                      width={80}
                      tickFormatter={(value, index) => {
                        const item = leaderboard[index];
                        return `${item.first_name} ${item.last_name?.charAt(0) || ''}`;
                      }}
                    />
                    <Tooltip />
                    <Bar dataKey="total_hours" fill="#8884d8" name="Hours" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">No volunteers yet</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Volunteer Status Distribution</CardTitle>
            <CardDescription>Breakdown of volunteer statuses.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">No status data</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Impact Summary</CardTitle>
            <CardDescription>Key performance indicators for the selected period.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-600">Total Volunteers</p>
                <h3 className="text-2xl font-bold text-blue-900">{analytics.total_volunteers || 0}</h3>
                <p className="text-xs text-blue-500">{analytics.retention_rate || 0}% retention rate</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm font-medium text-green-600">Active Volunteers</p>
                <h3 className="text-2xl font-bold text-green-900">{analytics.active_volunteers || 0}</h3>
                <p className="text-xs text-green-500">In last 30 days</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm font-medium text-purple-600">Avg Hours/Volunteer</p>
                <h3 className="text-2xl font-bold text-purple-900">{analytics.avg_hours_per_volunteer || 0}</h3>
                <p className="text-xs text-purple-500">Per volunteer</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <p className="text-sm font-medium text-orange-600">Growth</p>
                <h3 className="text-2xl font-bold text-orange-900">{analytics.volunteer_growth?.[0]?.count || 0}</h3>
                <p className="text-xs text-orange-500">New this month</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
