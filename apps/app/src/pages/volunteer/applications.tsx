import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, MapPin, Building2, Loader2, ArrowRight, CheckCircle2, Clock, XCircle, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const VolunteerApplicationsPage = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'timeline'>('table');

  // Fetch applications
  const { data: applicationsData, isLoading } = useQuery({
    queryKey: ['volunteer-applications', activeTab],
    queryFn: async () => {
      try {
        const params = activeTab !== 'all' ? { status: activeTab } : {};
        const res = await api.getVolunteerApplications(params);
        return (res as any)?.data || [];
      } catch {
        return [];
      }
    }
  });

  // Withdraw application mutation
  const withdrawMutation = useMutation({
    mutationFn: (id: number) => api.withdrawApplication(id),
    onSuccess: () => {
      toast.success(t('Application withdrawn'));
      queryClient.invalidateQueries({ queryKey: ['volunteer-applications'] });
    },
    onError: () => {
      toast.error(t('Failed to withdraw application'));
    }
  });

  const applications = applicationsData || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'applied':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            {t('Pending')}
          </Badge>
        );
      case 'accepted':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            {t('Accepted')}
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            {t('Rejected')}
          </Badge>
        );
      case 'withdrawn':
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            {t('Withdrawn')}
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'TBD';
    return new Date(dateString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleWithdraw = (id: number) => {
    if (window.confirm(t('Are you sure you want to withdraw this application?'))) {
      withdrawMutation.mutate(id);
    }
  };

  // Summary stats
  const summary = {
    total: applications.length,
    pending: applications.filter((a: any) => a.status === 'applied').length,
    accepted: applications.filter((a: any) => a.status === 'accepted').length,
    rejected: applications.filter((a: any) => a.status === 'rejected').length
  };

  // Timeline component for an individual application
  const ApplicationTimeline = ({ app }: { app: any }) => {
    const events = [];

    // Applied event
    if (app.appliedAt || app.applied_at || app.createdAt) {
      events.push({
        icon: Send,
        title: 'Application Submitted',
        date: app.appliedAt || app.applied_at || app.createdAt,
        status: 'completed',
        color: 'text-blue-600'
      });
    }

    // Status events
    if (app.status === 'accepted') {
      events.push({
        icon: CheckCircle2,
        title: 'Application Accepted',
        date: app.updatedAt || app.updated_at,
        status: 'completed',
        color: 'text-green-600'
      });
    } else if (app.status === 'rejected') {
      events.push({
        icon: XCircle,
        title: 'Application Rejected',
        date: app.updatedAt || app.updated_at,
        status: 'completed',
        color: 'text-red-600'
      });
    } else if (app.status === 'applied') {
      events.push({
        icon: Clock,
        title: 'Under Review',
        date: null,
        status: 'pending',
        color: 'text-yellow-600'
      });
    }

    return (
      <div className="relative pl-8 pb-8 border-l-2 border-gray-200 last:border-l-0 last:pb-0">
        {events.map((event, idx) => {
          const Icon = event.icon;
          return (
            <div key={idx} className="relative mb-6 last:mb-0">
              <div
                className={`absolute -left-[2.15rem] w-8 h-8 rounded-full flex items-center justify-center ${event.status === 'completed' ? 'bg-white border-2 border-current' : 'bg-gray-100'
                  } ${event.color}`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className={`font-medium ${event.color}`}>{event.title}</p>
                {event.date && <p className="text-sm text-muted-foreground">{format(new Date(event.date), 'PPP p')}</p>}
                {!event.date && event.status === 'pending' && (
                  <p className="text-sm text-muted-foreground">Awaiting response...</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card/30 p-8 rounded-[2.5rem] border border-border/50 backdrop-blur-sm shadow-2xl shadow-primary/5">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight text-foreground">{t('My Applications')}</h1>
          <p className="text-lg text-muted-foreground font-medium">{t('Track the status of your volunteer applications.')}</p>
        </div>

        {/* View toggle */}
        <div className="flex bg-muted/50 p-1.5 rounded-2xl border border-border/50">
          <Button
            variant={viewMode === 'table' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('table')}
            className={cn("rounded-xl font-bold h-10 px-4", viewMode === 'table' ? "shadow-lg" : "text-muted-foreground")}
          >
            {t('Table View')}
          </Button>
          <Button
            variant={viewMode === 'timeline' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('timeline')}
            className={cn("rounded-xl font-bold h-10 px-4", viewMode === 'timeline' ? "shadow-lg" : "text-muted-foreground")}
          >
            {t('Timeline View')}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: t('Total Applications'), value: summary.total, color: 'text-primary', bg: 'bg-primary/10' },
          { label: t('Pending'), value: summary.pending, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { label: t('Accepted'), value: summary.accepted, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: t('Rejected'), value: summary.rejected, color: 'text-rose-500', bg: 'bg-rose-500/10' }
        ].map((stat, i) => (
          <Card key={i} className="group hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 border-border/50 rounded-[2rem] bg-card overflow-hidden">
            <CardContent className="p-6 md:p-8 space-y-2">
              <div className={cn("text-3xl md:text-4xl font-black tracking-tight", stat.color)}>{stat.value}</div>
              <p className="text-xs md:text-sm font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs for filtering */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <Card className="p-2 border-border/50 shadow-2xl shadow-primary/5 rounded-[2rem] bg-card/80 backdrop-blur-md overflow-x-auto">
          <TabsList className="bg-transparent h-12 w-full justify-start gap-2 p-0">
            {[
              { value: 'all', label: t('All') },
              { value: 'applied', label: t('Pending') },
              { value: 'accepted', label: t('Accepted') },
              { value: 'rejected', label: t('Rejected') }
            ].map(tab => (
              <TabsTrigger key={tab.value} value={tab.value} className="h-10 px-6 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white font-bold transition-all">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Card>

        <TabsContent value={activeTab} className="mt-4">
          {viewMode === 'table' ? (
            <Card className="border-border/50 shadow-2xl shadow-primary/5 rounded-[2.5rem] bg-card overflow-hidden">
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex items-center justify-center py-24">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  </div>
                ) : applications.length === 0 ? (
                  <div className="text-center py-24">
                    <div className="w-20 h-20 bg-muted rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                      <List className="h-10 w-10 text-muted-foreground/30" />
                    </div>
                    <p className="text-xl font-bold text-muted-foreground mb-8">{t('No applications found')}</p>
                    <Link to="/organizations">
                      <Button size="lg" className="h-14 px-8 rounded-2xl font-black shadow-xl shadow-primary/20">
                        {t('Browse Opportunities')}
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-muted/30">
                        <TableRow className="hover:bg-transparent border-border/50">
                          <TableHead className="px-8 py-6 font-black uppercase tracking-widest text-xs">{t('Opportunity')}</TableHead>
                          <TableHead className="px-8 py-6 font-black uppercase tracking-widest text-xs">{t('Organization')}</TableHead>
                          <TableHead className="px-8 py-6 font-black uppercase tracking-widest text-xs">{t('Date')}</TableHead>
                          <TableHead className="px-8 py-6 font-black uppercase tracking-widest text-xs">{t('Status')}</TableHead>
                          <TableHead className="px-8 py-6 font-black uppercase tracking-widest text-xs text-right">{t('Actions')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {applications.map((app: any) => (
                          <TableRow key={app.id} className="border-border/50 hover:bg-muted/20 transition-colors group">
                            <TableCell className="px-8 py-6">
                              <div className="font-black text-lg tracking-tight group-hover:text-primary transition-colors">{app.opportunity?.title || 'Unknown'}</div>
                              {app.opportunity?.location && (
                                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mt-1">
                                  <MapPin className="h-3.5 w-3.5 text-primary/60" />
                                  {app.opportunity.location}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="px-8 py-6">
                              <div className="flex items-center gap-3 font-bold text-muted-foreground">
                                <Building2 className="h-4 w-4 text-primary/60" />
                                {app.opportunity?.organization?.name || 'Unknown'}
                              </div>
                            </TableCell>
                            <TableCell className="px-8 py-6">
                              <div className="flex items-center gap-3 font-bold text-muted-foreground">
                                <Calendar className="h-4 w-4 text-primary/60" />
                                {formatDate(app.opportunity?.startAt || app.opportunity?.start_at)}
                              </div>
                            </TableCell>
                            <TableCell className="px-8 py-6">{getStatusBadge(app.status)}</TableCell>
                            <TableCell className="px-8 py-6 text-right">
                              <div className="flex items-center justify-end gap-3">
                                <Link
                                  to={`/opportunities/${app.opportunity?.id || app.opportunityId || app.opportunity_id}`}
                                >
                                  <Button variant="ghost" className="rounded-xl font-bold h-10 px-4 hover:bg-primary/5 hover:text-primary group">
                                    {t('View')} <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                  </Button>
                                </Link>
                                {app.status === 'applied' && (
                                  <Button
                                    variant="outline"
                                    className="rounded-xl font-bold h-10 px-4 border-destructive/20 text-destructive hover:bg-destructive/5 hover:border-destructive/30"
                                    onClick={() => handleWithdraw(app.id)}
                                    disabled={withdrawMutation.isPending}
                                  >
                                    {t('Withdraw')}
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            /* Timeline View */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {isLoading ? (
                <div className="col-span-full flex items-center justify-center py-24">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
              ) : applications.length === 0 ? (
                <Card className="col-span-full border-border/50 shadow-2xl shadow-primary/5 rounded-[2.5rem] bg-card overflow-hidden">
                  <CardContent className="text-center py-24">
                    <p className="text-xl font-bold text-muted-foreground mb-8">{t('No applications found')}</p>
                    <Link to="/organizations">
                      <Button size="lg" className="h-14 px-8 rounded-2xl font-black shadow-xl shadow-primary/20">
                        {t('Browse Opportunities')}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                applications.map((app: any) => (
                  <Card key={app.id} className="group border-border/50 rounded-[2.5rem] hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 overflow-hidden bg-card">
                    <CardHeader className="p-8 pb-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <CardTitle className="text-2xl font-black tracking-tight group-hover:text-primary transition-colors">{app.opportunity?.title || 'Unknown'}</CardTitle>
                          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-bold text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-primary/60" />
                              {app.opportunity?.organization?.name || 'Unknown'}
                            </div>
                            {app.opportunity?.location && (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-primary/60" />
                                {app.opportunity.location}
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-primary/60" />
                              {formatDate(app.opportunity?.startAt || app.opportunity?.start_at)}
                            </div>
                          </div>
                        </div>
                        <div className="shrink-0">{getStatusBadge(app.status)}</div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-8 pt-0">
                      <div className="bg-muted/30 p-8 rounded-3xl mb-8">
                        <ApplicationTimeline app={app} />
                      </div>
                      <div className="flex gap-4">
                        <Link
                          to={`/opportunities/${app.opportunity?.id || app.opportunityId || app.opportunity_id}`}
                          className="flex-1"
                        >
                          <Button className="w-full h-12 rounded-xl font-black shadow-lg shadow-primary/5 group-hover:shadow-primary/20">
                            {t('View Opportunity')}
                          </Button>
                        </Link>
                        {app.status === 'applied' && (
                          <Button
                            variant="outline"
                            className="h-12 rounded-xl font-bold px-6 border-destructive/20 text-destructive hover:bg-destructive/5 hover:border-destructive/30"
                            onClick={() => handleWithdraw(app.id)}
                            disabled={withdrawMutation.isPending}
                          >
                            {t('Withdraw')}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VolunteerApplicationsPage;
