import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/components/atoms/use-toast';

export default function AdminBackgroundChecks() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery(['admin', 'background-checks'], () => api.listBackgroundChecks());
  const checks: any[] = Array.isArray(data) ? data : (data?.data ?? []);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewing, setViewing] = useState<any | null>(null);

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: any }) => api.updateBackgroundCheck(id, payload),
    onSuccess: () => {
      toast({ title: 'Background check updated' });
      queryClient.invalidateQueries(['admin', 'background-checks']);
    },
    onError: (err: any) => toast({ title: 'Update failed', description: String(err), variant: 'destructive' })
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.deleteBackgroundCheck(id),
    onSuccess: () => {
      toast({ title: 'Background check deleted', variant: 'success' });
      queryClient.invalidateQueries(['admin', 'background-checks']);
    },
    onError: (err: any) => toast({ title: 'Delete failed', description: String(err), variant: 'destructive' })
  });

  const markClear = (id: number) => updateMutation.mutate({ id, payload: { status: 'clear' } });
  const markRejected = (id: number) => updateMutation.mutate({ id, payload: { status: 'rejected' } });

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Background Checks</h2>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Recent checks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Volunteer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Loading…
                    </TableCell>
                  </TableRow>
                ) : checks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No checks found
                    </TableCell>
                  </TableRow>
                ) : (
                  checks.map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell>{c.id}</TableCell>
                      <TableCell>{c.user?.name ?? c.user?.email ?? `User ${c.user_id ?? c.userId}`}</TableCell>
                      <TableCell className="capitalize">{(c.status ?? 'unknown').toString()}</TableCell>
                      <TableCell>{new Date(c.created_at ?? c.createdAt ?? Date.now()).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setViewing(c);
                              setViewOpen(true);
                            }}
                          >
                            View
                          </Button>
                          <Button size="sm" onClick={() => markClear(c.id)} disabled={updateMutation.isLoading}>
                            Clear
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => markRejected(c.id)}>
                            Reject
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => deleteMutation.mutate(c.id)}>
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Background Check — Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <strong>ID</strong>
                <span>{viewing?.id}</span>
              </div>

              <div className="flex items-center gap-2">
                <strong>Volunteer</strong>
                <span>{viewing?.user?.name ?? viewing?.user?.email}</span>
              </div>

              <div className="flex items-center gap-2">
                <strong>Status</strong>
                <span className="capitalize">{String(viewing?.status ?? 'unknown')}</span>
              </div>

              <div className="flex items-center gap-2">
                <strong>Submitted</strong>
                <span>{new Date(viewing?.created_at ?? viewing?.createdAt ?? Date.now()).toLocaleString()}</span>
              </div>

              <div>
                <strong>Notes</strong>
                <div className="mt-2 p-3 bg-muted-foreground/5 rounded text-sm break-words">
                  {viewing?.notes ?? '—'}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setViewOpen(false)}>
                Close
              </Button>
              <Button onClick={() => viewing?.id && markClear(viewing.id)} disabled={updateMutation.isLoading}>
                Mark Clear
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
