import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from '@/components/atoms/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from '@/components/ui/textarea';
import { Search, Filter, MoreHorizontal, Loader2, Plus, FileText, XCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function OrganizationVolunteers() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Fetch Organization ID first
  const { data: orgProfile } = useQuery({
    queryKey: ['organizationProfile'],
    queryFn: () => api.getOrganizationProfile()
  });

  const orgId = orgProfile?.id || (orgProfile as any)?.data?.id;

  // Fetch Members using new API
  const { data: membersData, isLoading } = useQuery({
    queryKey: ['organizationMembers', orgId, search, statusFilter],
    queryFn: async () => {
      const params: any = { page: 1, perPage: 50 }; // Basic pagination for now
      if (search) params.search = search;
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
      return api.getOrganizationMembers(orgId, params);
    },
    enabled: !!orgId
  });

  const members = (membersData as any)?.data || [];

  // Update Status Mutation (Approve/Reject/Suspend)
  const updateStatusMutation = useMutation({
    mutationFn: async ({ memberId, status, notes }: { memberId: number; status: string; notes?: string }) => {
      return api.updateOrganizationMemberStatus(orgId, memberId, status, notes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationMembers'] });
      // Invalidate old keys just in case
      queryClient.invalidateQueries({ queryKey: ['organizationVolunteers'] });
      toast.success('Member status updated successfully');
      setViewingRequest(null);
      setRejectConfirmOpen(false);
    },
    onError: () => {
      toast.error('Failed to update status');
    }
  });

  // Remove Mutation
  const removeMutation = useMutation({
    mutationFn: async (memberId: number) => {
      return api.removeOrganizationMember(orgId, memberId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationMembers'] });
      toast.success('Member removed successfully');
    },
    onError: () => {
      toast.error('Failed to remove member');
    }
  });

  // Action Dialog States
  const [viewingRequest, setViewingRequest] = useState<any>(null); // For pending request details
  const [rejectConfirmOpen, setRejectConfirmOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectTarget, setRejectTarget] = useState<any>(null);

  const [actionMember, setActionMember] = useState<any>(null);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [notes, setNotes] = useState('');

  const handleApprove = (member: any) => {
    updateStatusMutation.mutate({ memberId: member.user_id, status: 'active' });
  };

  const handleReject = () => {
    if (rejectTarget) {
      updateStatusMutation.mutate({ memberId: rejectTarget.user_id, status: 'rejected', notes: rejectReason });
    }
  };

  const handleUpdateNotes = () => {
    if (actionMember) {
      updateStatusMutation.mutate({ memberId: actionMember.user_id, status: actionMember.status, notes });
      setNotesDialogOpen(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase();
    switch (s) {
      case 'active': return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-none">Active</Badge>;
      case 'pending': return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-none">Pending</Badge>;
      case 'rejected': return <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-none">Rejected</Badge>;
      case 'suspended': return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200 border-none">Suspended</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  }

  if (isLoading || !orgId) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Volunteers</h2>
          <p className="text-muted-foreground">Manage your volunteer database and requests.</p>
        </div>
        <div className="flex gap-2">
          {/* Add manually logic could go here if needed */}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search volunteers..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Volunteer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No volunteers found.
                  </TableCell>
                </TableRow>
              ) : (
                members.map((member: any) => (
                  <TableRow key={member.user_id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={member.user?.avatar || member.user?.avatar_url} />
                          <AvatarFallback>
                            {(member.user?.first_name || member.user?.email || '?')[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{member.user?.first_name} {member.user?.last_name}</div>
                          <div className="text-xs text-muted-foreground">{member.user?.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(member.status)}
                    </TableCell>
                    <TableCell>
                      {member.joined_at ? new Date(member.joined_at).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>{member.hours || 0} hrs</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {member.status?.toLowerCase() === 'pending' && (
                          <>
                            {member.notes && (
                              <Button variant="ghost" size="icon" onClick={() => setViewingRequest(member)} title="View Request Note">
                                <FileText className="h-4 w-4 text-blue-500" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" onClick={() => handleApprove(member)} title="Approve">
                              <Plus className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => {
                              setRejectTarget(member);
                              setRejectReason('');
                              setRejectConfirmOpen(true);
                            }} title="Reject">
                              <XCircle className="h-4 w-4 text-red-600" />
                            </Button>
                          </>
                        )}

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {member.status?.toLowerCase() === 'pending' && (
                              <DropdownMenuItem className="text-green-600" onClick={() => handleApprove(member)}>
                                Approve / Verify
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => {
                              setActionMember(member);
                              setNotes(member.notes || '');
                              setNotesDialogOpen(true);
                            }}>
                              Edit Notes
                            </DropdownMenuItem>

                            {member.status?.toLowerCase() === 'active' && (
                              <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ memberId: member.user_id, status: 'suspended' })}>
                                Suspend
                              </DropdownMenuItem>
                            )}
                            {member.status?.toLowerCase() === 'suspended' && (
                              <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ memberId: member.user_id, status: 'active' })}>
                                Reactivate
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuItem className="text-red-600" onClick={() => removeMutation.mutate(member.user_id)}>
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Request Note Dialog */}
      <Dialog open={!!viewingRequest} onOpenChange={(open) => !open && setViewingRequest(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Membership Request</DialogTitle>
            <DialogDescription>
              Request from <span className="font-semibold">{viewingRequest?.user?.first_name}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-slate-50 p-4 rounded-md border text-sm italic">
              "{viewingRequest?.notes || 'No message provided.'}"
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="destructive"
              onClick={() => {
                setRejectTarget(viewingRequest);
                setRejectReason('');
                setRejectConfirmOpen(true);
                setViewingRequest(null);
              }}
            >
              Reject
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => handleApprove(viewingRequest)}
            >
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation Dialog */}
      <Dialog open={rejectConfirmOpen} onOpenChange={setRejectConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Request</DialogTitle>
            <DialogDescription>
              Reason for rejection (optional)
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Reason..."
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectConfirmOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject}>Details Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Notes Dialog */}
      <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Internal Notes</DialogTitle>
          </DialogHeader>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Internal notes..." />
          <DialogFooter>
            <Button onClick={handleUpdateNotes}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
