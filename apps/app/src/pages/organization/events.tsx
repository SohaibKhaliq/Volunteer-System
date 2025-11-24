import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Calendar, 
  MapPin, 
  Plus, 
  Search, 
  Filter, 
  Clock,
  Sparkles,
  Loader2,
  MoreHorizontal,
  Trash2
} from 'lucide-react';

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
    skills: ''
  });

  const handleOpenCreate = () => {
    setEditingEvent(null);
    setFormData({
      title: '',
      date: '',
      time: '',
      location: '',
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
      skills: event.skills ? event.skills.join(', ') : ''
    });
    setIsCreateOpen(true);
  };

  const handleSubmit = () => {
    const payload = {
      ...formData,
      capacity: parseInt(formData.capacity) || 0,
      skills: formData.skills.split(',').map(s => s.trim()).filter(s => s)
    };
    saveEventMutation.mutate(payload);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-96"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
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
          <Input
            placeholder="Search events..."
            className="pl-8"
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
