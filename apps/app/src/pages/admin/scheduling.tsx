// src/pages/admin/scheduling.tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import SkeletonCard from '@/components/atoms/skeleton-card';

export default function AdminScheduling() {
  const { data, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: api.listTasks
  });

  const shifts = Array.isArray(data) ? data : [];

  return (
    <div className="space-y-6" aria-busy={isLoading}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Shift Scheduling
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 text-sm text-muted-foreground">
            Manage volunteer shifts and task assignments
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Volunteers</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <SkeletonCard />
                  </TableCell>
                </TableRow>
              ) : shifts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No shifts scheduled
                  </TableCell>
                </TableRow>
              ) : (
                shifts.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.title}</TableCell>
                    <TableCell>{s.event?.title || 'N/A'}</TableCell>
                    <TableCell>
                      {s.dueDate ? new Date(s.dueDate).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      {s.dueDate ? new Date(s.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </TableCell>
                    <TableCell>{s.assignments?.length || 0}</TableCell>
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
