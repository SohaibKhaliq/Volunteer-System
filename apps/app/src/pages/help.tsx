import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, HeartHandshake, MapPin, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DetailTypes } from '@/lib/types';

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
    <div className="min-h-screen bg-background py-16">
      <div className="container px-4 mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">{t('Help Requests')}</h1>
            <p className="text-muted-foreground max-w-2xl text-lg">
              {t('Browse urgent requests from the community or ask for help if you are in need.')}
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/help-request">
              <Button variant="destructive" className="rounded-xl px-6 font-bold shadow-lg shadow-destructive/20">{t('Request Help')}</Button>
            </Link>
            <Link to="/help-offer">
              <Button variant="outline" className="rounded-xl px-6 font-bold border-border/50 bg-card hover:bg-muted">{t('Offer Help')}</Button>
            </Link>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="bg-card/50 backdrop-blur-sm p-3 rounded-[2rem] shadow-sm border border-border/50 mb-12 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder={t('Search requests...')}
              className="pl-11 h-12 bg-background/50 border-border/50 rounded-xl focus:bg-background transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" className="h-12 rounded-xl border-border/50 px-6 font-medium bg-card">
            <Filter className="mr-2 h-4 w-4" /> {t('Filters')}
          </Button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(requests || []).map((req: any) => (
            <Card key={req.id} className="group hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 overflow-hidden border-border/50 border-l-4 border-l-primary rounded-[2.5rem] bg-card">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start mb-2">
                  <Badge
                    variant={['critical', 'high'].includes((req.severity || '').toLowerCase()) ? 'destructive' : 'secondary'}
                    className="rounded-lg px-2 py-0.5"
                  >
                    {(req.severity || 'Normal').charAt(0).toUpperCase() + (req.severity || 'normal').slice(1)} Priority
                  </Badge>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center bg-muted/50 px-2 py-1 rounded-md">
                    <Clock className="h-3 w-3 mr-1 text-primary/70" />
                    {req.createdAt && !isNaN(new Date(req.createdAt).getTime())
                      ? new Date(req.createdAt).toLocaleDateString()
                      : t('Recent')}
                  </span>
                </div>
                <CardTitle className="text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                  {(req.types && req.types[0]?.name) || 'Help Request'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed h-10">
                  {req.description}
                </p>
                <div className="space-y-3 text-sm font-medium">
                  <div className="flex items-center gap-2 text-foreground/80 bg-muted/30 p-2 rounded-xl border border-border/30">
                    <HeartHandshake className="h-4 w-4 text-primary" />
                    <span>{(req.types && req.types[0]?.name) || 'General'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground/80 bg-muted/30 p-2 rounded-xl border border-border/30">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="truncate">{req.address || t('No location provided')}</span>
                  </div>
                </div>
                <Link to={`/detail/${DetailTypes.Request}/${req.id}`} className="w-full">
                  <Button className="w-full h-11 rounded-xl shadow-lg shadow-primary/5 group-hover:shadow-primary/20 transition-all font-bold" variant="outline">
                    {t('View Details')}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Help;
