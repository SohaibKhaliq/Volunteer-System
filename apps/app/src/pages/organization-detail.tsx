import { useTranslation } from 'react-i18next';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axios } from '@/lib/axios';
import api from '@/lib/api';
import volunteerApi from '@/lib/api/volunteerApi';
import { Button } from '@/components/ui/button';
import { MapPin, Globe, Mail, Phone, Calendar, Users, ArrowRight, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/atoms/use-toast';
import { useStore } from '@/lib/store';

const OrganizationDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, token } = useStore((state) => ({ user: state.user, token: state.token }));

  const { data: org, isLoading } = useQuery({
    queryKey: ['organization', id],
    queryFn: async () => {
      const res = await axios.get(`/organizations/${id}`);
      return res as any;
    }
  });

  const { data: events, isLoading: isLoadingEvents } = useQuery({
    queryKey: ['organization-events', id],
    queryFn: async () => {
      // Assuming we have an endpoint for this, or we filter the main events list
      const res = await axios.get(`/events?organization_id=${id}`);
      return res as any;
    },
    enabled: !!id
  });

  const joinMutation = useMutation({
    mutationFn: () => volunteerApi.joinOrganization(Number(id)),
    onSuccess: () => {
      toast({
        title: t('Success'),
        description: t('Successfully joined the organization! Your request is pending approval.')
      });
      queryClient.invalidateQueries({ queryKey: ['organization', id] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || t('Failed to join organization');
      toast({
        title: t('Error'),
        description: message,
        variant: 'destructive'
      });
    }
  });

  const handleJoinOrganization = () => {
    // If we have a stored auth token, allow the action — don't redirect
    // the user back to login while their profile is still being loaded.
    if (!user && !token) {
      toast({
        title: t('Login Required'),
        description: t('Please log in to join this organization'),
        variant: 'destructive'
      });
      // Preserve current URL for redirect after login
      const returnTo = encodeURIComponent(window.location.pathname + window.location.search + window.location.hash);
      navigate(`/login?returnTo=${returnTo}`);
      return;
    }
    joinMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!org) {
    return <div className="container py-20 text-center">{t('Organization not found')}</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Header / Banner */}
      <div className="bg-white border-b">
        <div className="h-48 md:h-64 bg-slate-200 relative overflow-hidden">
          {/* Fallback banner or actual banner if available */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary/40" />
        </div>

        <div className="container px-4 relative -mt-16 pb-8">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="w-32 h-32 bg-white rounded-xl shadow-lg p-2 flex items-center justify-center overflow-hidden">
              {org.logo ? (
                <img src={org.logo} alt={org.name} className="w-full h-full object-contain" />
              ) : (
                <Users className="w-12 h-12 text-slate-300" />
              )}
            </div>

            <div className="flex-1 pt-2 md:pt-16">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 mb-2">{org.name}</h1>
                  <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                    {org.type && <Badge variant="secondary">{org.type}</Badge>}
                    {org.address && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {org.address}
                      </div>
                    )}
                  </div>
                </div>
                <Button size="lg" onClick={handleJoinOrganization} disabled={joinMutation.isPending}>
                  {joinMutation.isPending ? t('Joining...') : t('Join Organization')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About */}
            <section className="bg-white p-8 rounded-xl shadow-sm">
              <h2 className="text-xl font-bold mb-4">{t('About Us')}</h2>
              <div className="prose max-w-none text-slate-600">
                <p>{org.description || t('No description available.')}</p>
              </div>
            </section>

            {/* Upcoming Events */}
            <section>
              <h2 className="text-xl font-bold mb-4">{t('Upcoming Opportunities')}</h2>
              {isLoadingEvents ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : events && events.length > 0 ? (
                <div className="space-y-4">
                  {events.map((event: any) => (
                    <div
                      key={event.id}
                      className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row gap-6"
                    >
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-semibold">{event.title}</h3>
                          <Badge variant={event.status === 'Upcoming' ? 'default' : 'secondary'}>{event.status}</Badge>
                        </div>
                        <p className="text-slate-600 text-sm mb-4 line-clamp-2">{event.description}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {event.date} • {event.time}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {event.location}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Link to={`/detail/event/${event.id}`}>
                          <Button variant="outline">
                            {t('View Details')} <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white p-8 rounded-xl shadow-sm text-center text-slate-500">
                  {t('No upcoming events found.')}
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="font-semibold mb-4">{t('Contact Information')}</h3>
              <div className="space-y-4">
                {org.website && (
                  <a
                    href={org.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-slate-600 hover:text-primary transition-colors"
                  >
                    <Globe className="h-5 w-5" />
                    <span className="truncate">{org.website.replace(/^https?:\/\//, '')}</span>
                  </a>
                )}
                {org.email && (
                  <a
                    href={`mailto:${org.email}`}
                    className="flex items-center gap-3 text-slate-600 hover:text-primary transition-colors"
                  >
                    <Mail className="h-5 w-5" />
                    <span className="truncate">{org.email}</span>
                  </a>
                )}
                {org.phone && (
                  <a
                    href={`tel:${org.phone}`}
                    className="flex items-center gap-3 text-slate-600 hover:text-primary transition-colors"
                  >
                    <Phone className="h-5 w-5" />
                    <span className="truncate">{org.phone}</span>
                  </a>
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="font-semibold mb-4">{t('Impact Stats')}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{org.volunteer_count || 0}</div>
                  <div className="text-xs text-slate-500">{t('Volunteers')}</div>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{org.event_count || 0}</div>
                  <div className="text-xs text-slate-500">{t('Events')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationDetail;
