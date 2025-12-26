import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Search, MoreHorizontal, CheckCircle, XCircle, AlertCircle, Ban } from 'lucide-react';
import { toast } from 'sonner';

const OrganizationVolunteersPage = () => {
  const { t } = useTranslation();
  const { id } = useParams(); // Organization ID
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [actionMember, setActionMember] = useState<any>(null);
  const [actionType, setActionType] = useState<string | null>(null); // 'approve', 'reject', 'suspend', 'notes'
  const [notes, setNotes] = useState('');

  // Fetch Members
  const { data, isLoading } = useQuery({
    queryKey: ['organization-members', id, page, search, statusFilter],
    queryFn: async () => {
      const params: any = { page, perPage: 20 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      return api.getOrganizationMembers(Number(id), params);
    },
    enabled: !!id
  });

  const members = (data as any)?.data || [];
  const meta = (data as any)?.meta || {};

  // Update Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ memberId, status, notes }: { memberId: number; status: string; notes?: string }) => {
      return api.updateOrganizationMemberStatus(Number(id), memberId, status, notes);
    },
    onSuccess: () => {
      toast.success(t('Member status updated successfully'));
      closeDialog();
      queryClient.invalidateQueries({ queryKey: ['organization-members'] });
    },
    onError: () => {
      toast.error(t('Failed to update member status'));
    }
  });

  const removeMutation = useMutation({
    mutationFn: async (memberId: number) => {
      return api.removeOrganizationMember(Number(id), memberId);
    },
    onSuccess: () => {
      toast.success(t('Member removed successfully'));
      queryClient.invalidateQueries({ queryKey: ['organization-members'] });
    },
    onError: () => {
      toast.error(t('Failed to remove member'));
    }
  });

  const openActionDialog = (member: any, type: string) => {
    setActionMember(member);
    setActionType(type);
    setNotes(type === 'notes' ? member.notes || '' : '');
  };

  const closeDialog = () => {
    setActionMember(null);
    setActionType(null);
    setNotes('');
  };

  const handleActionConfirm = () => {
    if (!actionMember || !actionType) return;

    if (actionType === 'notes') {
       // Just updating notes, keep status same
       updateStatusMutation.mutate({ 
         memberId: actionMember.user_id, 
         status: actionMember.status, 
         notes 
       });
    } else {
       updateStatusMutation.mutate({ 
         memberId: actionMember.user_id, 
         status: actionType === 'approve' ? 'active' : actionType === 'reject' ? 'rejected' : 'suspended', 
         notes 
       });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700 border-green-200">{t('Active')}</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">{t('Pending')}</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700 border-red-200">{t('Rejected')}</Badge>;
      case 'suspended':
        return <Badge className="bg-gray-100 text-gray-700 border-gray-200">{t('Suspended')}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-bold tracking-tight">{t('Volunteers')}</h1>
           <p className="text-muted-foreground">{t('Manage your organization members and requests.')}</p>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('Search volunteers...')}
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <select 
          className="h-10 w-[180px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">{t('All Statuses')}</option>
          <option value="pending">{t('Pending')}</option>
          <option value="active">{t('Active')}</option>
          <option value="suspended">{t('Suspended')}</option>
          <option value="rejected">{t('Rejected')}</option>
        </select>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('Name')}</TableHead>
              <TableHead>{t('Email')}</TableHead>
              <TableHead>{t('Status')}</TableHead>
              <TableHead>{t('Joined At')}</TableHead>
              <TableHead className="text-right">{t('Actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  {t('No members found.')}
                </TableCell>
              </TableRow>
            ) : (
              members.map((member: any) => (
                <TableRow key={member.user_id}>
                  <TableCell className="font-medium">
                    {member.user?.first_name} {member.user?.last_name}
                  </TableCell>
                  <TableCell>{member.user?.email}</TableCell>
                  <TableCell>{getStatusBadge(member.status)}</TableCell>
                  <TableCell>
                    {member.joined_at ? new Date(member.joined_at).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {member.status === 'pending' && (
                          <>
                            <DropdownMenuItem onClick={() => openActionDialog(member, 'approve')}>
                              <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                              {t('Approve')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openActionDialog(member, 'reject')}>
                              <XCircle className="mr-2 h-4 w-4 text-red-500" />
                              {t('Reject')}
                            </DropdownMenuItem>
                          </>
                        )}
                        {member.status === 'active' && (
                          <DropdownMenuItem onClick={() => openActionDialog(member, 'suspend')}>
                            <Ban className="mr-2 h-4 w-4 text-orange-500" />
                            {t('Suspend')}
                          </DropdownMenuItem>
                        )}
                        {member.status === 'suspended' && (
                           <DropdownMenuItem onClick={() => openActionDialog(member, 'approve')}>
                              <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                              {t('Reactivate')}
                           </DropdownMenuItem>
                        )}
                        
                        <DropdownMenuItem onClick={() => openActionDialog(member, 'notes')}>
                           {t('Edit Notes')}
                        </DropdownMenuItem>

                        <DropdownMenuItem 
                          className="text-red-600 focus:text-red-600"
                          onClick={() => {
                            if (window.confirm(t('Are you sure you want to remove this member?'))) {
                              removeMutation.mutate(member.user_id);
                            }
                          }}
                        >
                          {t('Remove')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination */}
      <div className="flex justify-end gap-2">
         <Button 
           variant="outline" 
           size="sm"
           onClick={() => setPage(p => Math.max(1, p - 1))}
           disabled={page === 1}
         >
           {t('Previous')}
         </Button>
         <Button 
           variant="outline" 
           size="sm"
           onClick={() => setPage(p => p + 1)}
           disabled={!meta.next_page_url && members.length < 20}
         >
           {t('Next')}
         </Button>
      </div>

      <Dialog open={!!actionMember} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' && t('Approve Application')}
              {actionType === 'reject' && t('Reject Application')}
              {actionType === 'suspend' && t('Suspend Volunteer')}
              {actionType === 'notes' && t('Edit Notes')}
            </DialogTitle>
            <DialogDescription>
               {actionType === 'approve' && t('Are you sure you want to approve this volunteer?')}
               {actionType === 'reject' && t('Please provide a reason for rejection (optional).')}
               {actionType === 'suspend' && t('This will prevent the volunteer from accessing organization resources.')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-2">
            <Textarea
              placeholder={t('Add notes or reason...')}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>{t('Cancel')}</Button>
            <Button 
              variant={actionType === 'reject' || actionType === 'suspend' ? 'destructive' : 'default'}
              onClick={handleActionConfirm}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('Confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrganizationVolunteersPage;
