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
    onSettled: (data, err, id: number) => {
      setLoadingByOrg((s) => ({ ...s, [id]: false }));
      queryClient.invalidateQueries({ queryKey: ['my-organizations'] });
    },
    onSuccess: () => {
      toast.success(t('Left organization'));
    },
    onError: (error: any) => {
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
      <div>
        <h1 className="text-3xl font-bold text-slate-900">{t('My Organizations')}</h1>
        <p className="text-slate-600">{t('Manage your organization memberships and discover new ones.')}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="my-orgs">
            {t('My Organizations')} ({myOrgs.length})
          </TabsTrigger>
          <TabsTrigger value="discover">
            {t('Discover')} ({availableOrgs.length})
          </TabsTrigger>
        </TabsList>

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myOrgs.map((org: any) => (
                <Card key={org.id} className="overflow-hidden">
                  <div className="h-24 bg-gradient-to-r from-blue-500 to-indigo-600 relative">
                    {org.logo_url && (
                      <img
                        src={org.logo_url}
                        alt={org.name}
                        className="absolute bottom-0 left-4 w-16 h-16 rounded-lg border-4 border-white shadow-md transform translate-y-1/2 bg-white object-cover"
                      />
                    )}
                    {!org.logo_url && (
                      <div className="absolute bottom-0 left-4 w-16 h-16 rounded-lg border-4 border-white shadow-md transform translate-y-1/2 bg-white flex items-center justify-center">
                        <Building2 className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>

                  <CardContent className="pt-12 pb-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg">{org.name}</h3>
                      {getStatusBadge(org.status)}
                    </div>

                    <div className="flex gap-2 mb-4">{getRoleBadge(org.role)}</div>

                    {org.joined_at && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {t('Joined')} {new Date(org.joined_at).toLocaleDateString()}
                        </span>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Link to={`/organizations/${org.slug || org.id}`} className="flex-1">
                        <Button variant="outline" className="w-full">
                          {t('View')} <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                      {org.role === 'volunteer' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleLeave(org.id, org.name)}
                          disabled={!!loadingByOrg[org.id]}
                        >
                          {loadingByOrg[org.id] ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <LogOut className="h-4 w-4" />
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
          <div className="flex gap-4 mb-6">
             <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('Search organizations...')}
                  className="pl-8"
                  value={search}
                  onChange={(e) => {
                     setSearch(e.target.value);
                     // Simple manual debounce since useDebounce hook isn't imported
                     setTimeout(() => setDebouncedSearch(e.target.value), 500); 
                  }}
                />
             </div>
             <Input 
                placeholder={t('Filter by City')} 
                className="w-48"
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
             />
             <Input 
                placeholder={t('Filter by Type')} 
                className="w-48" 
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
             />
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {availableOrgs.map((org: any) => (
                <Card key={org.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-24 bg-gradient-to-r from-green-500 to-teal-600 relative">
                    {org.logo_url && (
                      <img
                        src={org.logo_url}
                        alt={org.name}
                        className="absolute bottom-0 left-4 w-16 h-16 rounded-lg border-4 border-white shadow-md transform translate-y-1/2 bg-white object-cover"
                      />
                    )}
                    {!org.logo_url && (
                      <div className="absolute bottom-0 left-4 w-16 h-16 rounded-lg border-4 border-white shadow-md transform translate-y-1/2 bg-white flex items-center justify-center">
                        <Building2 className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>

                  <CardContent className="pt-12 pb-4">
                    <h3 className="font-semibold text-lg mb-2">{org.name}</h3>

                    {org.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{org.description}</p>
                    )}

                    <div className="space-y-2 text-sm text-muted-foreground mb-4">
                      {(org.city || org.country) && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{[org.city, org.country].filter(Boolean).join(', ')}</span>
                        </div>
                      )}
                      {org.volunteerCount !== undefined && (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>
                            {org.volunteerCount} {t('volunteers')}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Link to={`/organizations/${org.slug || org.id}`} className="flex-1">
                        <Button variant="outline" className="w-full">
                          {t('View')}
                        </Button>
                      </Link>
                      
                      {/* Check if user is already a member - simplified check */}
                      {myOrgs.some((m: any) => m.id === org.id) ? (
                         <Button disabled className="flex-1" variant="secondary">
                           {t('Member')}
                         </Button>
                      ) : (
                        <Button
                          onClick={() => handleJoinClick(org)}
                          className="flex-1"
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
