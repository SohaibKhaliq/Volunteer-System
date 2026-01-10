import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar as CalendarIcon, MapPin, Car, Search, Filter } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// Fetch carpooling ads (offers & requests)
const useCarpooling = () =>
  useQuery(['carpooling-ads'], async () => {
    const res = await api.list('carpooling-ads');
    if (Array.isArray(res)) return res;
    if (res && Array.isArray((res as any).data)) return (res as any).data;
    return [] as any[];
  });

const Carpooling = () => {
  const { t } = useTranslation();
  const [date, setDate] = useState<Date | undefined>(new Date());
  // Filters panel state (closed by default)
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { data: rides = [] } = useCarpooling();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-primary pt-24 pb-32">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:30px_30px]" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-primary/90" />
        <div className="container relative px-4 mx-auto text-center">
          <Badge className="bg-white/10 text-white border-white/20 hover:bg-white/20 mb-6 backdrop-blur-sm px-4 py-1.5 rounded-full">
            <Car className="w-3.5 h-3.5 mr-2" />
            {t('Carpooling Community')}
          </Badge>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-6">
            {t('Travel Together,')} <br />
            <span className="text-white/80">{t('Save More')}</span>
          </h1>
          <p className="text-primary-foreground/80 text-lg md:text-xl max-w-2xl mx-auto font-medium">
            {t('Share rides, reduce carbon footprint, and help volunteers get to where they are needed.')}
          </p>
        </div>
      </div>

      <div className="container px-4 mx-auto -mt-16 relative z-10 pb-20">
        <div className="flex flex-col gap-8">
          {/* Search Bar */}
          <Card className="border-border/50 shadow-2xl shadow-primary/10 rounded-3xl bg-card overflow-hidden">
            <CardContent className="p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative group">
                  <div className="absolute inset-0 bg-primary/5 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    placeholder={t('Leaving from...')}
                    className="pl-12 h-14 bg-background border-border/50 rounded-xl focus-visible:ring-primary focus-visible:ring-offset-0 text-base"
                  />
                </div>
                <div className="relative group">
                  <div className="absolute inset-0 bg-primary/5 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    placeholder={t('Going to...')}
                    className="pl-12 h-14 bg-background border-border/50 rounded-xl focus-visible:ring-primary focus-visible:ring-offset-0 text-base"
                  />
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'w-full h-14 justify-start text-left font-medium rounded-xl border-border/50 bg-background hover:bg-muted/50',
                        !date && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-3 h-5 w-5 text-primary" />
                      {date ? format(date, 'PPP') : <span>{t('Pick a date')}</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-2xl border-border/50" align="start">
                    <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                  </PopoverContent>
                </Popover>
                <Button className="w-full h-14 rounded-xl text-lg font-bold shadow-lg shadow-primary/25 hover:shadow-xl hover:translate-y-[-2px] transition-all duration-300">
                  <Search className="mr-2 h-5 w-5" /> {t('Search Trips')}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setFiltersOpen((s) => !s)}
                className={cn(
                  "rounded-full px-6 transition-all",
                  filtersOpen && "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
              >
                <Filter className="h-4 w-4 mr-2" />
                {filtersOpen ? t('Hide Filters') : t('All Filters')}
              </Button>
              <div className="h-8 w-px bg-border/50 hidden md:block" />
              <div className="flex gap-2">
                <Badge variant="outline" className="rounded-full px-4 py-1 font-medium bg-card">
                  {rides.length} {t('Trips available')}
                </Badge>
              </div>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <Button variant="outline" className="flex-1 md:flex-none rounded-xl font-semibold border-primary/20 hover:bg-primary/5">
                {t('Request a Ride')}
              </Button>
              <Button className="flex-1 md:flex-none rounded-xl font-bold shadow-md">
                {t('Offer a Ride')}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Filters Sidebar */}
            <div className={cn(
              "lg:col-span-1 space-y-6 transition-all duration-300",
              filtersOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none lg:block lg:opacity-100 lg:translate-y-0 lg:pointer-events-auto"
            )}>
              <Card className="border-border/50 shadow-xl shadow-black/5 rounded-3xl bg-card overflow-hidden">
                <CardHeader className="bg-muted/30 pb-4 border-b">
                  <CardTitle className="text-xl font-black flex items-center gap-2">
                    <Filter className="h-5 w-5 text-primary" /> {t('Refine Search')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-8">
                  <div className="space-y-4">
                    <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{t('Listing Type')}</label>
                    <div className="flex flex-col gap-3">
                      {['All', 'Offers', 'Requests'].map((label) => (
                        <label key={label} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer border border-transparent hover:border-border/50 group">
                          <input type="checkbox" className="w-5 h-5 rounded-lg border-2 border-primary/20 text-primary focus:ring-primary/20 accent-primary" defaultChecked={label === 'All'} />
                          <span className="font-medium group-hover:text-foreground text-muted-foreground transition-colors">{t(label)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Ride List */}
            <div className="lg:col-span-3 space-y-6">
              {(rides || []).map((ride: any) => (
                <Card key={ride.id} className="border-border/50 hover:border-primary/50 shadow-lg hover:shadow-2xl hover:shadow-primary/5 rounded-[2rem] bg-card overflow-hidden transition-all duration-500 group cursor-pointer">
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-border/50">
                      {/* Inner Details */}
                      <div className="flex-1 p-8 space-y-8">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <Badge className={cn(
                              "px-4 py-1 rounded-full font-bold",
                              ride.type === 'Offer' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                            )} variant="outline">
                              {t(ride.type)}
                            </Badge>
                          </div>
                          <div className="text-2xl font-black text-primary tracking-tight">
                            {ride.price}
                          </div>
                        </div>

                        <div className="relative pl-10 border-l-2 border-dashed border-border/50 space-y-8 py-2 ml-4">
                          <div className="relative">
                            <div className="absolute -left-[37px] top-1.5 h-6 w-6 rounded-full border-4 border-background bg-primary shadow-sm" />
                            <div className="space-y-1">
                              <p className="font-black text-xl leading-tight">{ride.time}</p>
                              <p className="text-muted-foreground font-medium text-lg">{ride.from}</p>
                            </div>
                          </div>
                          <div className="relative">
                            <div className="absolute -left-[37px] top-1.5 h-6 w-6 rounded-full border-4 border-background bg-muted-foreground/30 shadow-sm" />
                            <div className="space-y-1">
                              <p className="font-black text-xl leading-tight">~ {t('Arrival Time')}</p>
                              <p className="text-muted-foreground font-medium text-lg">{ride.to}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Side Info */}
                      <div className="md:w-64 bg-muted/20 p-8 flex flex-col justify-between items-center text-center gap-6">
                        <div className="space-y-4">
                          <div className="relative inline-block">
                            <Avatar className="h-16 w-16 ring-4 ring-background shadow-lg">
                              <AvatarImage src={ride.driver?.image} />
                              <AvatarFallback className="bg-primary text-white text-xl font-bold">
                                {ride.driver?.name?.[0] || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 rounded-full px-2 py-0.5 text-[10px] font-black shadow-sm border border-border/50">
                              ★ {ride.driver?.rating || 'N/A'}
                            </div>
                          </div>
                          <div>
                            <p className="font-black text-lg text-foreground">{ride.driver?.name || t('Unknown Driver')}</p>
                            <div className="flex items-center justify-center gap-1.5 text-muted-foreground mt-1">
                              <Car className="h-3.5 w-3.5" />
                              <span className="text-sm font-bold uppercase tracking-wider">{ride.seats} {t('seats left')}</span>
                            </div>
                          </div>
                        </div>

                        <Button className="w-full rounded-2xl h-12 font-black tracking-wide group-hover:scale-[1.02] transition-transform">
                          {t('Reserve Seat')}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {rides.length === 0 && (
                <div className="py-20 text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
                    <Car className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-2xl font-black mb-2">{t('No rides found')}</h3>
                  <p className="text-muted-foreground text-lg max-w-md mx-auto">
                    {t('Try adjusting your filters or search criteria to find available trips in your area.')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Carpooling;
