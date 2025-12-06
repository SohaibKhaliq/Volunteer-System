import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from '@/components/atoms/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, QrCode, Clock, Users, ClipboardCheck, RefreshCw, UserCheck } from 'lucide-react';

interface Attendance {
  id: number;
  opportunityId: number;
  userId: number;
  checkInAt: string;
  checkOutAt?: string;
  method: string;
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
  };
}

interface Opportunity {
  id: number;
  title: string;
  startAt: string;
  status: string;
}

export default function OrganizationAttendances() {
  const queryClient = useQueryClient();
  const [selectedOpportunity, setSelectedOpportunity] = useState<string>('');
  const [isQRDialogOpen, setIsQRDialogOpen] = useState(false);
  const [isManualCheckInOpen, setIsManualCheckInOpen] = useState(false);
  const [qrCodeData, setQRCodeData] = useState<{ checkinCode: string; qrData: any } | null>(null);
  const [manualCheckInData, setManualCheckInData] = useState({
    user_id: '',
    check_in_at: '',
    check_out_at: '',
    notes: ''
  });

  // Fetch Opportunities for filter
  const { data: opportunities } = useQuery({
    queryKey: ['organizationOpportunities'],
    queryFn: () => api.listOrganizationOpportunities({ status: 'published' })
  });

  // Fetch Attendances
  const { data: attendances, isLoading } = useQuery({
    queryKey: ['organizationAttendances', selectedOpportunity],
    queryFn: () =>
      api.listOrganizationAttendances({
        opportunity_id: selectedOpportunity || undefined
      })
  });

  // Get check-in code mutation
  const getCheckinCodeMutation = useMutation({
    mutationFn: (opportunityId: number) => api.getOpportunityCheckinCode(opportunityId),
    onSuccess: (data: any) => {
      setQRCodeData(data);
      setIsQRDialogOpen(true);
    },
    onError: () => {
      toast.error('Failed to get check-in code');
    }
  });

  // Regenerate check-in code mutation
  const regenerateCodeMutation = useMutation({
    mutationFn: (opportunityId: number) => api.regenerateOpportunityCheckinCode(opportunityId),
    onSuccess: (data: any) => {
      setQRCodeData(data);
      toast.success('Check-in code regenerated');
    },
    onError: () => {
      toast.error('Failed to regenerate code');
    }
  });

  // Manual check-in mutation
  const manualCheckInMutation = useMutation({
    mutationFn: ({ opportunityId, data }: { opportunityId: number; data: any }) =>
      api.manualCheckIn(opportunityId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationAttendances'] });
      setIsManualCheckInOpen(false);
      setManualCheckInData({ user_id: '', check_in_at: '', check_out_at: '', notes: '' });
      toast.success('Attendance recorded');
    },
    onError: () => {
      toast.error('Failed to record attendance');
    }
  });

  const handleShowQRCode = (opportunityId: number) => {
    getCheckinCodeMutation.mutate(opportunityId);
  };

  const handleManualCheckIn = () => {
    if (!selectedOpportunity || !manualCheckInData.user_id) {
      toast.error('Please select an opportunity and enter a user ID');
      return;
    }
    manualCheckInMutation.mutate({
      opportunityId: parseInt(selectedOpportunity, 10),
      data: manualCheckInData
    });
  };

  const formatDuration = (checkIn: string, checkOut?: string): string => {
    if (!checkOut) return 'Active';
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const hours = Math.round(((end.getTime() - start.getTime()) / (1000 * 60 * 60)) * 10) / 10;
    return `${hours} hrs`;
  };

  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'qr':
        return <Badge className="bg-purple-500">QR</Badge>;
      case 'manual':
        return <Badge variant="secondary">Manual</Badge>;
      default:
        return <Badge variant="outline">{method}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const attendancesList = Array.isArray(attendances) ? attendances : (attendances as any)?.data || [];

  const opportunitiesList = Array.isArray(opportunities) ? opportunities : (opportunities as any)?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Attendance Tracking</h2>
          <p className="text-muted-foreground">Track volunteer check-ins and check-outs for your opportunities.</p>
        </div>
        <div className="flex gap-2">
          {selectedOpportunity && (
            <>
              <Button variant="outline" onClick={() => handleShowQRCode(parseInt(selectedOpportunity, 10))}>
                <QrCode className="h-4 w-4 mr-2" />
                Show QR Code
              </Button>
              <Button variant="outline" onClick={() => setIsManualCheckInOpen(true)}>
                <UserCheck className="h-4 w-4 mr-2" />
                Manual Check-in
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Check-ins</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendancesList.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Currently Active</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendancesList.filter((a: Attendance) => !a.checkOutAt).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">QR Check-ins</CardTitle>
            <QrCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {attendancesList.filter((a: Attendance) => a.method === 'qr').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendancesList.filter((a: Attendance) => a.checkOutAt).length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={selectedOpportunity} onValueChange={setSelectedOpportunity}>
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Filter by opportunity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Opportunities</SelectItem>
            {opportunitiesList.map((opp: Opportunity) => (
              <SelectItem key={opp.id} value={opp.id.toString()}>
                {opp.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Attendances Table */}
      {attendancesList.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ClipboardCheck className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Attendances Yet</h3>
            <p className="text-muted-foreground mb-4">Volunteers will appear here when they check in.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Attendance Records ({attendancesList.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Volunteer</TableHead>
                  <TableHead>Opportunity</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Check-out</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendancesList.map((attendance: Attendance) => (
                  <TableRow key={attendance.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={attendance.user?.avatar} />
                          <AvatarFallback>
                            {attendance.user?.firstName?.[0] || attendance.user?.email?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {attendance.user?.firstName
                              ? `${attendance.user.firstName} ${attendance.user.lastName || ''}`
                              : attendance.user?.email}
                          </div>
                          {attendance.user?.firstName && (
                            <div className="text-xs text-muted-foreground">{attendance.user.email}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{attendance.opportunity?.title || 'Unknown'}</TableCell>
                    <TableCell>
                      <div className="text-sm">{new Date(attendance.checkInAt).toLocaleDateString()}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(attendance.checkInAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      {attendance.checkOutAt ? (
                        <>
                          <div className="text-sm">{new Date(attendance.checkOutAt).toLocaleDateString()}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(attendance.checkOutAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{formatDuration(attendance.checkInAt, attendance.checkOutAt)}</TableCell>
                    <TableCell>{getMethodBadge(attendance.method)}</TableCell>
                    <TableCell>
                      {attendance.checkOutAt ? (
                        <Badge className="bg-green-500">Completed</Badge>
                      ) : (
                        <Badge className="bg-blue-500">Active</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* QR Code Dialog */}
      <Dialog open={isQRDialogOpen} onOpenChange={setIsQRDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Check-in QR Code</DialogTitle>
            <DialogDescription>Volunteers can scan this QR code to check in to the opportunity.</DialogDescription>
          </DialogHeader>
          {qrCodeData && (
            <div className="flex flex-col items-center py-4">
              <div className="bg-white p-4 rounded-lg border mb-4">
                {/* QR Code would be rendered here - using a placeholder */}
                <div className="w-48 h-48 bg-gray-100 flex items-center justify-center border-2 border-dashed">
                  <div className="text-center">
                    <QrCode className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-xs text-gray-500 break-all px-2">
                      Code: {qrCodeData.checkinCode.substring(0, 16)}...
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Check-in Code: <code className="bg-gray-100 px-2 py-1 rounded">{qrCodeData.checkinCode}</code>
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(qrCodeData.checkinCode);
                    toast.success('Code copied to clipboard');
                  }}
                >
                  Copy Code
                </Button>
                <Button
                  variant="outline"
                  onClick={() => regenerateCodeMutation.mutate(qrCodeData.qrData.opportunityId)}
                  disabled={regenerateCodeMutation.isPending}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regenerate
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsQRDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Check-in Dialog */}
      <Dialog open={isManualCheckInOpen} onOpenChange={setIsManualCheckInOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manual Check-in</DialogTitle>
            <DialogDescription>Record attendance manually for a volunteer.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="user_id" className="text-right">
                User ID *
              </Label>
              <Input
                id="user_id"
                type="number"
                className="col-span-3"
                value={manualCheckInData.user_id}
                onChange={(e) => setManualCheckInData({ ...manualCheckInData, user_id: e.target.value })}
                placeholder="Enter volunteer's user ID"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="check_in_at" className="text-right">
                Check-in Time
              </Label>
              <Input
                id="check_in_at"
                type="datetime-local"
                className="col-span-3"
                value={manualCheckInData.check_in_at}
                onChange={(e) => setManualCheckInData({ ...manualCheckInData, check_in_at: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="check_out_at" className="text-right">
                Check-out Time
              </Label>
              <Input
                id="check_out_at"
                type="datetime-local"
                className="col-span-3"
                value={manualCheckInData.check_out_at}
                onChange={(e) => setManualCheckInData({ ...manualCheckInData, check_out_at: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <Input
                id="notes"
                className="col-span-3"
                value={manualCheckInData.notes}
                onChange={(e) => setManualCheckInData({ ...manualCheckInData, notes: e.target.value })}
                placeholder="Optional notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsManualCheckInOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleManualCheckIn}
              disabled={!manualCheckInData.user_id || manualCheckInMutation.isPending}
            >
              {manualCheckInMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Record Attendance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
