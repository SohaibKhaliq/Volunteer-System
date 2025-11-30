import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from '@/components/atoms/use-toast';

export default function AdminShifts() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: shiftsRaw, isLoading } = useQuery(['shifts', search], () => api.listShifts({ search }));

  const shifts: any[] = Array.isArray(shiftsRaw) ? shiftsRaw : (shiftsRaw?.data ?? []);

  const deleteMutation = useMutation({
    mutationFn: api.deleteShift,
    onSuccess: () => queryClient.invalidateQueries(['shifts'])
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">Shifts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 mb-4">
            <Input
              placeholder="Search shifts"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64"
            />
            <div className="ml-auto">
              <Button onClick={() => (window.location.href = '/admin/shifts/new')}>
                <Plus className="h-4 w-4 mr-2" /> New Shift
              </Button>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                  </TableCell>
                </TableRow>
              ) : shifts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No shifts found
                  </TableCell>
                </TableRow>
              ) : (
                shifts.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.title}</TableCell>
                    <TableCell>{s.event?.name ?? s.event?.title ?? '—'}</TableCell>
                    <TableCell>{s.start_at ?? s.startAt ?? ''}</TableCell>
                    <TableCell>{s.end_at ?? s.endAt ?? ''}</TableCell>
                    <TableCell>{s.capacity ?? 0}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => (window.location.href = `/admin/shifts/${s.id}`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(s.id)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
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
