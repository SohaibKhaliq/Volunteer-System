import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from '@/components/atoms/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, Clock, Users, ClipboardCheck } from 'lucide-react';

interface EventItem {
  id: number;
  title: string;
  startAt?: string;
}

interface ShiftAssignmentAttendance {
  id: number;
  shiftId: number;
  userId: number;
  status?: string;
  checkedInAt?: string | null;
  checkedOutAt?: string | null;
  hours?: number | null;
  user?: {
    id: number;
    firstName?: string;
    lastName?: string;
    email?: string;
    avatar?: string;
  };
  shift?: {
    id: number;
    title?: string;
    eventId?: number;
  };
}

export default function OrganizationAttendances() {
  const queryClient = useQueryClient();
  const [selectedEvent, setSelectedEvent] = useState<string>('');

  // Fetch Events for filter
  const { data: events } = useQuery({
    queryKey: ['organizationEvents'],
    queryFn: () => api.listOrganizationEvents()
  });

  // Fetch Shift Assignment check-ins (scoped to org, optionally filtered by event)
  const { data: attendances, isLoading } = useQuery({
    queryKey: ['organizationAttendances', selectedEvent],
    queryFn: () =>
      api.listShiftAssignments({
        scope: 'organization',
        event_id: selectedEvent || undefined
      })
  });

  const formatDuration = (checkIn?: string | null, checkOut?: string | null): string => {
    if (!checkIn) return '-';
    if (!checkOut) return 'Active';
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const hours = Math.round(((end.getTime() - start.getTime()) / (1000 * 60 * 60)) * 10) / 10;
    return `${hours} hrs`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const attendancesList: ShiftAssignmentAttendance[] = (
    Array.isArray(attendances) ? attendances : (attendances as any)?.data || []
  ) as any;

  const eventsList: EventItem[] = (Array.isArray(events) ? events : (events as any)?.data || []) as any;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Attendance Tracking</h2>
          <p className="text-muted-foreground">Track volunteer check-ins and check-outs for your events.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendancesList.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Currently Active</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {attendancesList.filter((a) => a.checkedInAt && !a.checkedOutAt).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Checked In</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendancesList.filter((a) => a.checkedInAt).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendancesList.filter((a) => a.checkedOutAt).length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={selectedEvent} onValueChange={setSelectedEvent}>
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Filter by event" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Events</SelectItem>
            {eventsList
              .filter((ev) => ev?.id)
              .map((ev) => (
                <SelectItem key={ev.id} value={ev.id.toString()}>
                  {ev.title}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {/* Attendances Table */}
      {attendancesList.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ClipboardCheck className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Attendances Yet</h3>
            <p className="text-muted-foreground mb-4">Volunteers will appear here when they check in.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Attendance Records ({attendancesList.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Volunteer</TableHead>
                  <TableHead>Shift</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Check-out</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendancesList.map((attendance) => (
                  <TableRow key={attendance.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={attendance.user?.avatar} />
                          <AvatarFallback>
                            {attendance.user?.firstName?.[0] || attendance.user?.email?.[0]?.toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {attendance.user?.firstName
                              ? `${attendance.user.firstName} ${attendance.user.lastName || ''}`
                              : attendance.user?.email || `User #${attendance.userId}`}
                          </div>
                          {attendance.user?.firstName && (
                            <div className="text-xs text-muted-foreground">{attendance.user.email}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{attendance.shift?.title || `Shift #${attendance.shiftId}`}</TableCell>
                    <TableCell>
                      {attendance.checkedInAt ? (
                        <>
                          <div className="text-sm">{new Date(attendance.checkedInAt).toLocaleDateString()}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(attendance.checkedInAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {attendance.checkedOutAt ? (
                        <>
                          <div className="text-sm">{new Date(attendance.checkedOutAt).toLocaleDateString()}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(attendance.checkedOutAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{formatDuration(attendance.checkedInAt, attendance.checkedOutAt)}</TableCell>
                    <TableCell>
                      {attendance.checkedOutAt ? (
                        <Badge className="bg-green-500">Completed</Badge>
                      ) : attendance.checkedInAt ? (
                        <Badge className="bg-blue-500">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Assigned</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
