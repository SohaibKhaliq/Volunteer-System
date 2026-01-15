import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import volunteerApi from '@/lib/api/volunteerApi';
import { useToast } from '@/components/atoms/use-toast';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Users, ArrowRight, Building2, MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import api from '@/lib/api';

const Organizations = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const { data: organizations, isLoading } = useQuery(
    ['organizations'],
    () => api.listOrganizations({ withCounts: 'true' }) as unknown as Promise<any[]>
  );

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { token } = useStore();

  // per-org loading state
  const [loadingByOrg, setLoadingByOrg] = useState<Record<number, 'joining' | 'leaving' | undefined>>({});

  // Fetch current user's organization memberships to show per-org status
  const { data: myOrgs } = useQuery(['myOrganizations'], () => volunteerApi.getMyOrganizations(), { enabled: !!token });

  const membershipMap: Record<number, any> = {};
  if (Array.isArray(myOrgs)) {
    (myOrgs as any[]).forEach((m: any) => {
      membershipMap[m.id] = m;
    });
  }

  const joinMutation = useMutation({
    mutationFn: (orgId: number) => volunteerApi.joinOrganization(orgId),
    onMutate: async (orgId: number) => {
      setLoadingByOrg((s) => ({ ...s, [orgId]: 'joining' }));
      return { orgId };
    },
    onSuccess: () => {
      toast({ title: 'Request submitted', description: 'Your request to join the organization was submitted.' });
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      queryClient.invalidateQueries({ queryKey: ['myOrganizations'] });
    },
    onError: (_err: any, orgId: any) => {
      const msg = (_err as any)?.response?.data?.message || 'Failed to submit request';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
      setLoadingByOrg((s) => ({ ...s, [orgId as number]: undefined }));
    },
    onSettled: (_data, _err, orgId: any) => {
      setLoadingByOrg((s) => {
        const copy = { ...s };
        delete copy[orgId as number];
        return copy;
      });
    }
  });

  const leaveMutation = useMutation({
    mutationFn: (orgId: number) => volunteerApi.leaveOrganization(orgId),
    onMutate: async (orgId: number) => {
      setLoadingByOrg((s) => ({ ...s, [orgId]: 'leaving' }));
      return { orgId };
    },
    onSuccess: () => {
      toast({ title: 'Left organization', description: 'You have left the organization.' });
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      queryClient.invalidateQueries({ queryKey: ['myOrganizations'] });
    },
    onError: (_err: any, orgId: any) => {
      const msg = (_err as any)?.response?.data?.message || 'Failed to leave organization';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
      setLoadingByOrg((s) => ({ ...s, [orgId as number]: undefined }));
    },
    onSettled: (_data, _err, orgId: any) => {
      setLoadingByOrg((s) => {
        const copy = { ...s };
        delete copy[orgId as number];
        return copy;
      });
    }
  });

  const filteredOrgs =
    organizations?.filter(
      (org: any) =>
        org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        org.category?.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-32 flex flex-col items-center justify-center bg-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-primary/5 to-transparent z-10" />
        <div className="container relative z-20 px-4">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-7xl font-bold mb-6 tracking-tight">{t('Partner Organizations')}</h1>
            <p className="text-xl text-slate-300 font-medium leading-relaxed mb-10">
              {t('Discover amazing groups working to make a difference. Join them or support their cause.')}
            </p>
            <Link to="/organizations/register">
              <Button size="lg" className="h-14 px-10 rounded-md font-bold shadow-xl bg-primary hover:bg-primary/90 text-white transition-all">
                <Building2 className="mr-2 h-5 w-5" />
                {t('Register Your Organization')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <div className="container px-4 -mt-10 relative z-30 pb-24">
        {/* Search & Filter */}
        <div className="bg-card p-2 rounded-xl shadow-2xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-border mb-12 flex flex-col md:flex-row gap-2">
          <div className="relative flex-1 group">
            <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder={t('Search organizations by name or category...')}
              className="pl-12 h-14 bg-slate-50 dark:bg-slate-900 border-none focus-visible:ring-0 rounded-lg transition-all text-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" className="h-14 rounded-lg border-border px-8 font-bold text-muted-foreground hover:text-foreground">
            <Users className="mr-2 h-5 w-5" />
            {t('Filters')}
          </Button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading
            ? [1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-[500px] bg-card rounded-[2.5rem] animate-pulse border border-border/50 shadow-sm" />
            ))
            : filteredOrgs.map((org: any) => (
              <Card key={org.id} className="group hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 overflow-hidden border-border rounded-xl bg-card flex flex-col">
                <div className="h-56 bg-muted relative overflow-hidden">
                  <img
                    src={
                      org.image ||
                      `https://images.unsplash.com/photo-${org.id % 2 === 0 ? '1542601906990-b4d3fb778b09' : '1469571486292-0ba58a3f068b'}?q=80&w=800&auto=format&fit=crop`
                    }
                    alt={org.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <Badge className="absolute top-4 right-4 bg-white/95 text-foreground backdrop-blur-md border-none shadow-lg px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md">
                    {org.category || 'General'}
                  </Badge>
                </div>
                <CardContent className="space-y-4 pt-8 flex-1">
                  <div className="flex flex-col gap-1">
                    <CardTitle className="text-2xl font-bold tracking-tight group-hover:text-primary transition-colors">
                      {org.name}
                    </CardTitle>
                    <p className="text-muted-foreground line-clamp-2 leading-relaxed text-sm font-medium">
                      {org.description || 'Dedicated to supporting our community through collaborative efforts.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-primary/70" /> {org.city || org.location || 'Remote'}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-primary/70" /> {org.volunteer_count || 0} members
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t border-border bg-slate-50/50 dark:bg-slate-900/50 p-6 flex gap-3">
                  <Link to={`/organizations/${org.slug || org.id}`} className="flex-1">
                    <Button variant="ghost" className="w-full h-11 justify-between group rounded-md bg-white dark:bg-slate-900 hover:bg-primary hover:text-white border border-border transition-all font-bold px-4 text-xs">
                      {t('Profile')}
                      <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-11 w-11 rounded-md border-border hover:bg-primary hover:text-white text-primary transition-colors"
                    onClick={() => navigate(`/profile?tab=messages&orgId=${org.id}`)}
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                  <div className="w-32">
                    {(() => {
                      const membership = membershipMap[org.id];
                      const status = membership ? membership.status : 'not_member';
                      if (status === 'active') {
                        const isLeaving = loadingByOrg[org.id] === 'leaving';
                        return (
                          <Button
                            size="sm"
                            variant="destructive"
                            className="w-full h-11 rounded-md font-bold text-xs"
                            onClick={() => leaveMutation.mutate(org.id)}
                            disabled={isLeaving}
                          >
                            {isLeaving ? '...' : t('Leave')}
                          </Button>
                        );
                      }
                      if (status === 'pending') {
                        const isJoining = loadingByOrg[org.id] === 'joining';
                        return (
                          <Button size="sm" className="w-full h-11 rounded-md bg-muted text-muted-foreground font-bold text-xs" disabled>
                            {isJoining ? '...' : t('Pending')}
                          </Button>
                        );
                      }

                      // not a member
                      return (
                        <Button
                          size="sm"
                          className="w-full h-11 rounded-md font-bold text-xs shadow-lg shadow-primary/10 transition-all hover:translate-y-[-1px]"
                          onClick={() => {
                            if (!token) {
                              const returnTo = encodeURIComponent(
                                window.location.pathname + window.location.search + window.location.hash
                              );
                              navigate(`/login?returnTo=${returnTo}`);
                              return;
                            }
                            joinMutation.mutate(org.id);
                          }}
                          disabled={loadingByOrg[org.id] === 'joining'}
                        >
                          {loadingByOrg[org.id] === 'joining' ? '...' : t('Join')}
                        </Button>
                      );
                    })()}
                  </div>
                </CardFooter>
              </Card>
            ))}
        </div>
      </div >
    </div >
  );
};

export default Organizations;
