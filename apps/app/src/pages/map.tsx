import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/atoms/use-toast';
import { useStore } from '@/lib/store';
import api from '@/lib/api';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Search, Map as MapIcon, List, Filter, Calendar as CalendarIcon, MapPin, Clock, LayoutTemplate } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// Fix for default marker icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const MapPage = () => {
  const { t } = useTranslation();
  // View mode state: 'list' | 'map' | 'split'
  const [viewMode, setViewMode] = useState<'list' | 'map' | 'split'>('split');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Filter states
  const [selectedType, setSelectedType] = useState<string>('all');
  const [date, setDate] = useState<Date | undefined>();

  // debounce search to avoid too many requests
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const token = useStore((s) => s.token);

  const { data: eventsData = [] } = useQuery(
    ['map-events', debouncedQuery],
    async () => {
      const res = await api.listEvents({ q: debouncedQuery });
      // API can return array or object wrapper; try to normalize
      if (Array.isArray(res)) return res as any[];
      if (res && Array.isArray((res as any).data)) return (res as any).data;
      return [] as any[];
    },
    { keepPreviousData: true }
  );

  // Derived filtered events
  const filteredEvents = useMemo(() => {
    return (eventsData || []).filter((event: any) => {
      // Type filter
      if (selectedType !== 'all' && event.type !== selectedType) {
        return false;
      }
      // Date filter (simple match on string date vs selected date)
      if (date) {
        const eventDate = new Date(event.startAt || event.date);
        if (
          eventDate.getFullYear() !== date.getFullYear() ||
          eventDate.getMonth() !== date.getMonth() ||
          eventDate.getDate() !== date.getDate()
        ) {
          return false;
        }
      }
      return true;
    });
  }, [eventsData, selectedType, date]);

  // Extract unique types for the filter
  const uniqueTypes = useMemo(() => {
    const types = new Set((eventsData || []).map((e: any) => e.type));
    return Array.from(types).filter(Boolean) as string[];
  }, [eventsData]);

  const [loadingByEvent, setLoadingByEvent] = useState<Record<number, boolean>>({});

  const joinItemMutation = useMutation({
    mutationFn: (eventId: number) => api.joinEvent(eventId),
    onMutate: (eventId: number) => {
      setLoadingByEvent((s) => ({ ...s, [eventId]: true }));
    },
    onSettled: (_data, _err, eventId: number) => {
      setLoadingByEvent((s) => ({ ...s, [eventId]: false }));
      queryClient.invalidateQueries(['map-events']);
    },
    onSuccess: () => {
      toast({ title: 'Joined', description: 'You joined the event' });
    },
    onError: (err: any) => {
      toast({ title: 'Failed', description: err?.response?.data?.message || 'Unable to join' });
    }
  });

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-background">
      {/* Filters Bar */}
      <div className="bg-background/80 backdrop-blur-md border-b border-border/50 px-6 py-4 flex flex-col md:flex-row gap-4 items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder={t('Search opportunities...')}
            className="pl-11 h-11 bg-card/50 border-border/50 focus:bg-card transition-all rounded-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 items-center no-scrollbar">
          {/* Type Filter */}
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="h-10 w-[160px] rounded-full border-border/50 bg-card/50 text-muted-foreground hover:text-primary hover:border-primary/20 hover:bg-primary/5 transition-all">
              <div className="flex items-center truncate">
                <Filter className="mr-2 h-3.5 w-3.5 shrink-0" />
                <SelectValue placeholder={t('All Types')} />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">{t('All Types')}</SelectItem>
              {uniqueTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-10 rounded-full border-border/50 bg-card/50 text-muted-foreground hover:text-primary hover:border-primary/20 hover:bg-primary/5 px-4 font-normal justify-start text-left",
                  date && "text-foreground border-primary/20 bg-primary/5"
                )}
              >
                <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                {date ? format(date, "PPP") : <span>{t('Any Date')}</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-2xl" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* View Toggle */}
          <div className="ml-auto md:ml-2 flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-border/50 shrink-0">
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "p-2 rounded-md transition-all",
                viewMode === 'list' ? "bg-background shadow-lg text-primary" : "text-muted-foreground hover:text-foreground"
              )}
              title={t('List View')}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={cn(
                "p-2 rounded-md transition-all hidden md:block",
                viewMode === 'split' ? "bg-background shadow-lg text-primary" : "text-muted-foreground hover:text-foreground"
              )}
              title={t('Split View')}
            >
              <LayoutTemplate className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={cn(
                "p-2 rounded-md transition-all",
                viewMode === 'map' ? "bg-background shadow-lg text-primary" : "text-muted-foreground hover:text-foreground"
              )}
              title={t('Map View')}
            >
              <MapIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* List View */}
        <div
          className={cn(
            "overflow-y-auto transition-all duration-300",
            viewMode === 'map' ? "hidden" : "block", // Hide if map only
            viewMode === 'split' ? "hidden md:block w-full md:w-1/2 lg:w-5/12 xl:w-1/3" : "w-full" // Split vs Full
          )}
        >
          <div className="p-6 space-y-6">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="font-bold text-2xl text-foreground tracking-tight">{t('Available Opportunities')}</h2>
                <p className="text-muted-foreground text-sm mt-1">{t('Find the perfect way to give back')}</p>
              </div>
              <Badge variant="outline" className="h-7 px-3 rounded-md bg-slate-50 dark:bg-slate-900 border-border/50 font-bold text-[10px] uppercase tracking-widest text-muted-foreground">
                {filteredEvents.length} {t('results')}
              </Badge>
            </div>

            <div className="space-y-4">
              {filteredEvents.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <p>{t('No opportunities found matching your filters.')}</p>
                  <Button
                    variant="link"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedType('all');
                      setDate(undefined);
                    }}
                  >
                    {t('Clear all filters')}
                  </Button>
                </div>
              ) : (
                filteredEvents.map((event: any) => (
                  <Card
                    key={event.id}
                    className="group overflow-hidden border border-border transition-all duration-300 bg-card rounded-xl shadow-2xl shadow-slate-200/50 dark:shadow-slate-900/50"
                  >
                    <div className="flex flex-col sm:flex-row h-full">
                      <div className="w-full sm:w-40 h-48 sm:h-auto relative shrink-0 overflow-hidden">
                        <div className="absolute inset-0 bg-slate-200 animate-pulse" />
                        <img
                          src={event.image}
                          alt={event.title}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60 sm:hidden" />
                        <div className="absolute top-3 left-3 flex gap-2">
                          <Badge className="bg-white/90 text-slate-900 backdrop-blur-sm border-0 shadow-sm hover:bg-white font-medium">
                            {event.type}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex-1 p-5 flex flex-col justify-between relative">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start gap-2">
                            <div className="text-[10px] font-black uppercase tracking-widest text-primary/70">
                              {event.organization}
                            </div>
                            <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest whitespace-nowrap bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded-md border border-border">
                              {event.date}
                            </span>
                          </div>

                          <h3 className="font-bold text-lg leading-snug text-foreground group-hover:text-primary transition-colors">
                            {event.title}
                          </h3>

                          <div className="space-y-2 mt-auto">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4 text-primary shrink-0 opacity-50" />
                              <span className="truncate font-medium">{event.location}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4 text-primary shrink-0 opacity-50" />
                              <span className="font-medium">{event.time}</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-5 flex gap-3 pt-4 border-t border-border">
                          <Link to={`/detail/event/${event.id}`} className="flex-1">
                            <Button variant="ghost" className="w-full h-11 justify-center rounded-lg border border-border bg-white dark:bg-slate-900 hover:bg-primary hover:text-white transition-all font-bold text-xs">
                              {t('Details')}
                            </Button>
                          </Link>
                          <Button
                            className="flex-1 h-11 rounded-lg shadow-xl shadow-primary/20 font-bold text-xs"
                            onClick={(e) => {
                              e.preventDefault();
                              if (!token) {
                                const returnTo = encodeURIComponent(
                                  window.location.pathname + window.location.search + window.location.hash
                                );
                                window.location.href = `/login?returnTo=${returnTo}`;
                                return;
                              }
                              joinItemMutation.mutate(event.id);
                            }}
                            disabled={!!loadingByEvent[event.id]}
                          >
                            {loadingByEvent[event.id] ? t('Joining...') : t('Join Now')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Map View */}
        <div
          className={cn(
            "bg-slate-100 relative transition-all duration-300",
            viewMode === 'list' ? "hidden" : "block", // Hide if list only
            viewMode === 'split' ? "hidden md:flex flex-1" : "w-full h-full" // Split vs Full
          )}
        >
          <MapContainer center={[31.6295, -7.9811]} zoom={13} className="w-full h-full z-0">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {filteredEvents.map((event: any) =>
              event.coordinates ? (
                <Marker key={event.id} position={event.coordinates as [number, number]}>
                  <Popup className="custom-popup">
                    <div className="p-3 min-w-[240px]">
                      <div className="relative h-32 rounded-lg overflow-hidden mb-3">
                        <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                        <div className="absolute top-2 left-2 px-2 py-0.5 bg-white/90 backdrop-blur rounded text-[10px] font-bold uppercase tracking-wider">
                          {event.type}
                        </div>
                      </div>
                      <h3 className="font-bold text-base mb-1 leading-tight">{event.title}</h3>
                      <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {event.location}
                      </p>

                      <div className="grid grid-cols-2 gap-2">
                        <Link to={`/detail/event/${event.id}`}>
                          <Button size="sm" variant="outline" className="w-full h-8 text-xs rounded-lg">
                            {t('View')}
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          className="w-full h-8 text-xs rounded-lg shadow-sm"
                          onClick={() => {
                            if (!token) {
                              const returnTo = encodeURIComponent(
                                window.location.pathname + window.location.search + window.location.hash
                              );
                              window.location.href = `/login?returnTo=${returnTo}`;
                              return;
                            }
                            joinItemMutation.mutate(event.id);
                          }}
                          disabled={!!loadingByEvent[event.id]}
                        >
                          {loadingByEvent[event.id] ? "..." : t('Join')}
                        </Button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ) : null
            )}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default MapPage;
