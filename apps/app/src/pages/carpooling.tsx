import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar as CalendarIcon, MapPin, Clock, Car, Search, Filter, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const MOCK_RIDES = [
  {
    id: 1,
    driver: { name: 'Ahmed K.', rating: 4.8, image: 'https://github.com/shadcn.png' },
    from: 'Marrakech',
    to: 'Al Haouz',
    date: new Date(2024, 10, 25),
    time: '08:00 AM',
    seats: 3,
    price: 'Free',
    type: 'Offer'
  },
  {
    id: 2,
    driver: { name: 'Sarah M.', rating: 4.9, image: 'https://github.com/shadcn.png' },
    from: 'Casablanca',
    to: 'Marrakech',
    date: new Date(2024, 10, 26),
    time: '09:30 AM',
    seats: 2,
    price: 'Share Gas',
    type: 'Request'
  },
  {
    id: 3,
    driver: { name: 'Youssef B.', rating: 4.7, image: 'https://github.com/shadcn.png' },
    from: 'Rabat',
    to: 'Tangier',
    date: new Date(2024, 10, 27),
    time: '07:00 AM',
    seats: 4,
    price: 'Free',
    type: 'Offer'
  }
];

const Carpooling = () => {
  const { t } = useTranslation();
  const [date, setDate] = useState<Date | undefined>(new Date());
  // Filters panel state (closed by default)
  const [filtersOpen, setFiltersOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="container px-4 mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t('Carpooling')}</h1>
            <p className="text-muted-foreground max-w-2xl">
              {t('Share rides, reduce carbon footprint, and help volunteers get to where they are needed.')}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">{t('Request a Ride')}</Button>
            <Button>{t('Offer a Ride')}</Button>
          </div>
        </div>

        {/* Search Bar */}
        <Card className="mb-8 border-none shadow-md">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input placeholder={t('Leaving from...')} className="pl-9" />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input placeholder={t('Going to...')} className="pl-9" />
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={'outline'}
                    className={cn('w-full justify-start text-left font-normal', !date && 'text-muted-foreground')}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'PPP') : <span>{t('Pick a date')}</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                </PopoverContent>
              </Popover>
              <Button className="w-full">
                <Search className="mr-2 h-4 w-4" /> {t('Search Rides')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {/* Filters toggle (closed on initial load) */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <Button
              variant="outline"
              onClick={() => setFiltersOpen((s) => !s)}
              aria-expanded={filtersOpen}
              aria-controls="filters-panel"
            >
              <Filter className="h-4 w-4 mr-2" /> {filtersOpen ? t('Hide Filters') : t('Filters')}
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Filters Sidebar (desktop + responsive) - initially hidden, toggle opens it */}
          <div id="filters-panel" className={`${filtersOpen ? 'block' : 'hidden'} space-y-6`}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Filter className="h-4 w-4" /> {t('Filters')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('Ride Type')}</label>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" className="rounded border-gray-300" defaultChecked /> {t('All')}
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" className="rounded border-gray-300" /> {t('Offers')}
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" className="rounded border-gray-300" /> {t('Requests')}
                    </label>
                  </div>
                </div>
                {/* Add more filters as needed */}
              </CardContent>
            </Card>
          </div>

          {/* Ride List */}
          <div className="lg:col-span-2 space-y-4">
            {MOCK_RIDES.map((ride) => (
              <Card key={ride.id} className="hover:shadow-md transition-shadow cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Time & Route */}
                    <div className="flex-1 space-y-4">
                      <div className="flex justify-between items-start">
                        <Badge variant={ride.type === 'Offer' ? 'default' : 'secondary'}>{ride.type}</Badge>
                        <span className="font-bold text-lg text-primary">{ride.price}</span>
                      </div>

                      <div className="relative pl-6 border-l-2 border-slate-200 space-y-6 py-1">
                        <div className="relative">
                          <div className="absolute -left-[29px] top-1 h-3 w-3 rounded-full border-2 border-slate-400 bg-white" />
                          <p className="font-semibold text-lg">{ride.time}</p>
                          <p className="text-muted-foreground">{ride.from}</p>
                        </div>
                        <div className="relative">
                          <div className="absolute -left-[29px] top-1 h-3 w-3 rounded-full border-2 border-slate-400 bg-slate-400" />
                          <p className="font-semibold text-lg">~ {t('Arrival Time')}</p>
                          <p className="text-muted-foreground">{ride.to}</p>
                        </div>
                      </div>
                    </div>

                    {/* Driver Info */}
                    <div className="flex md:flex-col items-center justify-between md:justify-center md:border-l md:pl-6 gap-4 min-w-[150px]">
                      <div className="flex items-center gap-3 md:flex-col md:text-center">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={ride.driver.image} />
                          <AvatarFallback>{ride.driver.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{ride.driver.name}</p>
                          <p className="text-xs text-muted-foreground">★ {ride.driver.rating}</p>
                        </div>
                      </div>
                      <div className="text-right md:text-center">
                        <p className="text-sm text-muted-foreground mb-1">
                          <Car className="inline h-3 w-3 mr-1" />
                          {ride.seats} {t('seats left')}
                        </p>
                        <Button size="sm" className="w-full group-hover:bg-primary/90">
                          {t('View')} <ArrowRight className="ml-1 h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Carpooling;
