import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Users, Calendar, MapPin, CheckCircle, LogOut, ArrowRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const VolunteerOrganizationsPage = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('my-orgs');

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
  const { data: publicOrgsData, isLoading: loadingPublicOrgs } = useQuery({
    queryKey: ['public-organizations'],
    queryFn: async () => {
      try {
        const res = await api.getPublicOrganizations({ perPage: 50 });
        return (res as any)?.data || [];
      } catch {
        return [];
      }
    }
  });

  // Join organization mutation
  const [loadingByOrg, setLoadingByOrg] = useState<Record<number, boolean>>({});

  const joinMutation = useMutation({
    mutationFn: (id: number) => api.joinVolunteerOrganization(id),
    onMutate: (id: number) => {
      setLoadingByOrg((s) => ({ ...s, [id]: true }));
    },
    onSettled: (data, err, id: number) => {
      setLoadingByOrg((s) => ({ ...s, [id]: false }));
      queryClient.invalidateQueries({ queryKey: ['my-organizations'] });
    },
    onSuccess: () => {
      toast.success(t('Membership request submitted'));
    },
    onError: () => {
      toast.error(t('Failed to join organization'));
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
    onError: () => {
      toast.error(t('Failed to leave organization'));
    }
  });

  const myOrgs = myOrgsData || [];
  const publicOrgs = publicOrgsData || [];

  // Filter out organizations user already belongs to
  const myOrgIds = myOrgs.map((o: any) => o.id);
  const availableOrgs = publicOrgs.filter((o: any) => !myOrgIds.includes(o.id));

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
          {loadingPublicOrgs ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : availableOrgs.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                <p className="text-muted-foreground">{t("You're already a member of all available organizations!")}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                      <Button
                        onClick={() => joinMutation.mutate(org.id)}
                        disabled={!!loadingByOrg[org.id]}
                        className="flex-1"
                      >
                        {loadingByOrg[org.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : t('Join')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VolunteerOrganizationsPage;
