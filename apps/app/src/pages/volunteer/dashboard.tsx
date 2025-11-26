import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Award, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const VolunteerDashboard = () => {
  const { t } = useTranslation();

  // Fetch user stats (mocked for now if endpoint doesn't exist)
  const { data: stats } = useQuery({
    queryKey: ['volunteer-stats'],
    queryFn: async () => {
      // Try to fetch from a dedicated endpoint, or fallback to mocking
      try {
        const res = await api.getCurrentUser();
        return {
          hours: res.data.total_hours || 12,
          events: res.data.events_attended || 3,
          impact: 'High'
        };
      } catch (e) {
        return { hours: 0, events: 0, impact: 'N/A' };
      }
    }
  });

  const { data: upcomingEvents } = useQuery({
    queryKey: ['volunteer-upcoming-events'],
    queryFn: async () => {
      const res = await api.listEvents();
      return res.data;
    }
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">{t('Welcome back, Volunteer!')}</h1>
        <p className="text-slate-600">{t('Here is an overview of your impact and upcoming activities.')}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('Total Hours')}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.hours || 0}</div>
            <p className="text-xs text-muted-foreground">{t('Hours contributed so far')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('Events Attended')}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.events || 0}</div>
            <p className="text-xs text-muted-foreground">{t('Community events joined')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('Impact Level')}</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.impact || 'Starter'}</div>
            <p className="text-xs text-muted-foreground">{t('Keep up the great work!')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Opportunities */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{t('Recommended for You')}</h2>
          <Link to="/map">
            <Button variant="ghost" size="sm">{t('View All')} <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {upcomingEvents?.map((event: any) => (
            <div key={event.id} className="bg-white border rounded-xl overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-40 bg-slate-200 relative">
                 {/* Placeholder image */}
                 <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                 <div className="absolute bottom-3 left-3 text-white font-semibold">{event.title}</div>
              </div>
              <div className="p-4">
                <p className="text-sm text-slate-600 line-clamp-2 mb-4">{event.description}</p>
                <Link to={`/detail/event/${event.id}`}>
                  <Button className="w-full" variant="outline">{t('View Details')}</Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VolunteerDashboard;
