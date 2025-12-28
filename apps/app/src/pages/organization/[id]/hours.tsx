import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle2, XCircle, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { axios } from '@/lib/axios';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function OrgVolunteerHoursPage() {
  const { id: orgId } = useParams();

  const [hours, setHours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Rejection dialog
  const [rejectParams, setRejectParams] = useState<{ ids: number[]; open: boolean }>({ ids: [], open: false });
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchHours = async () => {
    if (!orgId) return;
    try {
      setLoading(true);
      const res: any = await axios.get('/hours', {
        params: {
          organizationId: orgId,
          status: statusFilter === 'all' ? undefined : statusFilter,
          limit: 50
        }
      });
      const items = Array.isArray(res) ? res : (res?.data?.data ?? res?.data ?? []);
      setHours(items);
      setSelectedIds([]);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load hours');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orgId) {
      fetchHours();
    }
  }, [orgId, statusFilter]);

  const handleStatusUpdate = async (ids: number[], status: 'approved' | 'rejected', reason?: string) => {
    try {
      await axios.post('/hours/bulk-status', {
        ids,
        status,
        rejectionReason: reason
      });
      toast.success(`Hours ${status} successfully`);
      setRejectParams({ ids: [], open: false });
      setRejectionReason('');
      fetchHours();
    } catch (err: any) {
      toast.error('Failed to update status');
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === hours.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(hours.map((h) => h.id));
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Volunteer Hours Review</h1>
          <p className="text-muted-foreground">Manage and approve volunteer submitted hours.</p>
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="all">All Records</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row justify-between">
          <CardTitle>Submissions</CardTitle>
          {selectedIds.length > 0 && (
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleStatusUpdate(selectedIds, 'approved')}
                className="bg-green-600 hover:bg-green-700"
              >
                Approve ({selectedIds.length})
              </Button>
              <Button size="sm" variant="destructive" onClick={() => setRejectParams({ ids: selectedIds, open: true })}>
                Reject ({selectedIds.length})
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={hours.length > 0 && selectedIds.length === hours.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>Volunteer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : hours.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No submissions found.
                  </TableCell>
                </TableRow>
              ) : (
                hours.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Checkbox checked={selectedIds.includes(log.id)} onCheckedChange={() => toggleSelect(log.id)} />
                    </TableCell>
                    <TableCell className="font-medium">
                      {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'Unknown User'}
                    </TableCell>
                    <TableCell>{format(new Date(log.date), 'MMM d, yyyy')}</TableCell>
                    <TableCell>{log.event?.title || 'Unknown Event'}</TableCell>
                    <TableCell>{log.hours}</TableCell>
                    <TableCell className="max-w-xs truncate" title={log.notes}>
                      {log.notes}
                    </TableCell>
                    <TableCell>
                      {log.status === 'approved' && <Badge className="bg-green-500">Approved</Badge>}
                      {log.status === 'rejected' && <Badge variant="destructive">Rejected</Badge>}
                      {log.status === 'pending' && <Badge variant="secondary">Pending</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      {log.status === 'pending' && (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-green-600"
                            onClick={() => handleStatusUpdate([log.id], 'approved')}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-red-600"
                            onClick={() => setRejectParams({ ids: [log.id], open: true })}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={rejectParams.open}
        onOpenChange={(open) => !open && setRejectParams((prev) => ({ ...prev, open: false }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Submissions</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting these volunteer hours. This will be visible to the volunteer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea
                placeholder="e.g. Activity not verified, Duplicate submission..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectParams((prev) => ({ ...prev, open: false }))}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleStatusUpdate(rejectParams.ids, 'rejected', rejectionReason)}
              disabled={!rejectionReason}
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
