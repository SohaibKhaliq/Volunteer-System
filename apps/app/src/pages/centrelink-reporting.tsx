import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Download,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/components/atoms/use-toast';

export default function CentrelinkReporting() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);

  // Get current fortnight data
  const { data: fortnightData, isLoading: isLoadingFortnight } = useQuery({
    queryKey: ['centrelink', 'fortnight', userId],
    queryFn: async () => {
      const response = await api.getCentrelinkFortnight(Number(userId));
      return response.data || response;
    },
    enabled: !!userId
  });

  // Get SU462 data if a period is selected
  const { data: su462Data, isLoading: isLoadingSU462 } = useQuery({
    queryKey: ['centrelink', 'su462', userId, selectedPeriod],
    queryFn: async () => {
      const response = await api.generateSU462(Number(userId), selectedPeriod || undefined);
      return response.data || response;
    },
    enabled: !!userId && selectedPeriod !== null
  });

  const handleExportCSV = async () => {
    try {
      const response = await api.exportSU462CSV(Number(userId), selectedPeriod || undefined);
      
      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data || response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `SU462_Fortnight${selectedPeriod || 'Current'}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Export successful',
        description: 'SU462 report has been downloaded'
      });
    } catch (error: any) {
      toast({
        title: 'Export failed',
        description: error?.response?.data?.message || 'Failed to export SU462 report',
        variant: 'destructive'
      });
    }
  };

  if (isLoadingFortnight) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!fortnightData) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load Centrelink fortnight data. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const { user, fortnight, summary, hours } = fortnightData;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Centrelink Reporting</h1>
            <p className="text-muted-foreground">
              {user.firstName} {user.lastName} ({user.email})
            </p>
          </div>
        </div>
        <Button onClick={handleExportCSV} disabled={!selectedPeriod && hours.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Export SU462 CSV
        </Button>
      </div>

      {/* Current Fortnight Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <CardTitle>Current Fortnight</CardTitle>
          </div>
          <CardDescription>{fortnight.formatted}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Hours</p>
              <p className="text-2xl font-bold">{summary.totalHours}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Approved Hours</p>
              <p className="text-2xl font-bold text-green-600">{summary.approvedHours}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Pending Hours</p>
              <p className="text-2xl font-bold text-orange-600">{summary.pendingHours}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Activities</p>
              <p className="text-2xl font-bold">{summary.activities}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hours Breakdown */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <CardTitle>Volunteer Hours - Fortnight {fortnight.period}</CardTitle>
            </div>
            <Badge variant={summary.approvedHours > 0 ? 'default' : 'secondary'}>
              {summary.approvedHours} approved hours
            </Badge>
          </div>
          <CardDescription>
            Period: {format(new Date(fortnight.start), 'dd MMM yyyy')} -{' '}
            {format(new Date(fortnight.end), 'dd MMM yyyy')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hours.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No volunteer hours recorded for this fortnight period.
              </AlertDescription>
            </Alert>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hours.map((hour: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell>{format(new Date(hour.date), 'dd MMM yyyy')}</TableCell>
                    <TableCell className="font-medium">{hour.hours} hours</TableCell>
                    <TableCell>
                      {hour.approved ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Approved
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <XCircle className="h-3 w-3" />
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* SU462 Form Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <CardTitle>SU462 - Approved Activity Form</CardTitle>
          </div>
          <CardDescription>
            Export this form for Centrelink mutual obligation reporting
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              <p className="font-semibold mb-2">About SU462 Form:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Used to verify volunteer hours for Centrelink recipients</li>
                <li>Includes organization details (ABN, supervisor contact)</li>
                <li>Shows approved hours for the fortnight period</li>
                <li>Declaration: "Paid positions not being replaced by volunteers"</li>
              </ul>
            </AlertDescription>
          </Alert>

          {summary.approvedHours === 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No approved hours for this fortnight. You need approved hours to generate an SU462 report.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              onClick={() => setSelectedPeriod(fortnight.period)}
              disabled={summary.approvedHours === 0 || isLoadingSU462}
            >
              <FileText className="h-4 w-4 mr-2" />
              View SU462 Details
            </Button>
            <Button
              variant="outline"
              onClick={handleExportCSV}
              disabled={summary.approvedHours === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Download CSV
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
