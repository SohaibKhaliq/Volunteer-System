import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import volunteerApi from '@/lib/api/volunteerApi';
import { useToast } from '@/components/atoms/use-toast';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Users, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import api from '@/lib/api';

const Organizations = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const { data: organizations, isLoading } = useQuery(
    ['organizations'],
    () => api.listOrganizations() as unknown as Promise<any[]>
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
    <div className="min-h-screen bg-background py-16">
      <div className="container px-4 mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">{t('Partner Organizations')}</h1>
            <p className="text-muted-foreground max-w-2xl text-lg">
              {t('Discover amazing groups working to make a difference. Join them or support their cause.')}
            </p>
          </div>
          <Link to="/organizations/register">
            <Button size="lg" className="rounded-xl shadow-lg shadow-primary/20 px-8 font-bold">
              {t('Register Your Organization')}
            </Button>
          </Link>
        </div>

        {/* Search & Filter */}
        <div className="bg-card/50 backdrop-blur-sm p-3 rounded-2xl shadow-sm border border-border/50 mb-12 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder={t('Search organizations by name or category...')}
              className="pl-11 h-12 bg-background/50 border-border/50 rounded-xl focus:bg-background transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" className="h-12 rounded-xl border-border/50 px-6 font-medium">
            <Users className="mr-2 h-4 w-4" />
            {t('Filters')}
          </Button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading
            ? [1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-[420px] bg-muted/50 rounded-2xl animate-pulse border border-border/50" />
            ))
            : filteredOrgs.map((org: any) => (
              <Card key={org.id} className="group hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 overflow-hidden border-border/50 rounded-2xl bg-card">
                <div className="h-48 bg-muted relative overflow-hidden">
                  <img
                    src={
                      org.image ||
                      `https://images.unsplash.com/photo-${org.id % 2 === 0 ? '1542601906990-b4d3fb778b09' : '1469571486292-0ba58a3f068b'}?q=80&w=800&auto=format&fit=crop`
                    }
                    alt={org.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <Badge className="absolute top-4 right-4 bg-background/90 text-foreground backdrop-blur-sm border-none shadow-lg px-3 py-1">
                    {org.category || 'General'}
                  </Badge>
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl font-bold tracking-tight">
                    {org.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed h-10">
                    {org.description || 'Dedicated to supporting our community through collaborative efforts.'}
                  </p>
                  <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground italic">
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-muted/50 rounded-lg">
                      <MapPin className="h-3.5 w-3.5 text-primary/70" /> {org.city || org.location || 'Remote'}
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-muted/50 rounded-lg">
                      <Users className="h-3.5 w-3.5 text-primary/70" /> {org.members_count || 0} members
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t border-border/50 bg-muted/10 p-4 flex gap-2">
                  <Link to={`/organizations/${org.id}`} className="flex-1">
                    <Button variant="ghost" className="w-full justify-between group rounded-xl hover:bg-primary/5 hover:text-primary transition-all">
                      {t('View Profile')}
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <div className="w-36">
                    {(() => {
                      const membership = membershipMap[org.id];
                      const status = membership ? membership.status : 'not_member';
                      if (status === 'active') {
                        const isLeaving = loadingByOrg[org.id] === 'leaving';
                        return (
                          <Button
                            size="sm"
                            variant="destructive"
                            className="w-full rounded-xl shadow-lg shadow-destructive/10"
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
                          <Button size="sm" className="w-full rounded-xl bg-muted text-muted-foreground" disabled>
                            {isJoining ? 'Requesting...' : t('Requested')}
                          </Button>
                        );
                      }

                      // not a member
                      return (
                        <Button
                          size="sm"
                          className="w-full rounded-xl shadow-lg shadow-primary/10 font-bold"
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
      </div>
    </div>
  );
};

export default Organizations;
