import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface Props {
  orgId: number | null;
  orgName?: string | null;
  open: boolean;
  onClose: () => void;
}

export default function OrganizationAnalytics({ orgId, orgName, open, onClose }: Props) {
  const [startDate, setStartDate] = React.useState<string | null>(null);
  const [endDate, setEndDate] = React.useState<string | null>(null);
  const [selectedRange, setSelectedRange] = React.useState<string>('last-6-months');
  // initialize default range when modal opens
  React.useEffect(() => {
    if (!open) return;
    const now = new Date();
    const s = new Date(now);
    s.setMonth(s.getMonth() - 6);
    const toISO = (d: Date) => d.toISOString().slice(0, 10);
    setStartDate(toISO(s));
    setEndDate(toISO(now));
    setSelectedRange('last-6-months');
  }, [open]);

  const { data, isLoading, refetch } = useQuery(
    ['orgAnalytics', orgId, startDate, endDate],
    () =>
      orgId
        ? api.getOrganizationAnalytics(orgId, {
            startDate: startDate ?? undefined,
            endDate: endDate ?? undefined
          })
        : Promise.resolve(null),
    {
      enabled: !!orgId && open
    }
  );

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-full p-6 max-h-[85vh] overflow-auto">
        <DialogHeader className="p-0 mb-4">
          <div className="flex items-start justify-between w-full gap-4">
            <div>
              <DialogTitle>Organization Analytics</DialogTitle>
              {orgName ? <div className="text-base font-medium text-muted-foreground mt-1">{orgName}</div> : null}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Select
                value={selectedRange}
                onValueChange={(v) => {
                  setSelectedRange(v);
                  const now = new Date();
                  if (v === 'all-time') {
                    setStartDate(null);
                    setEndDate(null);
                    return;
                  }
                  let s: Date | null = null;
                  if (v === 'last-30-days') s = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                  if (v === 'last-6-months') {
                    s = new Date(now);
                    s.setMonth(s.getMonth() - 6);
                  }
                  if (v === 'last-year') {
                    s = new Date(now);
                    s.setFullYear(s.getFullYear() - 1);
                  }
                  if (s) {
                    const toISO = (d: Date) => d.toISOString().slice(0, 10);
                    setStartDate(toISO(s));
                    setEndDate(toISO(now));
                  }
                }}
              >
                <SelectTrigger className="w-[160px] h-9">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last-30-days">Last 30 days</SelectItem>
                  <SelectItem value="last-6-months">Last 6 months</SelectItem>
                  <SelectItem value="last-year">Last year</SelectItem>
                  <SelectItem value="all-time">All time</SelectItem>
                </SelectContent>
              </Select>

              <Button size="sm" onClick={() => refetch()} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (!data) return;
                  const rows: string[] = [];
                  if (Array.isArray(data.top_volunteers)) {
                    rows.push('id,first_name,last_name,total_hours');
                    data.top_volunteers.forEach((v: any) => {
                      rows.push(
                        `${v.id || ''},"${(v.first_name || '').replace(/"/g, '""')}","${(v.last_name || '').replace(/"/g, '""')}",${v.total_hours || 0}`
                      );
                    });
                  }
                  const csv = rows.join('\n');
                  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${orgName ?? 'organization'}-top-volunteers.csv`;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  URL.revokeObjectURL(url);
                }}
                disabled={!data || !Array.isArray(data.top_volunteers) || data.top_volunteers.length === 0}
              >
                Export Volunteers CSV
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (!data) return;
                  const rows: string[] = [];
                  if (Array.isArray(data.volunteer_growth)) {
                    rows.push('period,count');
                    data.volunteer_growth.forEach((g: any) => {
                      rows.push(`${g.month || g.period || g.label || ''},${g.count || g.value || 0}`);
                    });
                  }
                  const csv = rows.join('\n');
                  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${orgName ?? 'organization'}-volunteer-growth.csv`;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  URL.revokeObjectURL(url);
                }}
                disabled={!data || !Array.isArray(data.volunteer_growth) || data.volunteer_growth.length === 0}
              >
                Export Growth CSV
              </Button>
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Total Volunteers</CardTitle>
                  <CardDescription>All-time volunteers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl lg:text-4xl font-extrabold">{data?.volunteerCount ?? 0}</div>
                  <div className="text-sm text-muted-foreground mt-2">
                    Retention: {Number(data?.retentionRate ?? 0).toFixed(0)}%
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Active Volunteers</CardTitle>
                  <CardDescription>Volunteers in recent period</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl lg:text-4xl font-extrabold">{data?.activeVolunteerCount ?? 0}</div>
                  <div className="text-sm text-muted-foreground mt-2">Events: {data?.eventCount ?? 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Total Hours</CardTitle>
                  <CardDescription>Hours contributed</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl lg:text-4xl font-extrabold">{data?.totalHours ?? 0}</div>
                  <div className="text-sm text-muted-foreground mt-2">
                    Avg per volunteer: {data?.avgHoursPerVolunteer ?? 0}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Volunteer Growth</CardTitle>
                  <CardDescription>New volunteers by period</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    {Array.isArray(data?.volunteer_growth) && data.volunteer_growth.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={data.volunteer_growth.map((d: any) => ({
                            period: d.month || d.period || d.label,
                            count: d.count || d.value || 0
                          }))}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="period" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="count" stroke="#8884d8" />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">No data</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Volunteers</CardTitle>
                  <CardDescription>Leaderboard by hours</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    {Array.isArray(data?.top_volunteers) && data.top_volunteers.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={data.top_volunteers}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="first_name" type="category" width={100} />
                          <Tooltip />
                          <Bar dataKey="total_hours" fill="#82ca9d" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">No volunteers</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        <DialogFooter>
          <div className="w-full flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
