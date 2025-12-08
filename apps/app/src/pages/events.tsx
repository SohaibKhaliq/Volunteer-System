import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, MapPin, Calendar, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Events() {
  const [search, setSearch] = useState('');
  const [cause, setCause] = useState<string>('');
  const [skill, setSkill] = useState<string>('');
  const [location, setLocation] = useState('');

  // Debounce search could be added here, for now simpler
  const { data: events, isLoading } = useQuery(
    ['events', search, cause, skill, location],
    () => api.getEvents({ search, cause, skill, location })
  );

  const CAUSES = ["Environment", "Education", "Health", "Animal Welfare", "Disaster Relief"];
  const SKILLS = ["Teaching", "Medical", "Driver", "Cooking", "Technical"];

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col space-y-4 mb-8">
        <h1 className="text-3xl font-bold">Find Volunteering Opportunities</h1>
        <p className="text-muted-foreground">Discover events that match your skills and passion.</p>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
          <Input
            placeholder="Search location..."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="bg-background"
          />
          <Select value={cause} onValueChange={setCause}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Select Cause" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All Causes</SelectItem>
                {CAUSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
           <Select value={skill} onValueChange={setSkill}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Select Skill" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All Skills</SelectItem>
                {SKILLS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
           <Button variant="secondary" onClick={() => { setLocation(''); setCause(''); setSkill('') }}>
             Reset Filters
           </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events?.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No events found matching your criteria.
            </div>
          ) : (
            events?.map((event: any) => (
              <Card key={event.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl line-clamp-1">{event.title}</CardTitle>
                    <Badge variant={event.status === 'Upcoming' ? 'default' : 'secondary'}>
                      {event.status}
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center mt-1">
                    <MapPin className="h-3 w-3 mr-1" />
                    {event.location || 'Online'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {event.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-2">
                     {event.cause && <Badge variant="outline">{event.cause}</Badge>}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      {event.date}
                    </div>
                     <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                      {event.assigned_volunteers} / {event.capacity || 'Unltd'}
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full">
                    <Link to={`/events/${event.id}`}>View Details</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
