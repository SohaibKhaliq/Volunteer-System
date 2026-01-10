import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Award, ArrowRight, Building2, CheckCircle, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const VolunteerDashboard = () => {
  const { t } = useTranslation();

  // Fetch volunteer dashboard data from dedicated endpoint
  const { data: dashboardData } = useQuery({
    queryKey: ['volunteer-dashboard'],
    queryFn: async () => {
      try {
        const res = await api.getVolunteerDashboard();
        return res as any;
      } catch (e) {
        // Fallback to getCurrentUser if volunteer endpoint not available
        try {
          const userRes = await api.getCurrentUser();
          return {
            stats: {
              totalHours: userRes.totalHours || userRes.hours || 0,
              eventsAttended: userRes.participationCount || 0,
              pendingApplications: 0,
              acceptedApplications: 0,
              organizationCount: (userRes.organizations || []).length
            },
            upcomingEvents: [],
            recentAchievements: userRes.achievements || []
          };
        } catch {
          return {
            stats: {
              totalHours: 0,
              eventsAttended: 0,
              pendingApplications: 0,
              acceptedApplications: 0,
              organizationCount: 0
            },
            upcomingEvents: [],
            recentAchievements: []
          };
        }
      }
    }
  });

  // Fetch public opportunities for browsing
  const { data: opportunitiesData } = useQuery({
    queryKey: ['volunteer-browse-opportunities'],
    queryFn: async () => {
      try {
        const res = await api.browseOpportunities({ perPage: 6 });
        return (res as any)?.data || [];
      } catch {
        // Fallback to events if opportunities endpoint not available
        try {
          const res = await api.listEvents();
          return (res as any)?.data || res || [];
        } catch {
          return [];
        }
      }
    }
  });

  const stats = dashboardData?.stats || {};
  const upcomingEvents = dashboardData?.upcomingEvents || [];
  const achievements = dashboardData?.recentAchievements || [];
  const opportunities = opportunitiesData || [];

  // Calculate impact level based on hours
  const getImpactLevel = (hours: number) => {
    if (hours >= 100) return { level: 'Champion', color: 'bg-purple-500' };
    if (hours >= 50) return { level: 'Leader', color: 'bg-blue-500' };
    if (hours >= 20) return { level: 'Active', color: 'bg-green-500' };
    if (hours >= 5) return { level: 'Growing', color: 'bg-yellow-500' };
    return { level: 'Starter', color: 'bg-gray-500' };
  };

  const impact = getImpactLevel(stats.totalHours || 0);
  const location = useLocation();

  // If the URL contains #profile, scroll the profile section into view when dashboard renders
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!location.hash) return;
    if (location.hash === '#profile') {
      // small timeout to ensure element is mounted
      setTimeout(() => {
        const el = document.getElementById('profile');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  }, [location.hash]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">{t('Welcome back, Volunteer!')}</h1>
        <p className="text-slate-600">{t('Here is an overview of your impact and upcoming activities.')}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('Total Hours')}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalHours || 0}</div>
            <p className="text-xs text-muted-foreground">{t('Hours contributed')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('Events Attended')}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.eventsAttended || 0}</div>
            <p className="text-xs text-muted-foreground">{t('Events completed')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('Organizations')}</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.organizationCount || 0}</div>
            <p className="text-xs text-muted-foreground">{t('Orgs joined')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('Applications')}</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.acceptedApplications || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingApplications > 0 ? `${stats.pendingApplications} pending` : t('Accepted')}
            </p>
          </CardContent>
        </Card>
        <Card className={`${impact.color} text-white`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium opacity-90">{t('Impact Level')}</CardTitle>
            <Award className="h-4 w-4 opacity-90" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{impact.level}</div>
            <p className="text-xs opacity-90">{t('Keep up the great work!')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Events Section */}
      {upcomingEvents.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">{t('Your Upcoming Events')}</h2>
            <Link to="/volunteer/history">
              <Button variant="ghost" size="sm">
                {t('View All')} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingEvents.map((event: any) => (
              <Card key={event.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{event.title}</CardTitle>
                    <Badge variant="secondary">{t('Confirmed')}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(event.startAt).toLocaleDateString()}</span>
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <span>{event.location}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Browse Opportunities */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{t('Browse Opportunities')}</h2>
          <Link to="/organizations">
            <Button variant="ghost" size="sm">
              {t('View All')} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {opportunities.slice(0, 6).map((opp: any) => (
            <div key={opp.id} className="bg-white border rounded-xl overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-32 bg-gradient-to-r from-blue-500 to-indigo-600 relative">
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-3 left-3 text-white font-semibold">{opp.title}</div>
                {opp.organization && (
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-white/20 text-white border-0">{opp.organization.name}</Badge>
                  </div>
                )}
              </div>
              <div className="p-4">
                <p className="text-sm text-slate-600 line-clamp-2 mb-3">{opp.description}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                  <Calendar className="h-3 w-3" />
                  <span>{opp.startAt ? new Date(opp.startAt || opp.start_at).toLocaleDateString() : 'TBD'}</span>
                  {opp.capacity && (
                    <>
                      <Users className="h-3 w-3 ml-2" />
                      <span>{opp.capacity} spots</span>
                    </>
                  )}
                </div>
                <Link to={`/opportunities/${opp.id}`}>
                  <Button className="w-full" variant="outline">
                    {t('View Details')}
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Achievements */}
      {achievements.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">{t('Recent Achievements')}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {achievements.slice(0, 3).map((ach: any) => (
              <Card key={ach.id} className="border-l-4 border-l-yellow-500">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-yellow-500" />
                    <CardTitle className="text-base">{ach.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{ach.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VolunteerDashboard;
