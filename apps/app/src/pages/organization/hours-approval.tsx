import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from '@/components/atoms/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Loader2,
  Search,
  Filter
} from 'lucide-react';

export default function HoursApproval() {
  const queryClient = useQueryClient();
  const [selectedHour, setSelectedHour] = useState<any>(null);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedHours, setSelectedHours] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch pending hours
  const { data: pendingHoursData, isLoading } = useQuery({
    queryKey: ['organizationPendingHours', searchQuery],
    queryFn: () => api.getOrganizationPendingHours({ search: searchQuery })
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: ({ id, notes }: { id: number; notes?: string }) => 
      api.approveVolunteerHour(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationPendingHours'] });
      toast({ title: 'Success', description: 'Hour log approved successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to approve hour log', variant: 'destructive' });
    }
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => 
      api.rejectVolunteerHour(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationPendingHours'] });
      setIsRejectDialogOpen(false);
      setRejectReason('');
      toast({ title: 'Success', description: 'Hour log rejected' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to reject hour log', variant: 'destructive' });
    }
  });

  // Bulk approve mutation
  const bulkApproveMutation = useMutation({
    mutationFn: (ids: number[]) => api.bulkApproveHours(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationPendingHours'] });
      setSelectedHours([]);
      toast({ title: 'Success', description: 'Hours approved successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to approve hours', variant: 'destructive' });
    }
  });

  const handleApprove = (hourId: number) => {
    approveMutation.mutate({ id: hourId });
  };

  const handleReject = (hour: any) => {
    setSelectedHour(hour);
    setIsRejectDialogOpen(true);
  };

  const handleRejectSubmit = () => {
    if (selectedHour) {
      rejectMutation.mutate({ id: selectedHour.id, reason: rejectReason });
    }
  };

  const handleBulkApprove = () => {
    if (selectedHours.length > 0) {
      bulkApproveMutation.mutate(selectedHours);
    }
  };

  const toggleHourSelection = (hourId: number) => {
    setSelectedHours(prev => 
      prev.includes(hourId) 
        ? prev.filter(id => id !== hourId)
        : [...prev, hourId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedHours.length === pendingHours.length) {
      setSelectedHours([]);
    } else {
      setSelectedHours(pendingHours.map((h: any) => h.id));
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const pendingHours = Array.isArray(pendingHoursData?.data) 
    ? pendingHoursData.data 
    : Array.isArray(pendingHoursData) 
    ? pendingHoursData 
    : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Hours Approval</h2>
          <p className="text-muted-foreground">Review and approve volunteer hour submissions.</p>
        </div>
        {selectedHours.length > 0 && (
          <Button onClick={handleBulkApprove} disabled={bulkApproveMutation.isLoading}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve {selectedHours.length} Selected
          </Button>
        )}
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({pendingHours.length})
          </TabsTrigger>
          <TabsTrigger value="all">All Hours</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4 mt-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by volunteer name or event..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedHours.length === pendingHours.length && pendingHours.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </TableHead>
                    <TableHead>Volunteer</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingHours.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No pending hours to review</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    pendingHours.map((hour: any) => (
                      <TableRow key={hour.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedHours.includes(hour.id)}
                            onChange={() => toggleHourSelection(hour.id)}
                            className="rounded border-gray-300"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>
                                {hour.first_name?.[0]}{hour.last_name?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{hour.first_name} {hour.last_name}</div>
                              <div className="text-xs text-muted-foreground">{hour.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{hour.event_title || 'N/A'}</TableCell>
                        <TableCell>{new Date(hour.date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge>{hour.hours} hrs</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {hour.description || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => handleApprove(hour.id)}
                              disabled={approveMutation.isLoading}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleReject(hour)}
                              disabled={rejectMutation.isLoading}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
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
        </TabsContent>

        <TabsContent value="all" className="mt-4">
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <p>All hours history will be displayed here</p>
              <p className="text-sm mt-2">Feature coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Hour Log</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this hour submission.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Rejection Reason</Label>
              <Textarea
                id="reason"
                placeholder="e.g., Event date doesn't match records, hours seem incorrect..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="h-24"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectSubmit}
              disabled={!rejectReason.trim() || rejectMutation.isLoading}
            >
              {rejectMutation.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
