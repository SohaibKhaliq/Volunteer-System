import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { addDays, format, isSameDay } from 'date-fns';

export default function VolunteerSchedule() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  const { data: assignments, isLoading } = useQuery(['assignments'], () => api.listAssignments());

  // Extract dates for highlighting in calendar
  const shiftDates = assignments?.filter((a: any) => a.status === 'approved').map((a: any) => new Date(a.task.startAt)) || [];

  // Get shifts for selected date
  const selectedShifts = assignments?.filter((a: any) => {
    if (!a.task || a.status !== 'approved') return false;
    return date && isSameDay(new Date(a.task.startAt), date);
  }) || [];

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">My Schedule</h1>

      <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-8">
        <div className="space-y-4">
            <Card className="w-fit">
                <CardContent className="p-0">
                     <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        className="rounded-md border"
                        modifiers={{
                            booked: shiftDates
                        }}
                        modifiersStyles={{
                            booked: { fontWeight: 'bold', textDecoration: 'underline', color: 'var(--primary)' }
                        }}
                    />
                </CardContent>
            </Card>
            <div className="flex items-center text-sm text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-primary mr-2" />
                Has Shift
            </div>
        </div>

        <div>
             <Card>
                <CardHeader>
                    <CardTitle>
                        {date ? format(date, 'EEEE, MMMM do, yyyy') : 'Select a date'}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <Loader2 className="animate-spin" />
                    ) : selectedShifts.length === 0 ? (
                        <p className="text-muted-foreground">No shifts scheduled for this day.</p>
                    ) : (
                        <div className="space-y-4">
                            {selectedShifts.map((shift: any) => (
                                <div key={shift.id} className="border p-4 rounded-lg flex justify-between items-center">
                                    <div>
                                        <h3 className="font-semibold">{shift.task?.title}</h3>
                                        <p className="text-sm text-muted-foreground">{shift.task?.event?.title}</p>
                                        <p className="text-sm mt-1">
                                            {format(new Date(shift.task.startAt), 'h:mm a')} - {format(new Date(shift.task.endAt), 'h:mm a')}
                                        </p>
                                    </div>
                                    <Badge>{shift.status}</Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
             </Card>
        </div>
      </div>
    </div>
  );
}
