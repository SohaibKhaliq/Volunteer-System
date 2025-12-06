import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, HeartHandshake, AlertCircle, MapPin, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Fetch help requests from API
const useHelpRequests = () =>
  useQuery(['help-requests'], async () => {
    const res = await api.list('help-requests');
    if (Array.isArray(res)) return res;
    if (res && Array.isArray((res as any).data)) return (res as any).data;
    return [] as any[];
  });

const Help = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const { data: requests = [] } = useHelpRequests();

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="container px-4 mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t('Help Requests')}</h1>
            <p className="text-muted-foreground max-w-2xl">
              {t('Browse urgent requests from the community or ask for help if you are in need.')}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="destructive">{t('Request Help')}</Button>
            <Button variant="outline">{t('Offer Help')}</Button>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="bg-white p-4 rounded-lg shadow-sm border mb-8 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('Search requests...')}
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" /> {t('Filters')}
          </Button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(requests || []).map((req: any) => (
            <Card key={req.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-primary">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant={req.urgency === 'Critical' || req.urgency === 'High' ? 'destructive' : 'secondary'}>
                    {req.urgency} Priority
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center">
                    <Clock className="h-3 w-3 mr-1" /> {req.date}
                  </span>
                </div>
                <CardTitle className="text-lg">{req.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{req.description}</p>
                <div className="space-y-2 text-sm text-slate-600 mb-4">
                  <div className="flex items-center gap-2">
                    <HeartHandshake className="h-4 w-4 text-primary" /> {req.category}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" /> {req.location}
                  </div>
                </div>
                <Button className="w-full" variant="outline">
                  {t('View Details')}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Help;
