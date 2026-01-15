import { useTranslation } from 'react-i18next';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axios } from '@/lib/axios';
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
      const status = error?.response?.status;
      const serverMessage = error?.response?.data?.message;
      if (status === 401) {
        toast({ title: t('Login Required'), description: t('Please sign in to join.'), variant: 'destructive' });
        // Let axios interceptor or existing flow redirect the user; also invalidate auth-related queries
        queryClient.invalidateQueries({ queryKey: ['me'] });
        return;
      }

      if (status === 409) {
        toast({ title: t('Already a member'), description: serverMessage || t('You are already a member.') });
        queryClient.invalidateQueries({ queryKey: ['me'] });
        queryClient.invalidateQueries({ queryKey: ['myOrganizations'] });
        queryClient.invalidateQueries({ queryKey: ['organization', id] });
        return;
      }

      if (status === 404) {
        toast({
          title: t('Not found'),
          description: serverMessage || t('Organization not found'),
          variant: 'destructive'
        });
        return;
      }

      const message = serverMessage || t('Failed to join organization');
      toast({ title: t('Error'), description: message, variant: 'destructive' });
    }
  });

  // Fetch current user's memberships so we can avoid duplicate join attempts
  const { data: myOrgs } = useQuery({
    queryKey: ['myOrganizations'],
    queryFn: async () => volunteerApi.getMyOrganizations(),
    enabled: !!token
  });

  const membership = Array.isArray(myOrgs) && id ? (myOrgs as any[]).find((m) => String(m.id) === String(id)) : null;

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
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Header / Banner */}
      <div className="bg-slate-900 relative">
        <div className="h-64 md:h-96 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-primary/5 to-transparent z-10" />
          <img
            src="https://images.unsplash.com/photo-1559027615-cd4628902d4a?q=80&w=2074&auto=format&fit=crop"
            alt="Collaboration"
            className="absolute inset-0 w-full h-full object-cover opacity-40"
          />
        </div>

        <div className="container px-4 relative -mt-32 z-20 pb-12">
          <div className="flex flex-col md:flex-row items-end gap-8">
            <div className="w-48 h-48 bg-card rounded-2xl shadow-2xl p-6 flex items-center justify-center overflow-hidden border border-border">
              {org.logo ? (
                <img src={org.logo} alt={org.name} className="w-full h-full object-contain" />
              ) : (
                <Users className="w-16 h-16 text-muted-foreground/20" />
              )}
            </div>

            <div className="flex-1 pb-4">
              <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    {org.type && <Badge className="bg-white/10 text-white border-none font-bold px-4 py-1.5 rounded-md uppercase tracking-widest text-[10px] backdrop-blur-md">{org.type}</Badge>}
                  </div>
                  <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight">{org.name}</h1>
                  <div className="flex flex-wrap gap-4">
                    {org.address && (
                      <div className="flex items-center gap-2 bg-slate-900/40 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10 text-white/90 text-sm font-medium">
                        <MapPin className="h-4 w-4 text-primary" />
                        {org.address}
                      </div>
                    )}
                  </div>
                </div>
                <div className="pb-2">
                  {membership ? (
                    membership.status === 'active' ? (
                      <Button size="lg" className="h-14 px-10 rounded-md bg-white text-slate-900 hover:bg-white/90 font-bold shadow-xl" disabled>
                        {t('Active Member')}
                      </Button>
                    ) : (
                      <Button size="lg" className="h-14 px-10 rounded-md bg-white/10 text-white backdrop-blur-md border border-white/20 font-bold" disabled>
                        {t('Pending Approval')}
                      </Button>
                    )
                  ) : (
                    <Button
                      size="lg"
                      className="h-14 px-10 rounded-md bg-primary text-white hover:bg-primary/90 font-bold shadow-xl shadow-primary/20"
                      onClick={handleJoinOrganization}
                      disabled={joinMutation.isPending}
                    >
                      {joinMutation.isPending ? t('Joining...') : t('Join Organization')}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
            {/* About */}
            <section className="bg-card p-12 rounded-2xl border border-border shadow-2xl shadow-slate-200/50 dark:shadow-slate-900/50">
              <h2 className="text-3xl font-bold mb-8 text-foreground tracking-tight">{t('About Us')}</h2>
              <div className="prose max-w-none text-muted-foreground font-medium leading-relaxed text-lg">
                <p>{org.description || t('No description available.')}</p>
              </div>
            </section>

            {/* Upcoming Events */}
            <section className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-black text-foreground tracking-tight">{t('Upcoming Opportunities')}</h2>
                <Badge variant="outline" className="rounded-full px-4 py-1 border-primary/50 text-xs font-bold text-primary">{events?.length || 0} {t('Opportunities')}</Badge>
              </div>
              {isLoadingEvents ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
              ) : events && events.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {events.map((event: any) => (
                    <div
                      key={event.id}
                      className="group bg-card p-8 rounded-2xl border border-border hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 relative overflow-hidden"
                    >
                      <div className="flex justify-between items-start mb-8">
                        <div className="h-12 w-12 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg flex items-center justify-center text-indigo-600 transition-colors">
                          <Calendar className="h-6 w-6" />
                        </div>
                        <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[10px] rounded-md tracking-widest uppercase px-3 py-1">{event.status || t('Available')}</Badge>
                      </div>
                      <h3 className="text-xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors">{event.title}</h3>
                      <p className="text-muted-foreground text-sm mb-8 line-clamp-2 font-medium leading-relaxed">{event.description}</p>

                      <div className="space-y-3 mb-10">
                        <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground/80 tracking-wide">
                          <Calendar className="h-4 w-4 text-primary/70" />
                          {event.date} • {event.time}
                        </div>
                        <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground/80 tracking-wide">
                          <MapPin className="h-4 w-4 text-primary/70" />
                          {event.location}
                        </div>
                      </div>

                      <Link to={`/detail/event/${event.id}`}>
                        <Button variant="outline" className="w-full h-12 rounded-lg border-border font-bold transition-all group-hover:bg-primary group-hover:text-white group-hover:border-primary shadow-sm hover:shadow-md">
                          {t('View Details')} <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-card p-12 rounded-[2.5rem] border border-border/30 text-center text-muted-foreground font-bold">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="h-8 w-8 opacity-20" />
                  </div>
                  {t('No upcoming events found.')}
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <div className="bg-card p-8 rounded-3xl border border-border/50 shadow-sm">
              <h3 className="text-lg font-black mb-6 tracking-tight text-foreground uppercase tracking-widest text-[10px] opacity-50">{t('Contact Information')}</h3>
              <div className="space-y-6">
                {org.website && (
                  <a
                    href={org.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 text-muted-foreground hover:text-primary transition-all group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                      <Globe className="h-5 w-5" />
                    </div>
                    <span className="truncate font-bold text-sm">{org.website.replace(/^https?:\/\//, '')}</span>
                  </a>
                )}
                {org.email && (
                  <a
                    href={`mailto:${org.email}`}
                    className="flex items-center gap-4 text-muted-foreground hover:text-primary transition-all group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                      <Mail className="h-5 w-5" />
                    </div>
                    <span className="truncate font-bold text-sm">{org.email}</span>
                  </a>
                )}
                {org.phone && (
                  <a
                    href={`tel:${org.phone}`}
                    className="flex items-center gap-4 text-muted-foreground hover:text-primary transition-all group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                      <Phone className="h-5 w-5" />
                    </div>
                    <span className="truncate font-bold text-sm">{org.phone}</span>
                  </a>
                )}
              </div>
            </div>

            <div className="bg-card p-8 rounded-2xl border border-border shadow-2xl shadow-slate-200/50 dark:shadow-slate-900/50 relative overflow-hidden">
              <h3 className="text-[10px] font-black mb-8 tracking-[0.2em] text-muted-foreground uppercase">{t('Impact Summary')}</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-border/50 transition-colors hover:border-primary/20">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 flex items-center justify-center">
                      <Users className="h-5 w-5" />
                    </div>
                    <div className="text-sm font-bold text-muted-foreground">{t('Total Volunteers')}</div>
                  </div>
                  <div className="text-2xl font-bold text-foreground">{org.volunteer_count || 0}</div>
                </div>
                <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-border/50 transition-colors hover:border-primary/20">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 flex items-center justify-center">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div className="text-sm font-bold text-muted-foreground">{t('Active Events')}</div>
                  </div>
                  <div className="text-2xl font-bold text-foreground">{org.event_count || 0}</div>
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
