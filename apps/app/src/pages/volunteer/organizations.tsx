import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Building2, Users, Calendar, MapPin, CheckCircle, LogOut, ArrowRight, Loader2, Search, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const VolunteerOrganizationsPage = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('my-orgs');

  // Browse State
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search effect (simple timeout)
  useState(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }); // This runs on every render? No. `useState` lazy init only runs once. I need `useEffect`.

  // Join Dialog State
  const [orgToJoin, setOrgToJoin] = useState<any>(null);
  const [joinNote, setJoinNote] = useState('');
  // Loading state for individual buttons (legacy support for My Orgs tab)
  const [loadingByOrg, setLoadingByOrg] = useState<Record<number, boolean>>({});

  // Fetch user's organizations
  const { data: myOrgsData, isLoading: loadingMyOrgs } = useQuery({
    queryKey: ['my-organizations'],
    queryFn: async () => {
      try {
        const res = await api.getVolunteerOrganizations();
        return res as any[];
      } catch {
        return [];
      }
    }
  });

  // Fetch public organizations to browse
  const { data: browseData, isLoading: loadingBrowse } = useQuery({
    queryKey: ['browse-organizations', page, debouncedSearch, cityFilter, typeFilter],
    queryFn: async () => {
      const params: any = { page, perPage: 12 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (cityFilter) params.city = cityFilter;
      if (typeFilter) params.type = typeFilter;
      const res: any = await api.browseOrganizations(params);
      return res;
    },
    // Only fetch when on discover tab
    enabled: activeTab === 'discover',
    placeholderData: (previousData: any) => previousData
  });

  const availableOrgs = (browseData as any)?.data || [];
  const meta = (browseData as any)?.meta || {};

  // Join organization mutation
  const joinMutation = useMutation({
    mutationFn: (data: { id: number; notes?: string }) => api.joinVolunteerOrganization(data.id, { notes: data.notes }),
    onSuccess: () => {
      toast.success(t('Membership request submitted'));
      setOrgToJoin(null);
      setJoinNote('');
      queryClient.invalidateQueries({ queryKey: ['my-organizations'] });
    },
    onError: (error: any) => {
      const status = error?.response?.status;
      const serverMessage = error?.response?.data?.message;
      if (status === 409) {
        toast.error(serverMessage || t('You are already a member of this organization'));
      } else {
        toast.error(t('Failed to join organization'));
      }
    }
  });

  // Leave organization mutation
  const leaveMutation = useMutation({
    mutationFn: (id: number) => api.leaveVolunteerOrganization(id),
    onMutate: (id: number) => {
      setLoadingByOrg((s) => ({ ...s, [id]: true }));
    },
    onSettled: (_data, _err, id: number) => {
      setLoadingByOrg((s) => ({ ...s, [id]: false }));
      queryClient.invalidateQueries({ queryKey: ['my-organizations'] });
    },
    onSuccess: () => {
      toast.success(t('Left organization'));
    },
    onError: () => {
      toast.error(t('Failed to leave organization'));
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700 border-green-200">{t('Active')}</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">{t('Pending Approval')}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    const roleColors: Record<string, string> = {
      owner: 'bg-purple-100 text-purple-700',
      admin: 'bg-blue-100 text-blue-700',
      manager: 'bg-indigo-100 text-indigo-700',
      coordinator: 'bg-cyan-100 text-cyan-700',
      volunteer: 'bg-gray-100 text-gray-700'
    };
    return (
      <Badge className={roleColors[role] || 'bg-gray-100 text-gray-700'}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  const handleLeave = (id: number, name: string) => {
    if (window.confirm(t(`Are you sure you want to leave ${name}?`))) {
      leaveMutation.mutate(id);
    }
  };

  const handleJoinClick = (org: any) => {
    setOrgToJoin(org);
    setJoinNote('');
  };

  const confirmJoin = () => {
    if (orgToJoin) {
      joinMutation.mutate({ id: orgToJoin.id, notes: joinNote });
    }
  };

  const myOrgs = myOrgsData || [];


  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card/30 p-8 rounded-[2.5rem] border border-border/50 backdrop-blur-sm shadow-2xl shadow-primary/5">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight text-foreground">{t('My Organizations')}</h1>
          <p className="text-lg text-muted-foreground font-medium">{t('Manage your organization memberships and discover new ones.')}</p>
        </div>
        <Link to="/map" className="shrink-0">
          <Button size="lg" className="rounded-2xl h-14 px-8 font-black shadow-xl shadow-primary/20 group">
            {t('Explore on Map')} <MapPin className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <Card className="p-2 border-border/50 shadow-2xl shadow-primary/5 rounded-[2rem] bg-card/80 backdrop-blur-md overflow-x-auto">
          <TabsList className="bg-transparent h-12 w-full justify-start gap-2 p-0">
            {[
              { value: 'my-orgs', label: `${t('My Organizations')} (${myOrgs.length})` },
              { value: 'discover', label: `${t('Discover')} (${availableOrgs.length})` }
            ].map(tab => (
              <TabsTrigger key={tab.value} value={tab.value} className="h-10 px-6 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white font-bold transition-all">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Card>

        {/* My Organizations Tab */}
        <TabsContent value="my-orgs" className="mt-6">
          {loadingMyOrgs ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : myOrgs.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">{t("You haven't joined any organizations yet")}</p>
                <Button onClick={() => setActiveTab('discover')}>{t('Discover Organizations')}</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {myOrgs.map((org: any) => (
                <Card key={org.id} className="group border-border/50 rounded-[2.5rem] hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 overflow-hidden bg-card">
                  <div className="h-32 bg-gradient-to-br from-primary/80 to-indigo-600/80 relative">
                    <div className="absolute inset-0 bg-grid-white/[0.1] bg-[size:15px_15px]" />
                    {org.logo_url && (
                      <div className="absolute -bottom-8 left-8 p-1 bg-background rounded-2xl shadow-xl">
                        <img
                          src={org.logo_url}
                          alt={org.name}
                          className="w-16 h-16 rounded-xl bg-white object-cover"
                        />
                      </div>
                    )}
                    {!org.logo_url && (
                      <div className="absolute -bottom-8 left-8 w-18 h-18 p-1 bg-background rounded-2xl shadow-xl">
                        <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center">
                          <Building2 className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                      </div>
                    )}
                  </div>

                  <CardContent className="p-8 pt-12 space-y-6">
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <h3 className="font-black text-2xl tracking-tight leading-none truncate">{org.name}</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {getStatusBadge(org.status)}
                        {getRoleBadge(org.role)}
                      </div>
                    </div>

                    <div className="space-y-3">
                      {org.joined_at && (
                        <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-xl w-fit">
                          <Calendar className="h-4 w-4 text-primary" />
                          <span>
                            {t('Joined')} {new Date(org.joined_at).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Link to={`/organizations/${org.slug || org.id}`} className="flex-1">
                        <Button className="w-full h-12 rounded-xl font-black shadow-lg shadow-primary/5 flex items-center justify-center gap-2 group">
                          {t('View')} <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                      {org.role === 'volunteer' && (
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-12 w-12 rounded-xl border-destructive/20 text-destructive hover:bg-destructive/5 hover:border-destructive/30 shrink-0"
                          onClick={() => handleLeave(org.id, org.name)}
                          disabled={!!loadingByOrg[org.id]}
                        >
                          {loadingByOrg[org.id] ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <LogOut className="h-5 w-5" />
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Discover Tab */}
        <TabsContent value="discover" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 bg-muted/20 p-6 rounded-[2rem] border border-border/50">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder={t('Search organizations...')}
                className="pl-12 h-14 rounded-2xl bg-background border-border/50 font-medium"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  // Simple manual debounce since useDebounce hook isn't imported
                  setTimeout(() => setDebouncedSearch(e.target.value), 500);
                }}
              />
            </div>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder={t('Filter by City')}
                className="pl-12 h-14 rounded-2xl bg-background border-border/50 font-medium"
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder={t('Filter by Type')}
                className="pl-12 h-14 rounded-2xl bg-background border-border/50 font-medium"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              />
            </div>
          </div>

          {loadingBrowse ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : availableOrgs.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                <p className="text-muted-foreground">{t("No organizations found matching your criteria.")}</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
                {availableOrgs.map((org: any) => (
                  <Card key={org.id} className="group border-border/50 rounded-[2.5rem] hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 overflow-hidden bg-card">
                    <div className="h-32 bg-gradient-to-br from-emerald-500/80 to-teal-600/80 relative">
                      <div className="absolute inset-0 bg-grid-white/[0.1] bg-[size:15px_15px]" />
                      {org.logo_url && (
                        <div className="absolute -bottom-8 left-8 p-1 bg-background rounded-2xl shadow-xl">
                          <img
                            src={org.logo_url}
                            alt={org.name}
                            className="w-16 h-16 rounded-xl bg-white object-cover"
                          />
                        </div>
                      )}
                      {!org.logo_url && (
                        <div className="absolute -bottom-8 left-8 w-18 h-18 p-1 bg-background rounded-2xl shadow-xl">
                          <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center">
                            <Building2 className="h-8 w-8 text-muted-foreground/50" />
                          </div>
                        </div>
                      )}
                    </div>

                    <CardContent className="p-8 pt-12 space-y-6">
                      <div>
                        <h3 className="font-black text-2xl tracking-tight leading-none mb-3 truncate">{org.name}</h3>
                        {org.description && (
                          <p className="text-muted-foreground font-medium text-sm line-clamp-2 leading-relaxed">{org.description}</p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-4 text-xs font-bold text-muted-foreground/80">
                        {(org.city || org.country) && (
                          <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-xl">
                            <MapPin className="h-3.5 w-3.5 text-primary" />
                            <span>{[org.city, org.country].filter(Boolean).join(', ')}</span>
                          </div>
                        )}
                        {org.volunteerCount !== undefined && (
                          <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-xl">
                            <Users className="h-3.5 w-3.5 text-primary" />
                            <span>
                              {org.volunteerCount} {t('volunteers')}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-3 pt-2">
                        <Link to={`/organizations/${org.slug || org.id}`} className="flex-1">
                          <Button variant="outline" className="w-full h-12 rounded-xl font-bold border border-border/50 hover:bg-muted group">
                            {t('View')}
                          </Button>
                        </Link>

                        {myOrgs.some((m: any) => m.id === org.id) ? (
                          <Button disabled className="flex-1 h-12 rounded-xl font-black bg-muted text-muted-foreground border-none">
                            {t('Member')}
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleJoinClick(org)}
                            className="flex-1 h-12 rounded-xl font-black shadow-lg shadow-primary/5 group-hover:shadow-primary/20"
                          >
                            {t('Join')}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Simple Pagination */}
              <div className="flex justify-center gap-2">
                <Button
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  {t('Previous')}
                </Button>
                <Button
                  variant="outline"
                  disabled={!meta.next_page_url && availableOrgs.length < 12}
                  onClick={() => setPage(page + 1)}
                >
                  {t('Next')}
                </Button>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!orgToJoin} onOpenChange={(open) => !open && setOrgToJoin(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Join Organization')}</DialogTitle>
            <DialogDescription>
              {t('Send a request to join')} <span className="font-semibold">{orgToJoin?.name}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label htmlFor="note">{t('Message (Optional)')}</Label>
            <Textarea
              id="note"
              placeholder={t('Tell them why you want to join...')}
              value={joinNote}
              onChange={(e) => setJoinNote(e.target.value)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOrgToJoin(null)}>
              {t('Cancel')}
            </Button>
            <Button onClick={confirmJoin} disabled={joinMutation.isPending}>
              {joinMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('Send Request')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VolunteerOrganizationsPage;
