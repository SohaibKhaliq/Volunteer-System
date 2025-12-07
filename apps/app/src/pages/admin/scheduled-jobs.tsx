import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/atoms/use-toast';

export default function AdminScheduledJobs() {
  const queryClient = useQueryClient();
  const { data = [], isLoading } = useQuery(['scheduled-jobs'], () => api.listScheduledJobs());
  const retryMutation = useMutation((id: number) => api.retryScheduledJob(id), {
    onSuccess: () => {
      queryClient.invalidateQueries(['scheduled-jobs']);
      toast.success('Job retried');
    },
    onError: () => toast.error('Failed to retry job')
  });

  const createMutation = useMutation((payload: any) => api.createScheduledJob(payload), {
    onSuccess: () => {
      queryClient.invalidateQueries(['scheduled-jobs']);
      toast.success('Scheduled job created');
    },
    onError: () => toast.error('Failed to create scheduled job')
  });

  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [runAt, setRunAt] = useState('');
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Scheduled Jobs</h3>
        <div className="text-sm text-muted-foreground">Jobs: {Array.isArray(data) ? data.length : 0}</div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div>Create New</div>
            <div className="text-sm text-muted-foreground">Schedule a job to run in the future</div>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-3 p-4">
          <Input placeholder="Name" value={name} onChange={(e) => setName((e.target as HTMLInputElement).value)} />
          <Input placeholder="Type" value={type} onChange={(e) => setType((e.target as HTMLInputElement).value)} />
          <Input
            placeholder="Run At (ISO datetime)"
            value={runAt}
            onChange={(e) => setRunAt((e.target as HTMLInputElement).value)}
          />
          <div className="col-span-3 flex items-center gap-2">
            <Button
              onClick={() => createMutation.mutate({ name, type, runAt })}
              disabled={createMutation.isLoading || !name || !type || !runAt}
            >
              Create
            </Button>
            <div className="text-sm text-muted-foreground">Provide an ISO-8601 datetime for Run At</div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-3">
        {isLoading && <div className="text-sm text-muted-foreground">Loading...</div>}

        {Array.isArray(data) &&
          data.map((j: any) => (
            <Card key={j.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="font-semibold">{j.name}</div>
                    <div className="text-xs text-muted-foreground">{j.type}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">{String(j.status)}</div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between gap-4">
                  <div className="text-sm text-muted-foreground">
                    Run: {j.runAt ? new Date(j.runAt).toLocaleString() : 'N/A'}
                    <div className="text-xs text-muted-foreground mt-1">Attempts: {j.attempts ?? 0}</div>
                    {j.lastError ? (
                      <div className="text-xs text-rose-600 mt-1">Error: {String(j.lastError).slice(0, 200)}</div>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedJob(j);
                        setShowDetails(true);
                      }}
                    >
                      View
                    </Button>
                    <Button size="sm" onClick={() => retryMutation.mutate(j.id)} disabled={retryMutation.isLoading}>
                      Retry
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
      {/* Details dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedJob?.name ?? 'Job details'}</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <div className="text-xs text-muted-foreground mb-2">Type: {selectedJob?.type}</div>
            <pre className="bg-slate-900 text-white p-3 rounded text-sm max-h-72 overflow-auto">
              {JSON.stringify(selectedJob?.payload ?? selectedJob?.payload ?? {}, null, 2)}
            </pre>
            <div className="text-xs text-muted-foreground mt-2">Status: {selectedJob?.status}</div>
          </div>
          <DialogFooter>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowDetails(false)}>
                Close
              </Button>
              <Button
                onClick={() => {
                  if (selectedJob?.id) retryMutation.mutate(selectedJob.id);
                }}
                disabled={!selectedJob?.id || retryMutation.isLoading}
              >
                Retry
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
