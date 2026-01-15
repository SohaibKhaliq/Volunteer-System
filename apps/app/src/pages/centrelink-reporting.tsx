import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  FileText,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { safeFormatDate } from '@/lib/format-utils';
import { toast } from '@/components/atoms/use-toast';

export default function CentrelinkReporting() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
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
  const { isLoading: isLoadingSU462 } = useQuery({
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
        title: t('Export successful'),
        description: t('SU462 report has been downloaded'),
      });
    } catch (error: any) {
      toast({
        title: t('Export failed'),
        description: error?.response?.data?.message || t('Failed to export SU462 report'),
        variant: 'destructive',
      });
    }
  };

  if (isLoadingFortnight) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-64 bg-muted animate-pulse" />
        <div className="container px-4 mx-auto -mt-32 space-y-6">
          <Skeleton className="h-48 w-full rounded-3xl" />
          <Skeleton className="h-96 w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!fortnightData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-md rounded-3xl border-destructive/20 shadow-2xl">
          <AlertCircle className="h-5 w-5" />
          <AlertDescription className="font-medium">
            {t('Failed to load Centrelink fortnight data. Please try again.')}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const { user, fortnight, summary, hours } = fortnightData;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-primary pt-20 pb-40">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:30px_30px]" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-primary/90" />
        <div className="container relative px-4 mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-4">
              <Button
                variant="ghost"
                onClick={() => navigate(-1)}
                className="text-white/80 hover:text-white hover:bg-white/10 rounded-full px-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('Back')}
              </Button>
              <div className="space-y-1">
                <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white">
                  {t('Centrelink Reporting')}
                </h1>
                <p className="text-primary-foreground/70 text-lg font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  {user.firstName} {user.lastName} • {user.email}
                </p>
              </div>
            </div>
            <Button
              onClick={handleExportCSV}
              disabled={!selectedPeriod && hours.length === 0}
              className="bg-white text-primary hover:bg-white/90 rounded-2xl h-14 px-8 font-black shadow-2xl transition-all hover:scale-105 active:scale-95"
            >
              <Download className="h-5 w-5 mr-3" />
              {t('Export SU462')}.csv
            </Button>
          </div>
        </div>
      </div>

      <div className="container px-4 mx-auto -mt-24 space-y-8 relative z-10">
        {/* Statistics Grid */}
        <Card className="border-border/50 shadow-2xl shadow-primary/10 rounded-[2.5rem] bg-card overflow-hidden">
          <CardHeader className="p-8 md:p-10 pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                  <Calendar className="h-6 w-6" />
                </div>
                <CardTitle className="text-2xl font-black">{t('Current Fortnight')}</CardTitle>
              </div>
              <CardDescription className="text-lg font-medium pl-14">
                {fortnight.formatted}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-8 md:p-10 pt-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {[
                { label: t('Total Hours'), value: summary.totalHours, color: 'text-foreground', icon: Clock },
                { label: t('Approved'), value: summary.approvedHours, color: 'text-emerald-500', icon: CheckCircle },
                { label: t('Pending'), value: summary.pendingHours, color: 'text-orange-500', icon: AlertCircle },
                { label: t('Activities'), value: summary.activities, color: 'text-primary', icon: FileText }
              ].map((stat, i) => (
                <div key={i} className="space-y-3 p-6 rounded-3xl bg-muted/30 border border-border/50 group hover:border-primary/20 transition-all">
                  <div className="flex items-center justify-between">
                    <stat.icon className={cn("h-5 w-5", stat.color)} />
                    <div className="h-1.5 w-1.5 rounded-full bg-border" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{stat.label}</p>
                    <p className={cn("text-4xl font-black tracking-tight", stat.color)}>{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Hours Breakdown */}
          <Card className="lg:col-span-2 border-border/50 shadow-2xl shadow-black/5 rounded-[2.5rem] bg-card overflow-hidden">
            <CardHeader className="p-8 border-b bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl font-black flex items-center gap-3">
                    <Clock className="h-5 w-5 text-primary" />
                    {t('Volunteer Hours')}
                  </CardTitle>
                  <CardDescription className="font-medium text-muted-foreground">
                    {t('Fortnight')} {fortnight.period} • {safeFormatDate(fortnight.start, 'dd MMM')} - {safeFormatDate(fortnight.end, 'dd MMM yyyy')}
                  </CardDescription>
                </div>
                <Badge variant={summary.approvedHours > 0 ? 'default' : 'secondary'} className="px-4 py-1.5 rounded-full font-bold">
                  {summary.approvedHours} {t('approved hours')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {hours.length === 0 ? (
                <div className="p-12 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                    <Clock className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-lg font-medium text-muted-foreground">
                    {t('No volunteer hours recorded for this period.')}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-none hover:bg-transparent">
                        <TableHead className="px-8 py-5 text-sm font-bold uppercase tracking-wider text-muted-foreground">{t('Date')}</TableHead>
                        <TableHead className="px-8 py-5 text-sm font-bold uppercase tracking-wider text-muted-foreground">{t('Duration')}</TableHead>
                        <TableHead className="px-8 py-5 text-sm font-bold uppercase tracking-wider text-muted-foreground text-right">{t('Status')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {hours.map((hour: any, index: number) => (
                        <TableRow key={index} className="border-border/50 hover:bg-muted/10 transition-colors">
                          <TableCell className="px-8 py-6 font-bold text-lg">
                            {safeFormatDate(hour.date, 'dd MMM yyyy')}
                          </TableCell>
                          <TableCell className="px-8 py-6">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-primary/5 text-primary font-black">
                              {hour.hours} {t('hours')}
                            </div>
                          </TableCell>
                          <TableCell className="px-8 py-6 text-right">
                            {hour.approved ? (
                              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 px-4 py-1 rounded-full font-bold">
                                <CheckCircle className="h-3 w-3 mr-1.5" />
                                {t('Approved')}
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="px-4 py-1 rounded-full font-bold">
                                <Clock className="h-3 w-3 mr-1.5" />
                                {t('Pending')}
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SU462 Card */}
          <div className="space-y-6">
            <Card className="border-border/50 shadow-2xl shadow-black/5 rounded-[2.5rem] bg-card overflow-hidden">
              <CardHeader className="p-8 pb-4">
                <div className="p-3 w-fit rounded-2xl bg-primary/10 text-primary mb-4">
                  <FileText className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl font-black">{t('SU462 - Activity Form')}</CardTitle>
                <CardDescription className="text-md font-medium">
                  {t('Export for Centrelink mutual obligation reporting')}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-4 space-y-6">
                <div className="p-5 rounded-2xl bg-muted/50 border border-border/50 space-y-4">
                  <p className="font-black text-sm uppercase tracking-wider text-muted-foreground">{t('Includes')}:</p>
                  <ul className="space-y-3">
                    {[
                      t('Verified volunteer hours'),
                      t('Organization ABN & contact'),
                      t('Official supervisor declaration'),
                      t('Approved period data')
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm font-bold text-foreground/80">
                        <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {summary.approvedHours === 0 && (
                  <Alert variant="destructive" className="rounded-2xl border-destructive/20 bg-destructive/5">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm font-bold">
                      {t('Approved hours needed to generate report')}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex flex-col gap-3">
                  <Button
                    onClick={() => setSelectedPeriod(fortnight.period)}
                    disabled={summary.approvedHours === 0 || isLoadingSU462}
                    className="w-full h-12 rounded-xl font-black shadow-lg shadow-primary/20"
                  >
                    {t('View Details')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleExportCSV}
                    disabled={summary.approvedHours === 0}
                    className="w-full h-12 rounded-xl font-black border-primary/20 hover:bg-primary/5"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {t('Download CSV')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Alert className="rounded-3xl border-primary/20 bg-primary/5 p-6">
              <AlertCircle className="h-5 w-5 text-primary" />
              <AlertDescription className="text-sm font-medium pl-2 leading-relaxed">
                {t('Remember to report your income and volunteer hours to Centrelink by the end of your reporting period to avoid payment delays.')}
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    </div>
  );
}
