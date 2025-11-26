import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Users, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

const Organizations = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const { data: organizations, isLoading } = useQuery(['organizations'], () => api.listOrganizations() as unknown as Promise<any[]>);

  const filteredOrgs = organizations?.filter((org: any) => 
    org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.category?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="container px-4 mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t('Partner Organizations')}</h1>
            <p className="text-muted-foreground max-w-2xl">
              {t('Discover the amazing groups working to make a difference. Join them or support their cause.')}
            </p>
          </div>
          <Link to="/organizations/register">
            <Button>{t('Register Your Organization')}</Button>
          </Link>
        </div>

        {/* Search & Filter */}
        <div className="bg-white p-4 rounded-lg shadow-sm border mb-8 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder={t('Search organizations by name or category...')} 
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline">{t('Filters')}</Button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="h-[400px] bg-slate-100 rounded-lg animate-pulse" />
            ))
          ) : (
            filteredOrgs.map((org: any) => (
              <Card key={org.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                <div className="h-48 bg-slate-200 relative">
                  <img 
                    src={org.image || `https://images.unsplash.com/photo-${org.id % 2 === 0 ? '1542601906990-b4d3fb778b09' : '1469571486292-0ba58a3f068b'}?q=80&w=800&auto=format&fit=crop`}
                    alt={org.name} 
                    className="w-full h-full object-cover"
                  />
                  <Badge className="absolute top-4 right-4 bg-white/90 text-slate-900 hover:bg-white/100">
                    {org.category || 'General'}
                  </Badge>
                </div>
                <CardHeader>
                  <CardTitle className="flex justify-between items-start">
                    <span>{org.name}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {org.description}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" /> {org.city || org.location || 'Remote'}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" /> {org.members_count || 0} members
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t bg-slate-50/50 p-4">
                  <Link to={`/organizations/${org.id}`} className="w-full">
                    <Button variant="ghost" className="w-full justify-between group">
                      {t('View Profile')} 
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Organizations;
