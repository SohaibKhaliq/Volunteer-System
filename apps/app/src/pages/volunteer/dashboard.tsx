import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Clock, Award, Calendar as CalendarIcon, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function VolunteerDashboard() {
  const { data: hoursData, isLoading: hoursLoading } = useQuery(['hours'], () => api.listHours());
  const { data: assignments, isLoading: assignmentsLoading } = useQuery(['assignments'], () => api.listAssignments());

  // Calculate totals
  const totalHours = hoursData?.reduce((acc: number, curr: any) => acc + curr.hoursLogged, 0) || 0;
  const verifiedHours = hoursData?.filter((h: any) => h.verified).reduce((acc: number, curr: any) => acc + curr.hoursLogged, 0) || 0;

  // Get upcoming shifts (assignments that are approved and in future)
  // Note: Backend filtering would be better, doing frontend for now as per api limitations
  const upcomingShifts = assignments?.filter((a: any) => {
    // Assuming assignment has task/event populated
    if (!a.task || a.status !== 'approved') return false;
    const start = new Date(a.task.startAt);
    return start > new Date();
  }) || [];

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Volunteer Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Volunter Hours</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{hoursLoading ? "..." : totalHours.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground">{verifiedHours.toFixed(1)} verified</p>
            </CardContent>
        </Card>
         <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Shifts Completed</CardTitle>
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
             <CardContent>
                <div className="text-2xl font-bold">{assignmentsLoading ? "..." : assignments?.filter((a: any) => a.status === 'attended').length || 0}</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Impact Score</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
             <CardContent>
                <div className="text-2xl font-bold">{(totalHours * 10).toFixed(0)}</div>
                <p className="text-xs text-muted-foreground">Points earned</p>
            </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Shifts */}
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Upcoming Shifts</h2>
                <Button variant="link" asChild><Link to="/volunteer/schedule">View Calendar</Link></Button>
            </div>
            {assignmentsLoading ? (
                 <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
            ) : upcomingShifts.length === 0 ? (
                <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                        No upcoming shifts. <Link to="/events" className="underline">Find opportunities</Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {upcomingShifts.map((shift: any) => (
                        <Card key={shift.id}>
                            <CardHeader className="p-4 pb-2">
                                <CardTitle className="text-base">{shift.task?.title || 'Shift'}</CardTitle>
                                <CardDescription>{shift.task?.event?.title}</CardDescription>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                                <div className="text-sm flex flex-col gap-1 mt-2">
                                    <div className="flex items-center text-muted-foreground">
                                        <CalendarIcon className="h-3 w-3 mr-2" />
                                        {new Date(shift.task?.startAt).toLocaleString()}
                                    </div>
                                    <div className="flex items-center text-muted-foreground">
                                        <MapPin className="h-3 w-3 mr-2" />
                                        {shift.task?.event?.location || 'TBD'}
                                    </div>
                                </div>
                                <div className="mt-4 flex gap-2">
                                    <Button size="sm" variant="outline" asChild>
                                        <Link to={`/events/${shift.task?.eventId}/qr`}>Check-in Code</Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>

        {/* Badges / Certs (Placeholder) */}
        <div>
            <h2 className="text-xl font-semibold mb-4">Achievements</h2>
            <Card>
                <CardContent className="p-6">
                     <p className="text-sm text-muted-foreground mb-4">Complete more hours to unlock badges!</p>
                     <div className="flex gap-4">
                        {totalHours >= 10 && (
                             <div className="flex flex-col items-center">
                                <div className="h-16 w-16 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
                                    <Award className="h-8 w-8" />
                                </div>
                                <span className="text-xs font-medium mt-2">Bronze Volunteer</span>
                            </div>
                        )}
                        {totalHours >= 50 && (
                             <div className="flex flex-col items-center">
                                <div className="h-16 w-16 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
                                    <Award className="h-8 w-8" />
                                </div>
                                <span className="text-xs font-medium mt-2">Silver Volunteer</span>
                            </div>
                        )}
                        {totalHours < 10 && <p className="text-sm italic text-muted-foreground">Start volunteering to earn your first badge.</p>}
                     </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
