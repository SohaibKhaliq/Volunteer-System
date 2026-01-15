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
import { safeFormatDate } from '@/lib/format-utils';

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
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">{t('Help Requests')}</h1>
            <p className="text-muted-foreground max-w-2xl text-lg font-medium">
              {t('Browse urgent requests from the community or ask for help if you are in need.')}
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/help-request">
              <Button variant="destructive" className="rounded-lg px-6 font-bold shadow-xl shadow-destructive/20 h-12 uppercase text-[10px] tracking-widest">{t('Request Help')}</Button>
            </Link>
            <Link to="/help-offer">
              <Button variant="outline" className="rounded-lg px-6 font-bold border-border bg-card hover:bg-slate-50 dark:hover:bg-slate-900 h-12 uppercase text-[10px] tracking-widest">{t('Offer Help')}</Button>
            </Link>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="bg-card p-4 rounded-xl shadow-2xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-border mb-12 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 group">
            <div className="absolute inset-0 bg-primary/5 rounded-lg opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder={t('Search requests...')}
              className="pl-12 h-14 bg-slate-50 dark:bg-slate-900 border-border rounded-lg focus-visible:ring-primary focus-visible:ring-offset-0 text-base font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" className="h-14 rounded-lg border-border px-8 font-bold bg-card hover:bg-slate-50 dark:hover:bg-slate-900 uppercase text-[10px] tracking-widest">
            <Filter className="mr-2 h-4 w-4 opacity-50" /> {t('Filters')}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {(requests || []).map((req: any) => (
            <Card key={req.id} className="group hover:shadow-2xl hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 transition-all duration-300 overflow-hidden border-border rounded-xl bg-card relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
              <CardHeader className="p-8 pb-4">
                <div className="flex justify-between items-center mb-4">
                  <Badge
                    variant={['critical', 'high'].includes((req.severity || '').toLowerCase()) ? 'destructive' : 'secondary'}
                    className="rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-widest border-none"
                  >
                    {(req.severity || 'Normal').charAt(0).toUpperCase() + (req.severity || 'normal').slice(1)} {t('Priority')}
                  </Badge>
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center bg-slate-50 dark:bg-slate-900 px-2 py-1.5 rounded-md border border-border">
                    <Clock className="h-3 w-3 mr-1.5 opacity-50" />
                    {safeFormatDate(req.createdAt, 'dd MMM yyyy', t('Recent'))}
                  </span>
                </div>
                <CardTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">
                  {(req.types && req.types[0]?.name) || 'Help Request'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-0 space-y-8">
                <p className="text-sm text-slate-500 font-medium line-clamp-2 leading-relaxed">
                  {req.description}
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-border group-hover:border-primary/20 transition-colors">
                    <HeartHandshake className="h-4 w-4 text-primary opacity-70" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">{(req.types && req.types[0]?.name) || 'General'}</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-border group-hover:border-primary/20 transition-colors">
                    <MapPin className="h-4 w-4 text-primary opacity-70" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 truncate">{req.address || t('No location provided')}</span>
                  </div>
                </div>
                <Link to={`/detail/${DetailTypes.Request}/${req.id}`} className="block">
                  <Button className="w-full h-12 rounded-lg shadow-lg shadow-primary/10 hover:shadow-primary/20 hover:translate-y-[-1px] transition-all font-bold group-hover:bg-primary group-hover:text-white" variant="outline">
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
