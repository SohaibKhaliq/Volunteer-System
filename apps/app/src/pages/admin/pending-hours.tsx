import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import SkeletonCard from '@/components/atoms/skeleton-card';
import { toast } from '@/components/atoms/use-toast';

export default function AdminPendingHours() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [perPage] = useState(25);

  const { data, isLoading } = useQuery(['hours', 'pending', page, perPage], () =>
    api.getMyVolunteerHours({ page, per_page: perPage, status: 'pending' })
  );

  const updateMutation = useMutation(({ id, status }: any) => api.updateHour(id, { status }), {
    onSuccess: () => {
      queryClient.invalidateQueries(['hours', 'pending']);
      queryClient.invalidateQueries(['admin', 'summary']);
      toast.success('Updated');
    },
    onError: () => toast.error('Update failed')
  });

  const bulkApprove = useMutation((ids: number[]) => api.bulkUpdateHours(ids, 'Approved'), {
    onSuccess: () => {
      queryClient.invalidateQueries(['hours', 'pending']);
      queryClient.invalidateQueries(['admin', 'summary']);
      toast.success('Approved selected');
    }
  });

  if (isLoading)
    return (
      <div className="p-4">
        <SkeletonCard />
      </div>
    );

  // support paginated or array results
  const items: any[] = Array.isArray(data) ? data : (data?.data ?? []);

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Pending Volunteer Hours</h3>
        <div className="text-sm text-muted-foreground">
          Total: {Array.isArray(data) ? items.length : (data?.meta?.total ?? items.length)}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending hour logs</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-sm text-muted-foreground p-4">No pending hours</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Volunteer</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((h: any) => (
                  <TableRow key={h.id}>
                    <TableCell>
                      {h.first_name ?? h.user?.firstName ?? ''} {h.last_name ?? h.user?.lastName ?? ''}
                    </TableCell>
                    <TableCell>{h.event_title ?? h.event?.title ?? 'N/A'}</TableCell>
                    <TableCell>{new Date(h.date).toLocaleDateString()}</TableCell>
                    <TableCell>{h.hours}</TableCell>
                    <TableCell className="max-w-xs break-words">{h.notes || '—'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{h.status}</Badge>
                    </TableCell>
                    <TableCell className="flex gap-2">
                      <Button size="sm" onClick={() => updateMutation.mutate({ id: h.id, status: 'Approved' })}>
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => updateMutation.mutate({ id: h.id, status: 'Rejected' })}
                      >
                        Reject
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {items.length > 0 && (
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => bulkApprove.mutate(items.map((i) => i.id))}>
            Approve All on Page
          </Button>
        </div>
      )}
    </div>
  );
}
