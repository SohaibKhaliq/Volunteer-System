import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
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
  Line,
  AreaChart,
  Area,
  ComposedChart
} from 'recharts';
import { Download, Loader2, Users, Clock, Calendar, TrendingUp, FileText } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/atoms/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function OrganizationReports() {
  const [dateRange, setDateRange] = React.useState('last-6-months');

  // Fetch reports summary
  const { data: summaryData, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['reportsSummary', dateRange],
    queryFn: () => api.getReportsSummary()
  });

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

  // Fetch volunteer hours report
  const { data: hoursReportData, isLoading: isHoursLoading } = useQuery({
    queryKey: ['volunteerHoursReport', dateRange],
    queryFn: () => api.getVolunteerHoursReport({ groupBy: 'month' })
  });

  // Fetch opportunity performance
  const { data: performanceData, isLoading: isPerformanceLoading } = useQuery({
    queryKey: ['opportunityPerformance'],
    queryFn: () => api.getOpportunityPerformanceReport({ limit: 10 })
  });

  // Fetch retention data
  const { data: retentionData, isLoading: isRetentionLoading } = useQuery({
    queryKey: ['volunteerRetention'],
    queryFn: () => api.getVolunteerRetentionReport()
  });

  // Export handlers
  const handleExport = async (type: string) => {
    try {
      let response;
      let filename;

      switch (type) {
        case 'volunteers':
          response = await api.exportVolunteers();
          filename = 'volunteers.csv';
          break;
        case 'opportunities':
          response = await api.exportOpportunities();
          filename = 'opportunities.csv';
          break;
        case 'applications':
          response = await api.exportApplications();
          filename = 'applications.csv';
          break;
        case 'attendances':
          response = await api.exportAttendances();
          filename = 'attendances.csv';
          break;
        case 'hours':
          response = await api.exportHours();
          filename = 'volunteer-hours.csv';
          break;
        default:
          return;
      }

      // Create download link
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`${type} exported successfully`);
    } catch (error) {
      toast.error(`Failed to export ${type}`);
    }
  };

  const isLoading = isSummaryLoading || isAnalyticsLoading || isLeaderboardLoading || isHoursLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const summary = summaryData?.data || summaryData || {};
  const analytics = analyticsData?.data || analyticsData || {};
  const leaderboard = Array.isArray(leaderboardData?.data || leaderboardData) 
    ? (leaderboardData?.data || leaderboardData) 
    : [];
  const hoursReport = hoursReportData?.data || hoursReportData || {};
  const performance = performanceData?.data || performanceData || {};
  const retention = retentionData?.data || retentionData || {};

  // Transform hours trend for chart
  const hoursTrendData = Array.isArray(hoursReport.trend)
    ? hoursReport.trend.map((item: any) => ({
        period: item.period,
        volunteers: item.volunteer_count || 0,
        hours: Math.round(item.total_hours || 0)
      }))
    : [];

  // Transform status distribution for pie chart
  const statusData = Array.isArray(analytics.status_distribution)
    ? analytics.status_distribution.map((item: any) => ({
        name: item.status,
        value: parseInt(item.count, 10) || 0
      }))
    : [];

  // Application status pie data
  const applicationStatusData = summary.applications?.byStatus
    ? Object.entries(summary.applications.byStatus).map(([status, count]) => ({
        name: status,
        value: count as number
      }))
    : [];

  // Retention cohort data
  const cohortData = Array.isArray(retention.cohorts)
    ? retention.cohorts.map((c: any) => ({
        month: c.month,
        size: c.cohortSize,
        active: c.stillActive,
        retention: c.retentionRate
      }))
    : [];

  // Performance data for chart
  const performanceChartData = Array.isArray(performance.opportunities)
    ? performance.opportunities.slice(0, 8).map((o: any) => ({
        name: o.title?.substring(0, 15) + (o.title?.length > 15 ? '...' : ''),
        fillRate: o.fillRate || 0,
        showUpRate: o.showUpRate || 0
      }))
    : [];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Reports & Analytics</h2>
          <p className="text-muted-foreground">Comprehensive insights into your organization's impact and performance.</p>
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('volunteers')}>
                <Users className="h-4 w-4 mr-2" />
                Export Volunteers
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('opportunities')}>
                <Calendar className="h-4 w-4 mr-2" />
                Export Opportunities
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('applications')}>
                <FileText className="h-4 w-4 mr-2" />
                Export Applications
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('attendances')}>
                <Clock className="h-4 w-4 mr-2" />
                Export Attendances
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('hours')}>
                <TrendingUp className="h-4 w-4 mr-2" />
                Export Volunteer Hours
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Volunteers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.volunteers?.total || analytics.total_volunteers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {summary.volunteers?.active || analytics.active_volunteers || 0} active ({summary.volunteers?.retentionRate || analytics.retention_rate || 0}% retention)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.hours?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {summary.hours?.inPeriod || 0} in selected period
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Opportunities</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.opportunities?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {summary.opportunities?.upcoming || 0} upcoming
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Applications</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.applications?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {summary.attendances?.total || 0} attendances
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hours Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Volunteer Hours Trend</CardTitle>
            <CardDescription>Monthly hours contributed and active volunteers.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {hoursTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={hoursTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                    <Tooltip />
                    <Legend />
                    <Area yAxisId="left" type="monotone" dataKey="hours" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} name="Hours" />
                    <Line yAxisId="right" type="monotone" dataKey="volunteers" stroke="#82ca9d" name="Volunteers" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">No data available</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Volunteers */}
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

        {/* Application Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Application Status</CardTitle>
            <CardDescription>Distribution of application statuses.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {applicationStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={applicationStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {applicationStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">No application data</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Opportunity Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Opportunity Performance</CardTitle>
            <CardDescription>Fill rate and show-up rate by opportunity.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {performanceChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceChartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                    <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Legend />
                    <Bar dataKey="fillRate" fill="#8884d8" name="Fill Rate" />
                    <Bar dataKey="showUpRate" fill="#82ca9d" name="Show-up Rate" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">No opportunity data</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Volunteer Retention */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Volunteer Retention by Cohort</CardTitle>
            <CardDescription>Retention rate of volunteers grouped by join month.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {cohortData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={cohortData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="size" fill="#8884d8" name="Cohort Size" />
                    <Line yAxisId="right" type="monotone" dataKey="retention" stroke="#82ca9d" name="Retention %" />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">No retention data</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
