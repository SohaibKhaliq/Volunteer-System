import React, { useState } from 'react';
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
import { Search, Map as MapIcon, List, Filter, Calendar, MapPin, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import L from 'leaflet';

// Fix for default marker icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Events are loaded dynamically via the API. The component previously used
// static MOCK_EVENTS but now relies on `api.listEvents`.

const MapPage = () => {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // debounce search to avoid too many requests
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const token = useStore((s) => s.token);

  const { data: eventsData = [], isLoading: isLoadingEvents } = useQuery(
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

  const joinMutation = useMutation({
    mutationFn: (eventId: number) => api.joinEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries(['map-events']);
      toast({ title: 'Joined', description: 'You joined the event' });
    },
    onError: (err: any) => {
      toast({ title: 'Failed', description: err?.response?.data?.message || 'Unable to join' });
    }
  });

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Filters Bar */}
      <div className="bg-white border-b p-4 flex flex-col md:flex-row gap-4 items-center justify-between sticky top-0 z-10">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('Search opportunities...')}
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <Button variant="outline" size="sm" className="whitespace-nowrap">
            <Filter className="mr-2 h-4 w-4" /> {t('All Types')}
          </Button>
          <Button variant="outline" size="sm" className="whitespace-nowrap">
            <Calendar className="mr-2 h-4 w-4" /> {t('Any Date')}
          </Button>
          <div className="ml-auto flex border rounded-md overflow-hidden">
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              className="rounded-none px-3"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'map' ? 'secondary' : 'ghost'}
              size="sm"
              className="rounded-none px-3"
              onClick={() => setViewMode('map')}
            >
              <MapIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* List View */}
        <div
          className={`w-full md:w-1/2 lg:w-2/5 overflow-y-auto p-4 space-y-4 ${viewMode === 'map' ? 'hidden md:block' : 'block'}`}
        >
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-semibold text-lg">{t('Available Opportunities')}</h2>
            <span className="text-sm text-muted-foreground">
              {(eventsData || []).length} {t('results')}
            </span>
          </div>

          {(eventsData || []).map((event: any) => (
            <Card key={event.id} className="hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row h-full">
                <div className="w-full sm:w-32 h-32 sm:h-auto bg-slate-100 relative shrink-0">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="absolute inset-0 w-full h-full object-cover rounded-t-lg sm:rounded-l-lg sm:rounded-tr-none"
                  />
                </div>
                <div className="flex-1 p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-1">
                      <Badge variant="secondary" className="text-xs">
                        {event.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{event.date}</span>
                    </div>
                    <h3 className="font-bold text-lg leading-tight mb-1">{event.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{event.organization}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {event.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {event.time}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end items-center gap-2">
                    <Link to={`/detail/event/${event.id}`}>
                      <Button size="sm" variant="outline">
                        {t('View Details')}
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      onClick={() => {
                        if (!token) {
                          const returnTo = encodeURIComponent(
                            window.location.pathname + window.location.search + window.location.hash
                          );
                          window.location.href = `/login?returnTo=${returnTo}`;
                          return;
                        }
                        joinMutation.mutate(event.id);
                      }}
                    >
                      {joinMutation.isLoading ? t('Joining...') : t('Join Now')}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Map View */}
        <div className={`flex-1 bg-slate-100 relative ${viewMode === 'list' ? 'hidden md:block' : 'block'}`}>
          <MapContainer center={[31.6295, -7.9811]} zoom={13} className="w-full h-full z-0">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {(eventsData || []).map((event: any) =>
              event.coordinates ? (
                <Marker key={event.id} position={event.coordinates as [number, number]}>
                  <Popup>
                    <div className="p-2 min-w-[200px]">
                      <h3 className="font-bold text-sm mb-1">{event.title}</h3>
                      <p className="text-xs text-muted-foreground mb-2">{event.location}</p>
                      <div className="space-y-2">
                        <Link to={`/detail/event/${event.id}`}>
                          <Button size="sm" className="w-full h-8 text-xs">
                            {t('View')}
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          className="w-full h-8 text-xs"
                          onClick={() => {
                            if (!token) {
                              const returnTo = encodeURIComponent(
                                window.location.pathname + window.location.search + window.location.hash
                              );
                              window.location.href = `/login?returnTo=${returnTo}`;
                              return;
                            }
                            joinMutation.mutate(event.id);
                          }}
                        >
                          {joinMutation.isLoading ? t('Joining...') : t('Join')}
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
