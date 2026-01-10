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
import { cn } from '@/lib/utils';

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card/30 p-8 rounded-[2.5rem] border border-border/50 backdrop-blur-sm shadow-2xl shadow-primary/5">
        <div className="space-y-1">
          <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 mb-3 px-4 py-1.5 rounded-full font-bold">
            {t(impact.level)} {t('Volunteer')}
          </Badge>
          <h1 className="text-4xl font-black tracking-tight text-foreground">{t('Welcome back, {{name}}!', { name: 'Volunteer' })}</h1>
          <p className="text-lg text-muted-foreground font-medium">{t('Your impact this month has been exceptional.')}</p>
        </div>
        <Link to="/map" className="shrink-0">
          <Button size="lg" className="rounded-2xl h-14 px-8 font-black shadow-xl shadow-primary/20 group">
            {t('Find Opportunities')} <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {[
          { label: t('Total Hours'), value: stats.totalHours || 0, desc: t('Hours contributed'), icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: t('Events'), value: stats.eventsAttended || 0, desc: t('Events completed'), icon: Calendar, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { label: t('Orgs'), value: stats.organizationCount || 0, desc: t('Orgs joined'), icon: Building2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: t('Apps'), value: stats.acceptedApplications || 0, desc: stats.pendingApplications > 0 ? `${stats.pendingApplications} pending` : t('Accepted'), icon: CheckCircle, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
        ].map((stat, i) => (
          <Card key={i} className="group hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 border-border/50 rounded-[2.5rem] bg-card overflow-hidden">
            <CardContent className="p-8 space-y-4">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", stat.bg, stat.color)}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <div className="text-3xl font-black tracking-tight">{stat.value}</div>
                <div className="text-sm font-bold text-muted-foreground/80 uppercase tracking-widest">{stat.label}</div>
              </div>
              <p className="text-xs text-muted-foreground font-medium">{stat.desc}</p>
            </CardContent>
          </Card>
        ))}

        <Card className={cn("rounded-[2.5rem] border-none shadow-2xl shadow-primary/20 overflow-hidden relative group text-white", impact.color)}>
          <div className="absolute inset-0 bg-grid-white/[0.1] bg-[size:20px_20px]" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
          <CardContent className="p-8 space-y-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center transition-transform group-hover:rotate-12">
              <Award className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="text-3xl font-black tracking-tight">{t(impact.level)}</div>
              <div className="text-sm font-bold text-white/80 uppercase tracking-widest">{t('Impact Level')}</div>
            </div>
            <p className="text-xs text-white/70 font-medium">{t('Keep up the great work!')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Events Section */}
      {upcomingEvents.length > 0 && (
        <div className="space-y-6">
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <h2 className="text-2xl font-black tracking-tight">{t('Your Upcoming Events')}</h2>
              <p className="text-muted-foreground font-medium">{t('Stay organized with your scheduled activities.')}</p>
            </div>
            <Link to="/volunteer/history">
              <Button variant="ghost" className="rounded-xl font-bold hover:bg-primary/5 hover:text-primary group">
                {t('View All')} <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingEvents.map((event: any) => (
              <Card key={event.id} className="group border-border/50 rounded-[2rem] hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 overflow-hidden bg-card">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl font-black group-hover:text-primary transition-colors">{event.title}</CardTitle>
                    <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none px-3 py-1 rounded-lg font-bold">{t('Confirmed')}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-sm font-bold text-muted-foreground">
                      <div className="p-2 rounded-lg bg-muted text-primary">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <span>{new Date(event.startAt).toLocaleDateString()}</span>
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-3 text-sm font-bold text-muted-foreground">
                        <div className="p-2 rounded-lg bg-muted text-primary">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <span className="line-clamp-1">{event.location}</span>
                      </div>
                    )}
                  </div>
                  <Button variant="ghost" className="w-full rounded-xl font-bold border border-border/50 hover:bg-muted group">
                    {t('View Details')}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Browse Opportunities */}
      <div className="space-y-6">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <h2 className="text-2xl font-black tracking-tight">{t('Browse Opportunities')}</h2>
            <p className="text-muted-foreground font-medium">{t('Discover new ways to help your community.')}</p>
          </div>
          <Link to="/organizations">
            <Button variant="ghost" className="rounded-xl font-bold hover:bg-primary/5 hover:text-primary group">
              {t('View All')} <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {opportunities.slice(0, 6).map((opp: any) => (
            <div key={opp.id} className="group bg-card border border-border/50 rounded-[2.5rem] overflow-hidden hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500">
              <div className="h-40 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-indigo-600/80 group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-grid-white/[0.1] bg-[size:20px_20px]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-6 right-6">
                  <div className="text-white font-black text-xl tracking-tight line-clamp-1">{opp.title}</div>
                  {opp.organization && (
                    <div className="text-white/60 text-xs font-bold uppercase tracking-widest mt-1">
                      {opp.organization.name}
                    </div>
                  )}
                </div>
                {opp.organization && (
                  <div className="absolute top-4 left-6">
                    <Badge className="bg-white/10 text-white border-white/20 backdrop-blur-sm px-3 py-1 rounded-lg">
                      {opp.category || t('Community')}
                    </Badge>
                  </div>
                )}
              </div>
              <div className="p-8 space-y-6">
                <p className="text-muted-foreground font-medium line-clamp-2 leading-relaxed">{opp.description}</p>
                <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground/80">
                  <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-xl">
                    <Calendar className="h-3.5 w-3.5 text-primary" />
                    <span>{opp.startAt ? new Date(opp.startAt || opp.start_at).toLocaleDateString() : t('TBD')}</span>
                  </div>
                  {opp.capacity && (
                    <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-xl">
                      <Users className="h-3.5 w-3.5 text-primary" />
                      <span>{opp.capacity} {t('spots')}</span>
                    </div>
                  )}
                </div>
                <Link to={`/opportunities/${opp.id}`}>
                  <Button className="w-full h-12 rounded-xl font-black shadow-lg shadow-primary/5 group-hover:shadow-primary/20 transition-all">
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
        <div className="space-y-6">
          <h2 className="text-2xl font-black tracking-tight">{t('Recent Achievements')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {achievements.slice(0, 3).map((ach: any) => (
              <Card key={ach.id} className="group border-border/50 rounded-[2rem] hover:shadow-2xl hover:shadow-amber-500/5 transition-all duration-500 overflow-hidden bg-card relative">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Award className="h-16 w-16 text-amber-500" />
                </div>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600">
                      <Award className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-lg font-black">{t(ach.title)}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground font-medium leading-relaxed">{t(ach.description)}</p>
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
