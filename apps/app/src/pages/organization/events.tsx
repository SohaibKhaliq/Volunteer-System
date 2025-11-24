import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
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
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, MapPin, Plus, Search, Filter, Clock, Sparkles } from 'lucide-react';

export default function OrganizationEvents() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const queryClient = useQueryClient();
  const { data: eventsRaw = [], isLoading } = useQuery(['events'], () => api.listEvents());
  const [search, setSearch] = useState('');

  const createMutation = useMutation((payload: any) => api.createEvent(payload), {
    onSuccess: () => queryClient.invalidateQueries(['events'])
  });

  const updateMutation = useMutation(
    (payload: { id: number; data: any }) => api.updateEvent(payload.id, payload.data),
    {
      onSuccess: () => queryClient.invalidateQueries(['events'])
    }
  );

  const deleteMutation = useMutation((id: number) => api.deleteEvent(id), {
    onSuccess: () => queryClient.invalidateQueries(['events'])
  });

  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    description: '',
    capacity: '',
    skills: ''
  });

  const handleOpenCreate = () => {
    setEditingEvent(null);
    setFormData({ title: '', date: '', time: '', location: '', description: '', capacity: '', skills: '' });
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (event: any) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      date: (event.start_at ?? event.startAt ?? event.date ?? '').toString().slice(0, 10),
      time: (event.start_at ?? event.startAt ?? event.time ?? '').toString().slice(11, 16),
      location: event.location,
      description: event.description || '',
      capacity: String(event.capacity ?? event.required_volunteers ?? ''),
      skills: Array.isArray(event.skills) ? event.skills.join(', ') : event.skills || ''
    });
    setIsCreateOpen(true);
  };

  const handleDeleteEvent = (id: number) => {
    deleteMutation.mutate(id);
  };

  const handleSubmit = () => {
    const start_at = formData.date && formData.time ? `${formData.date}T${formData.time}` : formData.date || undefined;
    const payload: any = {
      title: formData.title,
      description: formData.description,
      location: formData.location,
      capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
      start_at
    };

    if (editingEvent) {
      updateMutation.mutate({ id: editingEvent.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }

    setIsCreateOpen(false);
    setEditingEvent(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Events & Tasks</h2>
          <p className="text-muted-foreground">Manage your organization's events and volunteer tasks.</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{editingEvent ? 'Edit Event' : 'Create New Event'}</DialogTitle>
              <DialogDescription>
                {editingEvent
                  ? 'Update the details of the event.'
                  : 'Fill in the details for the new volunteer opportunity.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Title
                </Label>
                <Input
                  id="title"
                  className="col-span-3"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">
                  Date
                </Label>
                <Input
                  id="date"
                  type="date"
                  className="col-span-3"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="time" className="text-right">
                  Time
                </Label>
                <Input
                  id="time"
                  type="time"
                  className="col-span-3"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="location" className="text-right">
                  Location
                </Label>
                <Input
                  id="location"
                  className="col-span-3"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="capacity" className="text-right">
                  Capacity
                </Label>
                <Input
                  id="capacity"
                  type="number"
                  className="col-span-3"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="skills" className="text-right">
                  Skills (comma sep)
                </Label>
                <Input
                  id="skills"
                  className="col-span-3"
                  placeholder="e.g. Driving, First Aid"
                  value={formData.skills}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="description"
                  className="col-span-3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              {/* AI Suggestion Placeholder */}
              <div className="col-span-4 bg-purple-50 border border-purple-100 rounded-lg p-3 flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-purple-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-purple-900">AI Suggestion</h4>
                  <p className="text-xs text-purple-700">
                    Based on the description, we recommend setting the capacity to 15 and adding "Teamwork" as a skill.
                  </p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleSubmit}>
                {editingEvent ? 'Update Event' : 'Create Event'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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
                <TableHead>Volunteers</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(isLoading ? [] : eventsRaw || [])
                .filter((event: any) => {
                  if (!search) return true;
                  const q = search.toLowerCase();
                  return (
                    String(event.title || '')
                      .toLowerCase()
                      .includes(q) ||
                    String(event.location || '')
                      .toLowerCase()
                      .includes(q) ||
                    (Array.isArray(event.skills) && event.skills.join(',').toLowerCase().includes(q))
                  );
                })
                .map((event: any) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">
                      <div>{event.title}</div>
                      <div className="flex gap-1 mt-1">
                        {(Array.isArray(event.skills) ? event.skills : []).map((skill: string, i: number) => (
                          <Badge key={String(skill) + i} variant="secondary" className="text-[10px] px-1 py-0 h-5">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="mr-2 h-4 w-4" />
                        {(() => {
                          const start = event.start_at ?? event.startAt ?? event.date ?? null;
                          if (!start) return '-';
                          try {
                            const d = new Date(start);
                            return d.toLocaleDateString();
                          } catch (e) {
                            return String(start).slice(0, 10);
                          }
                        })()}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground mt-1">
                        <Clock className="mr-2 h-4 w-4" />
                        {(() => {
                          const start = event.start_at ?? event.startAt ?? event.time ?? null;
                          if (!start) return '-';
                          try {
                            const d = new Date(start);
                            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                          } catch (e) {
                            return String(start).slice(11, 16) || String(start);
                          }
                        })()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="mr-2 h-4 w-4" />
                        {event.location}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="bg-gray-200 rounded-full h-2.5 w-24">
                          {(() => {
                            const registered = event.volunteers?.registered ?? event.assigned_volunteers ?? 0;
                            const required =
                              event.volunteers?.required ?? event.required_volunteers ?? event.capacity ?? 0;
                            const pct = required ? Math.min(100, Math.round((registered / required) * 100)) : 0;
                            return <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${pct}%` }} />;
                          })()}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {event.volunteers?.registered ?? event.assigned_volunteers ?? 0}/
                          {event.volunteers?.required ?? event.required_volunteers ?? event.capacity ?? '-'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          event.status === 'Active' ? 'default' : event.status === 'Completed' ? 'secondary' : 'outline'
                        }
                        className={event.status === 'Active' ? 'bg-green-500 hover:bg-green-600' : ''}
                      >
                        {event.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(event)}>
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600"
                          onClick={() => handleDeleteEvent(event.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
