import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SkeletonCard from '@/components/atoms/skeleton-card';
import { toast } from '@/components/atoms/use-toast';

export default function AdminOrganizationInvites() {
  const { id } = useParams();
  const orgId = Number(id);
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected' | 'cancelled'>('all');

  const { data, isLoading } = useQuery(
    ['org', orgId, 'invites', statusFilter],
    () => api.getOrganizationInvites(orgId, statusFilter === 'all' ? undefined : statusFilter),
    {
      enabled: !!orgId
    }
  );

  const createMutation = useMutation((payload: any) => api.sendOrganizationInvite(orgId, payload), {
    onSuccess: () => {
      queryClient.invalidateQueries(['org', orgId, 'invites']);
      toast.success('Invite sent');
    },
    onError: () => toast.error('Failed to send invite')
  });

  const resendMutation = useMutation((inviteId: number) => api.resendOrganizationInvite(orgId, inviteId), {
    onSuccess: () => {
      queryClient.invalidateQueries(['org', orgId, 'invites']);
      toast.success('Invite resent');
    },
    onError: () => toast.error('Failed to resend invite')
  });

  const cancelMutation = useMutation((inviteId: number) => api.cancelOrganizationInvite(orgId, inviteId), {
    onSuccess: () => {
      queryClient.invalidateQueries(['org', orgId, 'invites']);
      toast.success('Invite cancelled');
    },
    onError: () => toast.error('Failed to cancel invite')
  });

  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const invites: any[] = Array.isArray(data) ? data : (data?.data ?? []);

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Organization Invites</h3>
        <div className="text-sm text-muted-foreground">Organization ID: {orgId}</div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">Create Invite</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-2 p-4">
          <Input placeholder="Email" value={email} onChange={(e) => setEmail((e.target as HTMLInputElement).value)} />
          <Input
            placeholder="First name"
            value={firstName}
            onChange={(e) => setFirstName((e.target as HTMLInputElement).value)}
          />
          <Input
            placeholder="Last name"
            value={lastName}
            onChange={(e) => setLastName((e.target as HTMLInputElement).value)}
          />
          <div className="col-span-3 flex items-center gap-2">
            <Button
              onClick={() => createMutation.mutate({ email, first_name: firstName, last_name: lastName })}
              disabled={!email || createMutation.isLoading}
            >
              Send Invite
            </Button>
            <div className="text-sm text-muted-foreground">Invites are created for this organization</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <CardTitle>Existing Invites</CardTitle>
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="text-xs px-2 py-1 border rounded"
                aria-label="invite-status-filter"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <SkeletonCard />
          ) : invites.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">No invites found</div>
          ) : (
            invites.map((inv: any) => (
              <div key={inv.id} className="p-3 border-b flex items-center justify-between">
                <div>
                  <div className="font-medium">{inv.email}</div>
                  <div className="text-xs text-muted-foreground">
                    Sent: {new Date(inv.created_at ?? inv.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      try {
                        navigator.clipboard?.writeText(`${window.location.origin}/invites/${inv.token}`);
                        toast.success('Invite link copied');
                      } catch (e) {
                        // ignore copy failure
                      }
                    }}
                  >
                    Copy Link
                  </Button>
                  {inv.token ? (
                    <Button
                      size="sm"
                      onClick={async () => {
                        try {
                          await api.acceptInvite(inv.token);
                          queryClient.invalidateQueries(['org', orgId, 'invites', statusFilter]);
                          toast.success('Invite accepted (token)');
                        } catch (err) {
                          toast.error('Accept failed');
                        }
                      }}
                    >
                      Accept (token)
                    </Button>
                  ) : null}
                  {inv.token ? (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={async () => {
                        const idInput = window.prompt('Enter user ID to accept invite for (admin):')
                        if (!idInput) return
                        const uid = Number(idInput)
                        if (!uid) return toast.error('Invalid user id')
                        try {
                          await api.adminAcceptOrganizationInvite(orgId, inv.id, uid)
                          queryClient.invalidateQueries(['org', orgId, 'invites', statusFilter])
                          toast.success('Invite accepted on behalf of user')
                        } catch (err) {
                          toast.error('Admin accept failed')
                        }
                      }}
                    >
                      Accept as Admin
                    </Button>
                  ) : null}
                  {inv.token ? (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={async () => {
                        try {
                          await api.rejectInvite(inv.token);
                          queryClient.invalidateQueries(['org', orgId, 'invites', statusFilter]);
                          toast.success('Invite rejected (token)');
                        } catch (err) {
                          toast.error('Reject failed');
                        }
                      }}
                    >
                      Reject (token)
                    </Button>
                  ) : null}
                  <Button size="sm" onClick={() => resendMutation.mutate(inv.id)} disabled={resendMutation.isLoading}>
                    Resend
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => cancelMutation.mutate(inv.id)}
                    disabled={cancelMutation.isLoading}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
