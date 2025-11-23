import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from '@/components/atoms/use-toast';
import exportToCsv from '@/lib/exportCsv';
import { chartData } from '@/lib/mock/adminMock';
import { Button } from '@/components/ui/button';
import SkeletonCard from '@/components/atoms/skeleton-card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, TrendingUp, Users, Calendar, Clock, Award, BarChart3, PieChart, FileText } from 'lucide-react';

interface ReportData {
  volunteerParticipation: {
    total: number;
    active: number;
    inactive: number;
    trend: number;
  };
  eventCompletion: {
    total: number;
    completed: number;
    ongoing: number;
    cancelled: number;
    completionRate: number;
  };
  volunteerHours: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    trend: number;
  };
  organizationPerformance: {
    topPerformers: Array<{ name: string; score: number; events: number }>;
    averageScore: number;
  };
  complianceAdherence: {
    compliant: number;
    pending: number;
    expired: number;
    adherenceRate: number;
  };
  predictions: {
    volunteerDemand: {
      nextMonth: number;
      confidence: number;
    };
    noShowRate: number;
    eventSuccessRate: number;
  };
}

export default function AdminReports() {
  const [reportType, setReportType] = useState('overview');
  const [timeRange, setTimeRange] = useState('30days');
  const [exportFormat, setExportFormat] = useState('pdf');

  const { data: reportData, isLoading } = useQuery<ReportData>(
    ['reports', reportType, timeRange],
    () => api.getReports<ReportData>({ type: reportType, range: timeRange }),
    {
      suspense: false,
      retry: false,
      onError: (err: any) => {
        try {
          toast({ title: 'Unable to load reports', description: err?.message || 'Please try again' });
        } catch (e) {
          // ignore
        }
      }
    }
  );

  const handleExport = () => {
    // Basic client-side export for CSV using mock/report data
    if (exportFormat === 'csv') {
      if (reportData) {
        // Flatten top-level report data into key/value rows
        const rows: Record<string, any>[] = Object.keys(reportData).map((k) => ({
          key: k,
          value: JSON.stringify((reportData as any)[k])
        }));
        exportToCsv(`${reportType || 'report'}.csv`, rows);
      } else {
        // fallback: export example chart data
        exportToCsv('chart-data.csv', chartData as unknown as Record<string, any>[]);
      }
      return;
    }

    // For non-CSV formats we currently log and show a toast (mock)
    console.log(`Exporting as ${exportFormat}`);
    try {
      toast({ title: 'Export started', description: `Preparing ${exportFormat.toUpperCase()} export (mock)` });
    } catch (e) {
      // noop
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" aria-busy={true} role="status">
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Reports & Analytics</h2>
          <p className="text-muted-foreground">Comprehensive insights and data-driven analytics</p>
        </div>
        <div className="flex gap-2">
          <Select value={exportFormat} onValueChange={setExportFormat}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="excel">Excel</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center bg-white p-4 rounded-lg shadow-sm">
        <div className="flex gap-2 items-center">
          <span className="text-sm font-medium">Report Type:</span>
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">Overview</SelectItem>
              <SelectItem value="volunteers">Volunteer Participation</SelectItem>
              <SelectItem value="events">Event Completion</SelectItem>
              <SelectItem value="hours">Volunteer Hours</SelectItem>
              <SelectItem value="organizations">Organization Performance</SelectItem>
              <SelectItem value="compliance">Compliance Adherence</SelectItem>
              <SelectItem value="predictions">AI Predictions</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-sm font-medium">Time Range:</span>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="90days">Last 90 Days</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium opacity-90">Total Volunteers</div>
            <Users className="h-5 w-5 opacity-75" />
          </div>
          <div className="text-3xl font-bold">{reportData?.volunteerParticipation?.total || 0}</div>
          <div className="flex items-center gap-1 mt-2 text-sm">
            <TrendingUp className="h-4 w-4" />
            <span>+{reportData?.volunteerParticipation?.trend || 0}% this month</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium opacity-90">Event Completion</div>
            <Calendar className="h-5 w-5 opacity-75" />
          </div>
          <div className="text-3xl font-bold">{reportData?.eventCompletion?.completionRate || 0}%</div>
          <div className="text-sm mt-2 opacity-90">
            {reportData?.eventCompletion?.completed || 0} of {reportData?.eventCompletion?.total || 0} events
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium opacity-90">Volunteer Hours</div>
            <Clock className="h-5 w-5 opacity-75" />
          </div>
          <div className="text-3xl font-bold">{reportData?.volunteerHours?.total?.toLocaleString() || 0}</div>
          <div className="flex items-center gap-1 mt-2 text-sm">
            <TrendingUp className="h-4 w-4" />
            <span>+{reportData?.volunteerHours?.trend || 0}% vs last month</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium opacity-90">Compliance Rate</div>
            <Award className="h-5 w-5 opacity-75" />
          </div>
          <div className="text-3xl font-bold">{reportData?.complianceAdherence?.adherenceRate || 0}%</div>
          <div className="text-sm mt-2 opacity-90">
            {reportData?.complianceAdherence?.expired || 0} expired documents
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Volunteer Participation Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Volunteer Participation</h3>
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Active Volunteers</span>
                <span className="font-medium">{reportData?.volunteerParticipation?.active || 0}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{
                    width: `${
                      ((reportData?.volunteerParticipation?.active || 0) /
                        (reportData?.volunteerParticipation?.total || 1)) *
                      100
                    }%`
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Inactive Volunteers</span>
                <span className="font-medium">{reportData?.volunteerParticipation?.inactive || 0}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gray-500 h-2 rounded-full"
                  style={{
                    width: `${
                      ((reportData?.volunteerParticipation?.inactive || 0) /
                        (reportData?.volunteerParticipation?.total || 1)) *
                      100
                    }%`
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Event Status Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Event Status</h3>
            <PieChart className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm">Completed</span>
              </div>
              <span className="font-medium">{reportData?.eventCompletion?.completed || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-sm">Ongoing</span>
              </div>
              <span className="font-medium">{reportData?.eventCompletion?.ongoing || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm">Cancelled</span>
              </div>
              <span className="font-medium">{reportData?.eventCompletion?.cancelled || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performing Organizations */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Top Performing Organizations</h3>
        <div className="space-y-3">
          {reportData?.organizationPerformance?.topPerformers?.map((org, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500 text-white font-bold">
                  {index + 1}
                </div>
                <div>
                  <div className="font-medium">{org.name}</div>
                  <div className="text-sm text-muted-foreground">{org.events} events</div>
                </div>
              </div>
              <Badge className="bg-green-500">Score: {org.score}</Badge>
            </div>
          )) || <div className="text-center py-8 text-muted-foreground">No organization data available</div>}
        </div>
      </div>

      {/* AI Predictions */}
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-lg border border-purple-200">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold">AI-Powered Predictions</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-sm text-muted-foreground mb-1">Predicted Volunteer Demand</div>
            <div className="text-2xl font-bold text-purple-600">
              {reportData?.predictions?.volunteerDemand?.nextMonth || 0}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Confidence: {reportData?.predictions?.volunteerDemand?.confidence || 0}%
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-sm text-muted-foreground mb-1">Expected No-Show Rate</div>
            <div className="text-2xl font-bold text-orange-600">{reportData?.predictions?.noShowRate || 0}%</div>
            <div className="text-xs text-muted-foreground mt-1">Based on historical data</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-sm text-muted-foreground mb-1">Event Success Rate</div>
            <div className="text-2xl font-bold text-green-600">{reportData?.predictions?.eventSuccessRate || 0}%</div>
            <div className="text-xs text-muted-foreground mt-1">Predicted for next month</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Quick Report Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button variant="outline" className="justify-start">
            <FileText className="h-4 w-4 mr-2" />
            Generate Volunteer Hours Report
          </Button>
          <Button variant="outline" className="justify-start">
            <FileText className="h-4 w-4 mr-2" />
            Generate Compliance Audit
          </Button>
          <Button variant="outline" className="justify-start">
            <FileText className="h-4 w-4 mr-2" />
            Generate Performance Summary
          </Button>
        </div>
      </div>
    </div>
  );
}
