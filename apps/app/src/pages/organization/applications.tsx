import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from '@/components/atoms/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CheckCircle, XCircle, FileText, Users } from 'lucide-react';

interface Application {
  id: number;
  opportunityId: number;
  userId: number;
  status: string;
  appliedAt: string;
  respondedAt?: string;
  notes?: string;
  user?: {
    id: number;
    firstName?: string;
    lastName?: string;
    email: string;
    avatar?: string;
  };
  opportunity?: {
    id: number;
    title: string;
    startAt: string;
  };
}

export default function OrganizationApplications() {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>('applied');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Fetch Applications
  const { data: applications, isLoading } = useQuery({
    queryKey: ['organizationApplications', filterStatus],
    queryFn: () => api.listOrganizationApplications({ status: filterStatus || undefined })
  });

  // Update Application Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => api.updateApplication(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationApplications'] });
      toast.success('Application updated');
    },
    onError: () => {
      toast.error('Failed to update application');
    }
  });

  // Bulk Update Mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: ({ ids, status }: { ids: number[]; status: string }) => api.bulkUpdateApplications(ids, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationApplications'] });
      setSelectedIds([]);
      toast.success('Applications updated');
    },
    onError: () => {
      toast.error('Failed to update applications');
    }
  });

  const handleAccept = (id: number) => {
    updateMutation.mutate({ id, status: 'accepted' });
  };

  const handleReject = (id: number) => {
    updateMutation.mutate({ id, status: 'rejected' });
  };

  const handleBulkAction = (status: string) => {
    if (selectedIds.length === 0) {
      toast.error('No applications selected');
      return;
    }
    bulkUpdateMutation.mutate({ ids: selectedIds, status });
  };

  const toggleSelection = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    const applicationsList = Array.isArray(applications) ? applications : (applications as any)?.data || [];
    if (selectedIds.length === applicationsList.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(applicationsList.map((a: Application) => a.id));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'applied':
        return <Badge className="bg-blue-500">Applied</Badge>;
      case 'accepted':
        return <Badge className="bg-green-500">Accepted</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'withdrawn':
        return <Badge variant="secondary">Withdrawn</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const applicationsList = Array.isArray(applications) ? applications : (applications as any)?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Applications</h2>
          <p className="text-muted-foreground">Review and manage volunteer applications for your opportunities.</p>
        </div>
      </div>

      {/* Filters & Bulk Actions */}
      <div className="flex gap-4 items-center">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All</SelectItem>
            <SelectItem value="applied">Pending</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="withdrawn">Withdrawn</SelectItem>
          </SelectContent>
        </Select>

        {selectedIds.length > 0 && (
          <div className="flex gap-2 items-center">
            <span className="text-sm text-muted-foreground">{selectedIds.length} selected</span>
            <Button
              size="sm"
              variant="outline"
              className="text-green-600"
              onClick={() => handleBulkAction('accepted')}
              disabled={bulkUpdateMutation.isPending}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Accept All
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-red-600"
              onClick={() => handleBulkAction('rejected')}
              disabled={bulkUpdateMutation.isPending}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Reject All
            </Button>
          </div>
        )}
      </div>

      {applicationsList.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Applications</h3>
            <p className="text-muted-foreground mb-4">
              {filterStatus ? `No ${filterStatus} applications found.` : 'No applications received yet.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Applications ({applicationsList.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === applicationsList.length}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </TableHead>
                  <TableHead>Volunteer</TableHead>
                  <TableHead>Opportunity</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applicationsList.map((application: Application) => (
                  <TableRow key={application.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(application.id)}
                        onChange={() => toggleSelection(application.id)}
                        className="rounded border-gray-300"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={application.user?.avatar} />
                          <AvatarFallback>
                            {application.user?.firstName?.[0] || application.user?.email?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {application.user?.firstName
                              ? `${application.user.firstName} ${application.user.lastName || ''}`
                              : application.user?.email}
                          </div>
                          {application.user?.firstName && (
                            <div className="text-xs text-muted-foreground">{application.user.email}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{application.opportunity?.title || 'Unknown'}</div>
                        {application.opportunity?.startAt && (
                          <div className="text-xs text-muted-foreground">
                            {new Date(application.opportunity.startAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{new Date(application.appliedAt).toLocaleDateString()}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(application.appliedAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(application.status)}</TableCell>
                    <TableCell className="max-w-xs truncate">{application.notes || '-'}</TableCell>
                    <TableCell className="text-right">
                      {application.status === 'applied' && (
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-green-600"
                            onClick={() => handleAccept(application.id)}
                            disabled={updateMutation.isPending}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-600"
                            onClick={() => handleReject(application.id)}
                            disabled={updateMutation.isPending}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
