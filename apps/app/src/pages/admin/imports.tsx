import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/atoms/use-toast';

function DownloadSample({ onClick }: { onClick: () => void }) {
  return (
    <Button size="sm" variant="outline" onClick={onClick}>
      Download sample
    </Button>
  );
}

export default function AdminImports() {
  const queryClient = useQueryClient();
  const [volFile, setVolFile] = useState<File | null>(null);
  const [oppFile, setOppFile] = useState<File | null>(null);

  // Fetch scheduled jobs (import jobs)
  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['scheduled-jobs'],
    queryFn: () => api.listScheduledJobs()
  });

  const volunteersImport = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return api.importVolunteers(file);
    },
    onSuccess: () => {
      toast({ title: 'Volunteer import queued', description: 'Server has received the file and will process it.' });
      setVolFile(null);
      queryClient.invalidateQueries({ queryKey: ['scheduled-jobs'] });
    },
    onError: (err: any) => toast({ title: 'Import failed', description: String(err), variant: 'destructive' })
  });

  const opportunitiesImport = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return api.importOpportunities(file);
    },
    onSuccess: () => {
      toast({ title: 'Opportunities import queued', description: 'Server accepted the file.' });
      setOppFile(null);
      queryClient.invalidateQueries({ queryKey: ['scheduled-jobs'] });
    },
    onError: (err: any) => toast({ title: 'Import failed', description: String(err), variant: 'destructive' })
  });

  const retryMutation = useMutation({
    mutationFn: (jobId: number) => api.retryScheduledJob(jobId),
    onSuccess: () => {
      toast({ title: 'Job retry requested' });
      queryClient.invalidateQueries({ queryKey: ['scheduled-jobs'] });
    },
    onError: () => toast({ title: 'Retry failed', variant: 'destructive' })
  });

  const downloadVolTemplate = async () => {
    try {
      const res: any = await api.getVolunteersTemplate();
      const data = res?.data ?? res;
      const blob = data instanceof Blob ? data : new Blob([JSON.stringify(data)], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'volunteers-template.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({ title: 'Template downloaded' });
    } catch (e: any) {
      toast({ title: 'Download failed', description: String(e), variant: 'destructive' });
    }
  };

  const downloadOppTemplate = async () => {
    try {
      const res: any = await api.getOpportunitiesTemplate();
      const data = res?.data ?? res;
      const blob = data instanceof Blob ? data : new Blob([JSON.stringify(data)], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'opportunities-template.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({ title: 'Template downloaded' });
    } catch (e: any) {
      toast({ title: 'Download failed', description: String(e), variant: 'destructive' });
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Imports</h2>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Import Volunteers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Input type="file" onChange={(e: any) => setVolFile(e.target.files?.[0] ?? null)} />
            <Button
              onClick={() => volFile && volunteersImport.mutate(volFile)}
              disabled={!volFile || volunteersImport.isLoading}
            >
              {volunteersImport.isLoading ? 'Uploading...' : 'Upload CSV'}
            </Button>
            <DownloadSample onClick={downloadVolTemplate} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Import Opportunities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Input type="file" onChange={(e: any) => setOppFile(e.target.files?.[0] ?? null)} />
            <Button
              onClick={() => oppFile && opportunitiesImport.mutate(oppFile)}
              disabled={!oppFile || opportunitiesImport.isLoading}
            >
              {opportunitiesImport.isLoading ? 'Uploading...' : 'Upload CSV'}
            </Button>
            <DownloadSample onClick={downloadOppTemplate} />
          </div>
        </CardContent>
      </Card>

      {/* Import Jobs List */}
      <Card>
        <CardHeader>
          <CardTitle>Import Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          {jobsLoading ? (
            <p className="text-sm text-muted-foreground">Loading jobs...</p>
          ) : jobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No scheduled import jobs</p>
          ) : (
            <div className="space-y-2">
              {jobs.map((job: any) => (
                <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{job.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Type: {job.type} | Status: {job.status} | Run at: {new Date(job.runAt).toLocaleString()}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => retryMutation.mutate(job.id)}
                    disabled={retryMutation.isLoading}
                  >
                    Retry
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
