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
                className={`absolute -left-[2.15rem] w-8 h-8 rounded-full flex items-center justify-center ${
                  event.status === 'completed' ? 'bg-white border-2 border-current' : 'bg-gray-100'
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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{t('My Applications')}</h1>
          <p className="text-slate-600">{t('Track the status of your volunteer applications.')}</p>
        </div>

        {/* View toggle */}
        <div className="flex gap-2">
          <Button variant={viewMode === 'table' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('table')}>
            Table View
          </Button>
          <Button
            variant={viewMode === 'timeline' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('timeline')}
          >
            Timeline View
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{summary.total}</div>
            <p className="text-sm text-muted-foreground">{t('Total Applications')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{summary.pending}</div>
            <p className="text-sm text-muted-foreground">{t('Pending')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{summary.accepted}</div>
            <p className="text-sm text-muted-foreground">{t('Accepted')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{summary.rejected}</div>
            <p className="text-sm text-muted-foreground">{t('Rejected')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for filtering */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">{t('All')}</TabsTrigger>
          <TabsTrigger value="applied">{t('Pending')}</TabsTrigger>
          <TabsTrigger value="accepted">{t('Accepted')}</TabsTrigger>
          <TabsTrigger value="rejected">{t('Rejected')}</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {viewMode === 'table' ? (
            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : applications.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4">{t('No applications found')}</p>
                    <Link to="/organizations">
                      <Button>{t('Browse Opportunities')}</Button>
                    </Link>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('Opportunity')}</TableHead>
                        <TableHead>{t('Organization')}</TableHead>
                        <TableHead>{t('Date')}</TableHead>
                        <TableHead>{t('Applied On')}</TableHead>
                        <TableHead>{t('Status')}</TableHead>
                        <TableHead className="text-right">{t('Actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {applications.map((app: any) => (
                        <TableRow key={app.id}>
                          <TableCell>
                            <div className="font-medium">{app.opportunity?.title || 'Unknown'}</div>
                            {app.opportunity?.location && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                {app.opportunity.location}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              {app.opportunity?.organization?.name || 'Unknown'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {formatDate(app.opportunity?.startAt || app.opportunity?.start_at)}
                            </div>
                          </TableCell>
                          <TableCell>
                            {formatDate(app.appliedAt || app.applied_at || app.createdAt || app.created_at)}
                          </TableCell>
                          <TableCell>{getStatusBadge(app.status)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                to={`/opportunities/${app.opportunity?.id || app.opportunityId || app.opportunity_id}`}
                              >
                                <Button variant="ghost" size="sm">
                                  {t('View')} <ArrowRight className="ml-1 h-3 w-3" />
                                </Button>
                              </Link>
                              {app.status === 'applied' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
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
                )}
              </CardContent>
            </Card>
          ) : (
            /* Timeline View */
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : applications.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <p className="text-muted-foreground mb-4">{t('No applications found')}</p>
                    <Link to="/organizations">
                      <Button>{t('Browse Opportunities')}</Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                applications.map((app: any) => (
                  <Card key={app.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl">{app.opportunity?.title || 'Unknown'}</CardTitle>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Building2 className="h-4 w-4" />
                              {app.opportunity?.organization?.name || 'Unknown'}
                            </div>
                            {app.opportunity?.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {app.opportunity.location}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatDate(app.opportunity?.startAt || app.opportunity?.start_at)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">{getStatusBadge(app.status)}</div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ApplicationTimeline app={app} />
                      <div className="flex gap-2 mt-4">
                        <Link
                          to={`/opportunities/${app.opportunity?.id || app.opportunityId || app.opportunity_id}`}
                          className="flex-1"
                        >
                          <Button variant="outline" className="w-full">
                            View Opportunity
                          </Button>
                        </Link>
                        {app.status === 'applied' && (
                          <Button
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
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
