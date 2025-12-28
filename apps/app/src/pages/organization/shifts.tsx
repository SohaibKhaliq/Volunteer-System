import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface EventItem {
  id: number;
  title: string;
}

interface ShiftItem {
  id: number;
  title?: string;
  start_at?: string;
  startAt?: string;
  end_at?: string;
  endAt?: string;
  capacity?: number;
  event?: { id?: number; title?: string; name?: string } | null;
}

function formatDateTime(value?: string): string {
  if (!value) return '';
  const ts = Date.parse(String(value));
  if (Number.isNaN(ts)) return String(value);
  return new Date(ts).toLocaleString();
}

export default function OrganizationShifts() {
  const [selectedEvent, setSelectedEvent] = useState<string>('');

  const { data: eventsRaw } = useQuery({
    queryKey: ['organizationEvents'],
    queryFn: () => api.listOrganizationEvents()
  });

  const { data: shiftsRaw, isLoading } = useQuery({
    queryKey: ['organizationShifts', selectedEvent],
    queryFn: () =>
      api.listShifts({
        scope: 'organization',
        event_id: selectedEvent || undefined
      })
  });

  const events: EventItem[] = (Array.isArray(eventsRaw) ? eventsRaw : (eventsRaw as any)?.data || []) as any;
  const shifts: ShiftItem[] = (Array.isArray(shiftsRaw) ? shiftsRaw : (shiftsRaw as any)?.data || []) as any;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Shifts</h2>
        <p className="text-muted-foreground">View scheduled shifts for your events.</p>
      </div>

      <div className="flex gap-4">
        <Select value={selectedEvent} onValueChange={setSelectedEvent}>
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Filter by event" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Events</SelectItem>
            {events
              .filter((ev) => ev?.id)
              .map((ev) => (
                <SelectItem key={ev.id} value={ev.id.toString()}>
                  {ev.title}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Shifts ({shifts.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead>Capacity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shifts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No shifts found
                  </TableCell>
                </TableRow>
              ) : (
                shifts.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.title || `Shift #${s.id}`}</TableCell>
                    <TableCell>{s.event?.title ?? s.event?.name ?? '—'}</TableCell>
                    <TableCell>{formatDateTime(s.start_at ?? s.startAt)}</TableCell>
                    <TableCell>{formatDateTime(s.end_at ?? s.endAt)}</TableCell>
                    <TableCell>{s.capacity ?? 0}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
