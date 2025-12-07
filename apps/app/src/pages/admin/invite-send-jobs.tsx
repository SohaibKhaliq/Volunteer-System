import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/atoms/use-toast';

export default function AdminInviteSendJobs() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [inviteId, setInviteId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(20);

  const filters = {
    status: status || undefined,
    q: search || undefined,
    inviteId: inviteId || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    page,
    perPage
  };

  const { data, isLoading } = useQuery(['invite-send-jobs', filters], () => api.listInviteSendJobs(filters), {
    keepPreviousData: true
  });

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
        <div className="text-sm text-muted-foreground">
          Jobs: {Array.isArray(data) ? data.length : (data?.meta?.total ?? 0)}
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-4 gap-3 p-2">
        <input
          placeholder="Search by email or invite id"
          value={search}
          onChange={(e) => setSearch((e.target as HTMLInputElement).value)}
          className="border rounded px-2 py-1"
        />
        <input
          placeholder="Invite ID"
          value={inviteId}
          onChange={(e) => setInviteId((e.target as HTMLInputElement).value)}
          className="border rounded px-2 py-1"
        />
        <select
          value={status}
          onChange={(e) => setStatus((e.target as HTMLSelectElement).value)}
          className="border rounded px-2 py-1"
        >
          <option value="">All statuses</option>
          <option value="pending">pending</option>
          <option value="processing">processing</option>
          <option value="sent">sent</option>
          <option value="failed">failed</option>
        </select>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate((e.target as HTMLInputElement).value)}
            className="border rounded px-2 py-1"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate((e.target as HTMLInputElement).value)}
            className="border rounded px-2 py-1"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 px-2">
        <button
          className="px-3 py-1 bg-blue-600 text-white rounded"
          onClick={() => {
            setPage(1);
            queryClient.invalidateQueries(['invite-send-jobs', { ...filters, page: 1 }]);
          }}
        >
          Apply Filters
        </button>
        <button
          className="px-3 py-1 bg-gray-100 text-gray-700 rounded"
          onClick={() => {
            setStatus('');
            setSearch('');
            setInviteId('');
            setStartDate('');
            setEndDate('');
            setPage(1);
            queryClient.invalidateQueries(['invite-send-jobs']);
          }}
        >
          Clear
        </button>
        <div className="flex items-center gap-2 ml-auto">
          <label className="text-sm text-muted-foreground">Per page</label>
          <select
            value={perPage}
            onChange={(e) => setPerPage(Number((e.target as HTMLSelectElement).value))}
            className="border rounded px-2 py-1"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {isLoading && <div className="text-sm text-muted-foreground">Loading...</div>}

        {(Array.isArray(data) ? data : data?.data || []).map((j: any) => (
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

      {/* Pagination controls */}
      <div className="flex items-center justify-between mt-2">
        <div className="text-sm text-muted-foreground">
          Showing {(Array.isArray(data) ? data.length : data?.data?.length) ?? 0} results
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={(data && (data.meta?.current_page || data?.meta?.page || page) <= 1) || page <= 1}
          >
            Prev
          </Button>
          <div className="text-sm text-muted-foreground">
            Page {data?.meta?.current_page || data?.meta?.page || page}
          </div>
          <Button
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={
              !!(
                data &&
                (data.meta?.current_page
                  ? data.meta?.current_page >= (data.meta?.last_page || data.meta?.lastPage || data.meta?.total_pages)
                  : false)
              )
            }
          >
            Next
          </Button>
        </div>
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
