// src/pages/admin/scheduling.tsx
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Clock } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import SkeletonCard from '@/components/atoms/skeleton-card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/atoms/use-toast';

export default function AdminScheduling() {
  const { data, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: api.listTasks
  });

  const shifts = Array.isArray(data) ? data : [];

  // scheduled jobs
  const queryClient = useQueryClient();
  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ['scheduledJobs'],
    queryFn: api.listScheduledJobs
  });
  const jobs = Array.isArray(jobsData) ? jobsData : [];

  const [name, setName] = useState('');
  const [type, setType] = useState('communication');
  const [runAt, setRunAt] = useState('');
  const [payload, setPayload] = useState('');

  const createMutation = useMutation({
    mutationFn: api.createScheduledJob,
    onSuccess: () => {
      queryClient.invalidateQueries(['scheduledJobs']);
      toast.success('Scheduled job created');
      setName('');
      setRunAt('');
      setPayload('');
    },
    onError: (err: any) => {
      console.error('createScheduledJob error', err?.response?.data ?? err);
      toast.error('Failed to create scheduled job');
    }
  });
  const retryMutation = useMutation({
    mutationFn: (id: number) => api.retryScheduledJob(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['scheduledJobs']);
      toast.success('Retry scheduled');
    },
    onError: () => toast.error('Retry failed')
  });

  const onCreate = () => {
    if (!name || !runAt) return toast.error('Name and runAt are required');
    let parsedPayload = undefined;
    try {
      parsedPayload = payload ? JSON.parse(payload) : undefined;
    } catch (e) {
      return toast.error('Payload must be valid JSON');
    }
    createMutation.mutate({ name, type, runAt, payload: parsedPayload });
  };

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
          <div className="mb-4 text-sm text-muted-foreground">Manage volunteer shifts and task assignments</div>
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
                    <TableCell>{s.dueDate ? new Date(s.dueDate).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>
                      {s.dueDate
                        ? new Date(s.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '-'}
                    </TableCell>
                    <TableCell>{s.assignments?.length || 0}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {/* Scheduled Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm block mb-1">Name</label>
              <Input value={name} onChange={(e: any) => setName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm block mb-1">Run at (ISO)</label>
              <Input value={runAt} onChange={(e: any) => setRunAt(e.target.value)} placeholder="2025-11-24T12:00:00Z" />
            </div>
            <div>
              <label className="text-sm block mb-1">Type</label>
              <select value={type} onChange={(e: any) => setType(e.target.value)} className="w-full">
                <option value="communication">Communication</option>
                <option value="reminder">Reminder</option>
              </select>
            </div>
            <div>
              <label className="text-sm block mb-1">Payload (JSON)</label>
              <Textarea value={payload} onChange={(e: any) => setPayload(e.target.value)} rows={4} />
            </div>
          </div>
          <div className="mb-4">
            <Button onClick={onCreate}>Create Scheduled Job</Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Run At</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Attempts</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobsLoading ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <SkeletonCard />
                  </TableCell>
                </TableRow>
              ) : jobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No scheduled jobs
                  </TableCell>
                </TableRow>
              ) : (
                jobs.map((j: any) => (
                  <TableRow key={j.id}>
                    <TableCell>{j.name}</TableCell>
                    <TableCell>{j.type}</TableCell>
                    <TableCell>{j.runAt ? new Date(j.runAt).toLocaleString() : '-'}</TableCell>
                    <TableCell>{j.status}</TableCell>
                    <TableCell>{j.attempts}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => retryMutation.mutate(j.id)}>
                          Retry
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
