import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Loader2 } from 'lucide-react';

interface Props {
  orgId: number | null;
  open: boolean;
  onClose: () => void;
}

export default function OrganizationAnalytics({ orgId, open, onClose }: Props) {
  const { data, isLoading } = useQuery(
    ['orgAnalytics', orgId],
    () => (orgId ? api.getOrganizationAnalytics(orgId) : Promise.resolve(null)),
    {
      enabled: !!orgId && open
    }
  );

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Organization Analytics</DialogTitle>
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
                  <div className="text-2xl font-bold">{data?.volunteerCount ?? 0}</div>
                  <div className="text-sm text-muted-foreground">Retention: {data?.retentionRate ?? 0}%</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Active Volunteers</CardTitle>
                  <CardDescription>Volunteers in recent period</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data?.activeVolunteerCount ?? 0}</div>
                  <div className="text-sm text-muted-foreground">Events: {data?.eventCount ?? 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Total Hours</CardTitle>
                  <CardDescription>Hours contributed</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data?.totalHours ?? 0}</div>
                  <div className="text-sm text-muted-foreground">
                    Avg per volunteer: {data?.avgHoursPerVolunteer ?? 0}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Volunteer Growth</CardTitle>
                  <CardDescription>New volunteers by period</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
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
                  <div className="h-64">
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
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
