import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from '@/components/atoms/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, MapPin, Plus, Search, Filter, Clock, Sparkles, Loader2, MoreHorizontal, Trash2 } from 'lucide-react';

export default function OrganizationEvents() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);

  // Fetch Events
  const { data: events, isLoading } = useQuery({
    queryKey: ['organizationEvents'],
    queryFn: api.listOrganizationEvents
  });

  // Create/Update Event Mutation
  const saveEventMutation = useMutation({
    mutationFn: (data: any) => {
      if (editingEvent) {
        return api.updateOrganizationEvent(editingEvent.id, data);
      }
      return api.createOrganizationEvent(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationEvents'] });
      setIsCreateOpen(false);
      toast.success(editingEvent ? 'Event updated successfully' : 'Event created successfully');
    },
    onError: () => {
      toast.error('Failed to save event');
    }
  });

  // Delete Event Mutation
  const deleteEventMutation = useMutation({
    mutationFn: api.deleteOrganizationEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationEvents'] });
      toast.success('Event deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete event');
    }
  });

  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    type: 'Community',
    status: 'Upcoming',
    description: '',
    capacity: '',
    latitude: '',
    longitude: '',
    skills: ''
  });

  const handleOpenCreate = () => {
    setEditingEvent(null);
    setFormData({
      title: '',
      date: '',
      time: '',
      location: '',
      latitude: '',
      longitude: '',
      type: 'Community',
      status: 'Upcoming',
      description: '',
      capacity: '',
      skills: ''
    });
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (event: any) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      date: event.date,
      time: event.time,
      location: event.location,
      type: event.type,
      status: event.status,
      description: event.description || '',
      capacity: event.capacity ? event.capacity.toString() : '',
      skills: event.skills ? event.skills.join(', ') : '',
      latitude: event.latitude ?? (event.coordinates ? event.coordinates[0] : ''),
      longitude: event.longitude ?? (event.coordinates ? event.coordinates[1] : '')
    });
    setIsCreateOpen(true);
  };

  const handleSubmit = () => {
    const payload = {
      ...formData,
      capacity: parseInt(formData.capacity) || 0,
      skills: formData.skills
        .split(',')
        .map((s: string) => s.trim())
        .filter((s: string) => s)
    };
    // include coords if present
    if (formData.latitude !== '') payload.latitude = parseFloat(String(formData.latitude));
    if (formData.longitude !== '') payload.longitude = parseFloat(String(formData.longitude));
    saveEventMutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const displayEvents = Array.isArray(events) ? events : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Events & Tasks</h2>
          <p className="text-muted-foreground">Manage your upcoming events and volunteer tasks.</p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Event
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search events..." className="pl-8" />
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event Name</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Volunteers</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayEvents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No events found. Create one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                displayEvents.map((event: any) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">
                      {event.title}
                      <div className="text-xs text-muted-foreground">{event.type}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {event.date}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {event.time}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {event.location}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={event.status === 'Upcoming' ? 'default' : 'secondary'}>{event.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-gray-200 rounded-full h-2 w-24">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${(event.registered / event.capacity) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {event.registered}/{event.capacity}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(event)}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600"
                          onClick={() => deleteEventMutation.mutate(event.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingEvent ? 'Edit Event' : 'Create New Event'}</DialogTitle>
            <DialogDescription>
              {editingEvent
                ? 'Update event details.'
                : 'Fill in the details to create a new event or task for volunteers.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title</Label>
                <Input
                  id="title"
                  placeholder="e.g. Beach Cleanup"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Input
                  id="type"
                  placeholder="e.g. Community, Emergency"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <div className="relative">
                <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="location"
                  className="pl-8"
                  placeholder="Address or venue"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <Input
                  id="latitude"
                  type="number"
                  step="0.000001"
                  placeholder="Latitude (optional)"
                  value={String(formData.latitude || '')}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                />
                <Input
                  id="longitude"
                  type="number"
                  step="0.000001"
                  placeholder="Longitude (optional)"
                  value={String(formData.longitude || '')}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the event and what volunteers will do..."
                className="h-24"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="capacity">Volunteer Capacity</Label>
                <div className="flex gap-2">
                  <Input
                    id="capacity"
                    type="number"
                    placeholder="e.g. 50"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  />
                  <Button variant="outline" size="icon" title="Get AI Suggestion">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="skills">Required Skills</Label>
                <Input
                  id="skills"
                  placeholder="e.g. First Aid, Cooking"
                  value={formData.skills}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saveEventMutation.isLoading}>
              {saveEventMutation.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingEvent ? 'Update Event' : 'Create Event'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
