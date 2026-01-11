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
      <section className="relative py-24 pb-32 flex flex-col items-center justify-center bg-primary text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/80 z-10" />
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:30px_30px] z-10" />
        <div className="container relative z-20 px-4 text-center">
          <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight">{t('Partner Organizations')}</h1>
          <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto font-medium">
            {t('Discover amazing groups working to make a difference. Join them or support their cause.')}
          </p>
          <div className="mt-8">
            <Link to="/organizations/register">
              <Button size="lg" variant="secondary" className="h-14 px-8 rounded-2xl font-black shadow-2xl shadow-black/20 text-primary hover:bg-white/90">
                <Building2 className="mr-2 h-5 w-5" />
                {t('Register Your Organization')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <div className="container px-4 -mt-16 relative z-30 pb-24">
        {/* Search & Filter */}
        <div className="bg-card p-4 rounded-[2rem] shadow-2xl shadow-primary/10 border border-border/50 mb-12 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder={t('Search organizations by name or category...')}
              className="pl-14 h-14 bg-muted/30 border-transparent hover:bg-muted/50 focus:bg-background focus:border-primary/20 rounded-2xl transition-all text-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" className="h-14 rounded-2xl border-border/50 px-8 font-bold text-muted-foreground hover:text-foreground hover:border-primary/20">
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
              <Card key={org.id} className="group hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 overflow-hidden border-border/50 rounded-[2.5rem] bg-card flex flex-col">
                <div className="h-56 bg-muted relative overflow-hidden">
                  <img
                    src={
                      org.image ||
                      `https://images.unsplash.com/photo-${org.id % 2 === 0 ? '1542601906990-b4d3fb778b09' : '1469571486292-0ba58a3f068b'}?q=80&w=800&auto=format&fit=crop`
                    }
                    alt={org.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <Badge className="absolute top-5 right-5 bg-white/95 text-foreground backdrop-blur-md border-none shadow-lg px-4 py-1.5 text-xs font-black uppercase tracking-wider rounded-xl">
                    {org.category || 'General'}
                  </Badge>
                </div>
                <CardContent className="space-y-6 pt-6 flex-1">
                  <div className="flex flex-col gap-2">
                    <CardTitle className="text-2xl font-black tracking-tight group-hover:text-primary transition-colors">
                      {org.name}
                    </CardTitle>
                    <p className="text-muted-foreground line-clamp-2 leading-relaxed font-medium">
                      {org.description || 'Dedicated to supporting our community through collaborative efforts.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg">
                      <MapPin className="h-3.5 w-3.5 text-primary" /> {org.city || org.location || 'Remote'}
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg">
                      <Users className="h-3.5 w-3.5 text-primary" /> {org.volunteer_count || 0} members
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t border-border/50 bg-muted/10 p-6 flex gap-3">
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-12 w-12 rounded-xl flex-shrink-0 border-primary/20 hover:bg-primary/5 text-primary"
                    onClick={() => navigate(`/profile?tab=messages&orgId=${org.id}`)}
                  >
                    <MessageSquare className="h-5 w-5" />
                  </Button>
                  <div className="w-40">
                    {(() => {
                      const membership = membershipMap[org.id];
                      const status = membership ? membership.status : 'not_member';
                      if (status === 'active') {
                        const isLeaving = loadingByOrg[org.id] === 'leaving';
                        return (
                          <Button
                            size="sm"
                            variant="destructive"
                            className="w-full h-12 rounded-xl shadow-lg shadow-destructive/10 font-bold"
                            onClick={() => leaveMutation.mutate(org.id)}
                            disabled={isLeaving}
                          >
                            {isLeaving ? 'Leaving...' : t('Leave')}
                          </Button>
                        );
                      }
                      if (status === 'pending') {
                        const isJoining = loadingByOrg[org.id] === 'joining';
                        return (
                          <Button size="sm" className="w-full h-12 rounded-xl bg-muted text-muted-foreground font-bold" disabled>
                            {isJoining ? 'Requesting...' : t('Requested')}
                          </Button>
                        );
                      }

                      // not a member
                      return (
                        <Button
                          size="sm"
                          className="w-full h-12 rounded-xl shadow-lg shadow-primary/10 font-bold"
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
