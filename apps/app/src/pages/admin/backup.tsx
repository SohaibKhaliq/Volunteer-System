import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Database } from 'lucide-react';
import { toast } from '@/components/atoms/use-toast';

export default function AdminBackup() {
  const queryClient = useQueryClient();
  const [inProgress, setInProgress] = useState(false);

  const { data: status, isLoading } = useQuery(
    ['backup', 'status'],
    async () => {
      try {
        const res: any = await api.getBackupStatus();
        return res?.data ?? res;
      } catch (e) {
        return null;
      }
    },
    { refetchInterval: (data) => (data?.status === 'in_progress' ? 3000 : false) }
  );

  const createMutation = useMutation({
    mutationFn: async () => {
      setInProgress(true);
      const res: any = await api.createBackup();
      return res?.data ?? res;
    },
    onSuccess: () => {
      toast({ title: 'Backup started', description: 'Backup task has been queued' });
      queryClient.invalidateQueries(['backup', 'status']);
      setInProgress(false);
    },
    onError: (err: any) => {
      setInProgress(false);
      toast({ title: 'Failed to start backup', description: String(err), variant: 'destructive' });
    }
  });

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Database className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Backups</h2>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Platform backups</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Create and monitor platform backups. Backups are executed on the server and may take a few minutes to
            complete — you can track status here.
          </p>

          <div className="flex items-center gap-4">
            <Button onClick={() => createMutation.mutate()} disabled={inProgress || createMutation.isLoading}>
              {createMutation.isLoading || inProgress ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-4 w-4" /> Starting...
                </>
              ) : (
                'Create Backup'
              )}
            </Button>

            <div className="text-sm text-muted-foreground">
              {isLoading ? (
                <span>Checking status...</span>
              ) : status ? (
                <div className="space-y-1">
                  <div>
                    Status: <strong className="capitalize">{String(status.status ?? status.state ?? 'unknown')}</strong>
                  </div>
                  {status.startedAt && <div>Started: {new Date(status.startedAt).toLocaleString()}</div>}
                  {status.completedAt && <div>Completed: {new Date(status.completedAt).toLocaleString()}</div>}
                  {status.downloadUrl && (
                    <div>
                      <a href={status.downloadUrl} target="_blank" rel="noreferrer" className="underline">
                        Download latest backup
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <span>No recent backups</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
