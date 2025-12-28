import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api'; // Assuming api helper exists
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Search, MapPin, Calendar, Clock, Filter, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function VolunteerOpportunities() {
  const [search, setSearch] = useState('');
  const [city, setCity] = useState(''); // Could be a select if we have a list
  const [dateFilter, setDateFilter] = useState('upcoming'); // upcoming, this_week, etc.

  // Fetch opportunities
  const { data: opportunities, isLoading } = useQuery({
    queryKey: ['volunteer-opportunities', search, city, dateFilter],
    queryFn: async () => {
      // Build query string
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (city) params.append('city', city);
      if (dateFilter === 'upcoming') params.append('dateFrom', new Date().toISOString());

      const res = await api.get(`/volunteer/opportunities?${params.toString()}`);
      return res.data;
    }
  });

  // Mock organizations for filter if needed, or just text input for now

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Browse Opportunities</h1>
          <p className="text-muted-foreground mt-1">Find and sign up for volunteering events near you.</p>
        </div>
        {/* <Button>My Applications</Button> */}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-card p-4 rounded-lg border shadow-sm">
        <div className="relative md:col-span-2">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, description..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div>
          <Input placeholder="City / Location" value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
        <div>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="all">All Dates</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Skeletons could go here */}
          <p>Loading opportunities...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {opportunities?.data?.map((opp: any) => (
            <Card key={opp.id} className="flex flex-col overflow-hidden hover:shadow-md transition-shadow">
              {/* Image placeholder if we had one - defaulting to pattern or gradient */}
              <div className="h-32 bg-gradient-to-r from-blue-500 to-cyan-500 relative">
                {/* Org Logo potential placement */}
                <div className="absolute bottom-[-16px] left-4">
                  <div className="w-12 h-12 rounded-full bg-white border-2 border-white flex items-center justify-center text-xs font-bold text-gray-500 shadow-sm overflow-hidden">
                    {opp.organization?.name?.[0] || <Building2 className="w-6 h-6" />}
                  </div>
                </div>
              </div>
              <CardHeader className="pt-8 pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg line-clamp-1">{opp.title}</CardTitle>
                  {opp.capacity > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {opp.capacity} spots
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Building2 className="w-3 h-3" /> {opp.organization?.name || 'Organization'}
                </p>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <p className="text-sm line-clamp-3 text-gray-600 dark:text-gray-300">
                  {opp.description || 'No description provided.'}
                </p>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>{format(new Date(opp.startAt), 'PPP')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>
                      {format(new Date(opp.startAt), 'p')} - {opp.endAt ? format(new Date(opp.endAt), 'p') : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="truncate">{opp.location || 'TBA'}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-2 border-t bg-muted/20">
                <Button asChild className="w-full">
                  <Link to={`/volunteer/opportunities/${opp.id}`}>View Details</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
          {opportunities?.data?.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              <p>No opportunities found matching your criteria.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
