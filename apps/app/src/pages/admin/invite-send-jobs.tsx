import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/atoms/use-toast';

export default function AdminInviteSendJobs() {
  const queryClient = useQueryClient();
  const { data = [], isLoading } = useQuery(['invite-send-jobs'], () => api.listInviteSendJobs());

  const retryMutation = useMutation((id: number) => api.retryInviteSendJob(id), {
    onSuccess: () => {
      queryClient.invalidateQueries(['invite-send-jobs']);
      toast.success('Job retried');
    },
    onError: () => toast.error('Failed to retry job')
  });

  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Invite Send Jobs</h3>
        <div className="text-sm text-muted-foreground">Jobs: {Array.isArray(data) ? data.length : 0}</div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {isLoading && <div className="text-sm text-muted-foreground">Loading...</div>}

        {Array.isArray(data) &&
          data.map((j: any) => (
            <Card key={j.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="font-semibold">Invite #{j.organizationInviteId}</div>
                    <div className="text-xs text-muted-foreground">{String(j.status)}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">Attempts: {j.attempts ?? 0}</div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between gap-4">
                  <div className="text-sm text-muted-foreground">
                    Invite email: {j.invite?.email ?? 'N/A'}
                    <div className="text-xs text-muted-foreground mt-1">
                      Next attempt: {j.nextAttemptAt ? new Date(j.nextAttemptAt).toLocaleString() : 'N/A'}
                    </div>
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

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Invite Job Details</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <div className="text-xs text-muted-foreground mb-2">Invite ID: {selectedJob?.organizationInviteId}</div>
            <pre className="bg-slate-900 text-white p-3 rounded text-sm max-h-72 overflow-auto">
              {JSON.stringify(selectedJob ?? {}, null, 2)}
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
