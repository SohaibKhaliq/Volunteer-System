import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Calendar, Clock, Users } from 'lucide-react';
import { toast } from 'sonner';

interface ShiftItem {
    id: number;
    title?: string;
    start_at?: string;
    startAt?: string;
    end_at?: string;
    endAt?: string;
    capacity?: number;
    event?: { id?: number; title?: string; name?: string } | null;
    status?: string;
}

function formatDateTime(value?: string): string {
    if (!value) return '';
    const ts = Date.parse(String(value));
    if (Number.isNaN(ts)) return String(value);
    const date = new Date(ts);
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

function getShiftStatus(startAt?: string, endAt?: string): 'upcoming' | 'in-progress' | 'completed' {
    if (!startAt || !endAt) return 'upcoming';
    const now = Date.now();
    const start = Date.parse(startAt);
    const end = Date.parse(endAt);

    if (now < start) return 'upcoming';
    if (now > end) return 'completed';
    return 'in-progress';
}

export default function VolunteerShifts() {
    const [activeTab, setActiveTab] = useState('assigned');

    // Fetch assigned shifts
    const { data: assignmentsRaw, isLoading: loadingAssignments } = useQuery({
        queryKey: ['myShiftAssignments'],
        queryFn: () => api.listShiftAssignments({})
    });

    // Fetch available shifts
    const { data: availableShiftsRaw, isLoading: loadingAvailable } = useQuery({
        queryKey: ['availableShifts'],
        queryFn: () => api.listShifts({})
    });

    const assignments = (Array.isArray(assignmentsRaw) ? assignmentsRaw : (assignmentsRaw as any)?.data || []) as any[];
    const availableShifts = (Array.isArray(availableShiftsRaw) ? availableShiftsRaw : (availableShiftsRaw as any)?.data || []) as any[];

    // Extract shifts from assignments
    const myShifts = assignments.map((a: any) => ({
        ...a.shift,
        assignmentId: a.id,
        assignmentStatus: a.status
    }));

    // Filter available shifts (exclude already assigned)
    const assignedShiftIds = new Set(myShifts.map((s: any) => s.id));
    const openShifts = availableShifts.filter((s: any) => !assignedShiftIds.has(s.id));

    if (loadingAssignments && activeTab === 'assigned') {
        return (
            <div className="flex justify-center items-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">My Shifts</h2>
                <p className="text-muted-foreground">View your assigned shifts and browse available opportunities</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="assigned">
                        My Shifts ({myShifts.length})
                    </TabsTrigger>
                    <TabsTrigger value="available">
                        Available ({openShifts.length})
                    </TabsTrigger>
                </TabsList>

                {/* My Assigned Shifts */}
                <TabsContent value="assigned" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Assigned Shifts</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {myShifts.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>You don't have any assigned shifts yet</p>
                                    <p className="text-sm mt-2">Check the "Available" tab to find shifts</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Shift</TableHead>
                                            <TableHead>Event</TableHead>
                                            <TableHead>Start</TableHead>
                                            <TableHead>End</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {myShifts.map((shift: any) => {
                                            const status = getShiftStatus(shift.start_at || shift.startAt, shift.end_at || shift.endAt);
                                            return (
                                                <TableRow key={shift.id}>
                                                    <TableCell className="font-medium">
                                                        {shift.title || `Shift #${shift.id}`}
                                                    </TableCell>
                                                    <TableCell>{shift.event?.title || shift.event?.name || '—'}</TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                                            {formatDateTime(shift.start_at || shift.startAt)}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                                            {formatDateTime(shift.end_at || shift.endAt)}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant={
                                                                status === 'completed' ? 'secondary' :
                                                                    status === 'in-progress' ? 'default' :
                                                                        'outline'
                                                            }
                                                        >
                                                            {status === 'completed' ? 'Completed' :
                                                                status === 'in-progress' ? 'In Progress' :
                                                                    'Upcoming'}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Available Shifts */}
                <TabsContent value="available" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Available Shifts</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {loadingAvailable ? (
                                <div className="flex justify-center items-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : openShifts.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>No available shifts at the moment</p>
                                    <p className="text-sm mt-2">Check back later for new opportunities</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Shift</TableHead>
                                            <TableHead>Event</TableHead>
                                            <TableHead>Date & Time</TableHead>
                                            <TableHead>Capacity</TableHead>
                                            <TableHead>Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {openShifts.map((shift: any) => (
                                            <TableRow key={shift.id}>
                                                <TableCell className="font-medium">
                                                    {shift.title || `Shift #${shift.id}`}
                                                </TableCell>
                                                <TableCell>{shift.event?.title || shift.event?.name || '—'}</TableCell>
                                                <TableCell>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                                            {formatDateTime(shift.start_at || shift.startAt)}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            to {formatDateTime(shift.end_at || shift.endAt)}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary">
                                                        {shift.assignments?.length || 0} / {shift.capacity || 0}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        disabled={(shift.assignments?.length || 0) >= (shift.capacity || 0)}
                                                        onClick={() => toast.info('Please contact the organization to apply for this shift')}
                                                    >
                                                        {(shift.assignments?.length || 0) >= (shift.capacity || 0) ? 'Full' : 'Contact Org'}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
