import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { toast } from '@/components/atoms/use-toast';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import SkeletonCard from '@/components/atoms/skeleton-card';
import { Button } from '@/components/ui/button';
import { saveAs } from 'file-saver';

export default function AdminMonitoring() {
  const { data: stats, isLoading: statsLoading } = useQuery(['monitoring', 'stats'], () => api.getMonitoringStats());
  const { data: recent, isLoading: recentLoading } = useQuery(['monitoring', 'recent'], () =>
    api.getMonitoringRecent()
  );

  const queryClient = useQueryClient();

  const retryJobMutation = useMutation((id: number) => api.retryScheduledJob(id), {
    onSuccess: () => {
      queryClient.invalidateQueries(['monitoring', 'recent']);
      queryClient.invalidateQueries(['monitoring', 'stats']);
    }
  });

  const retryLogMutation = useMutation((id: number) => api.retryCommunicationLog(id), {
    onSuccess: () => {
      queryClient.invalidateQueries(['monitoring', 'recent']);
      queryClient.invalidateQueries(['monitoring', 'stats']);
    }
  });

  const bulkRetryMutation = useMutation((ids: number[]) => api.bulkRetryCommunicationLogs(ids), {
    onSuccess: () => {
      queryClient.invalidateQueries(['monitoring', 'recent']);
      queryClient.invalidateQueries(['monitoring', 'stats']);
    }
  });

  const s = (stats && (stats as any).data) || {};
  const r = (recent && (recent as any).data) || { communications: [], scheduledJobs: [], failedLogs: [] };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
          size="sm"
          variant="outline"
          onClick={async () => {
            try {
              const res: any = await api.getHealth();
              if (res && (res.data ?? res).healthy) {
                toast({ title: 'Health OK', variant: 'success' });
              } else {
                toast({ title: 'Health check returned issues', variant: 'destructive' });
              }
            } catch (e) {
              toast({ title: 'Health check failed', description: String(e), variant: 'destructive' });
            }
          }}
        >
          Check Health
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Monitoring Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <SkeletonCard />
          ) : (
            <div className="grid grid-cols-4 gap-4">
              <div className="p-4 border rounded">
                <div className="text-sm text-muted-foreground">Communications</div>
                <div className="text-2xl font-semibold">
                  {Number(Object.values(s.communications?.byStatus || {}).reduce((a: any, b: any) => a + b, 0))}
                </div>
                <div className="text-sm">
                  Failed logs: <Badge variant="destructive">{s.communications?.failedLogs || 0}</Badge>
                </div>
              </div>
              <div className="p-4 border rounded">
                <div className="text-sm text-muted-foreground">Scheduled Jobs</div>
                <div className="text-2xl font-semibold">
                  {Number(Object.values(s.scheduledJobs || {}).reduce((a: any, b: any) => a + b, 0))}
                </div>
                <div className="text-sm">Scheduled: {s.scheduledJobs?.Scheduled || 0}</div>
              </div>
              <div className="p-4 border rounded">
                <div className="text-sm text-muted-foreground">Shifts</div>
                <div className="text-2xl font-semibold">{s.tasks?.total || 0}</div>
                <div className="text-sm">Assignments: {s.tasks?.assignments || 0}</div>
              </div>
              <div className="p-4 border rounded">
                <div className="text-sm text-muted-foreground">As Of</div>
                <div className="text-2xl font-semibold">{s.asOf ? new Date(s.asOf).toLocaleString() : '-'}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Button
              onClick={async () => {
                try {
                  const res = await api.downloadReport('communications', 'csv');
                  const blob = new Blob([res.data], { type: 'text/csv' });
                  saveAs(blob, `communications-${Date.now()}.csv`);
                } catch (e) {
                  console.error(e);
                  alert('Failed to download communications CSV');
                }
              }}
            >
              Export Communications (CSV)
            </Button>
            <Button
              onClick={async () => {
                try {
                  const res = await api.downloadReport('scheduled_jobs', 'csv');
                  const blob = new Blob([res.data], { type: 'text/csv' });
                  saveAs(blob, `scheduled-jobs-${Date.now()}.csv`);
                } catch (e) {
                  console.error(e);
                  alert('Failed to download scheduled jobs CSV');
                }
              }}
            >
              Export Scheduled Jobs (CSV)
            </Button>
          </div>
          <div className="mb-4">
            <h3 className="font-semibold">Recent Communications</h3>
            {recentLoading ? (
              <SkeletonCard />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(r.communications || []).map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell>{c.subject}</TableCell>
                      <TableCell>{c.type}</TableCell>
                      <TableCell>{c.status}</TableCell>
                      <TableCell>{c.createdAt ? new Date(c.createdAt).toLocaleString() : '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <div className="mb-4">
            <h3 className="font-semibold">Recent Scheduled Jobs</h3>
            {recentLoading ? (
              <SkeletonCard />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Run At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(r.scheduledJobs || []).map((j: any) => (
                    <TableRow key={j.id}>
                      <TableCell>{j.name}</TableCell>
                      <TableCell>{j.type}</TableCell>
                      <TableCell>{j.status}</TableCell>
                      <TableCell>{j.runAt ? new Date(j.runAt).toLocaleString() : '-'}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          onClick={() => retryJobMutation.mutate(j.id)}
                          disabled={retryJobMutation.isLoading}
                        >
                          {retryJobMutation.isLoading ? 'Retrying...' : 'Retry'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Recent Failed Communication Logs</h3>
              <div>
                <Button
                  variant="secondary"
                  onClick={() => bulkRetryMutation.mutate((r.failedLogs || []).map((l: any) => l.id))}
                  disabled={bulkRetryMutation.isLoading}
                >
                  {bulkRetryMutation.isLoading ? 'Retrying...' : 'Retry All'}
                </Button>
              </div>
            </div>
            {recentLoading ? (
              <SkeletonCard />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Attempts</TableHead>
                    <TableHead>Error</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(r.failedLogs || []).map((l: any) => (
                    <TableRow key={l.id}>
                      <TableCell>{l.recipient}</TableCell>
                      <TableCell>{l.status}</TableCell>
                      <TableCell>{l.attempts}</TableCell>
                      <TableCell className="max-w-xs truncate">{l.error || '-'}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          onClick={() => retryLogMutation.mutate(l.id)}
                          disabled={retryLogMutation.isLoading}
                        >
                          {retryLogMutation.isLoading ? 'Retrying...' : 'Retry'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
