import { useState } from 'react';
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
  DialogTrigger,
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
  Sparkles
} from 'lucide-react';

export default function OrganizationEvents() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [events, setEvents] = useState([
    {
      id: 1,
      title: 'Beach Cleanup Drive',
      date: '2025-06-15',
      time: '09:00 AM',
      location: 'Sunset Beach, VC',
      status: 'Upcoming',
      volunteers: { registered: 45, required: 50 },
      skills: ['Physical Labor', 'Environmental Awareness'],
      description: 'Cleaning up the beach.',
      capacity: 50
    },
    {
      id: 2,
      title: 'Food Distribution Logistics',
      date: '2025-06-12',
      time: '08:00 AM',
      location: 'Community Center',
      status: 'Active',
      volunteers: { registered: 12, required: 15 },
      skills: ['Logistics', 'Driving'],
      description: 'Distributing food to the needy.',
      capacity: 15
    },
    {
      id: 3,
      title: 'Elderly Care Visit',
      date: '2025-06-10',
      time: '10:00 AM',
      location: 'Sunshine Home',
      status: 'Completed',
      volunteers: { registered: 8, required: 8 },
      skills: ['Empathy', 'Nursing'],
      description: 'Visiting the elderly.',
      capacity: 8
    }
  ]);

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
      date: event.date,
      time: event.time,
      location: event.location,
      description: event.description || '',
      capacity: event.capacity.toString(),
      skills: event.skills.join(', ')
    });
    setIsCreateOpen(true);
  };

  const handleDeleteEvent = (id: number) => {
    setEvents(events.filter(e => e.id !== id));
  };

  const handleSubmit = () => {
    if (editingEvent) {
      // Update existing event
      setEvents(events.map(e => e.id === editingEvent.id ? {
        ...e,
        title: formData.title,
        date: formData.date,
        time: formData.time,
        location: formData.location,
        description: formData.description,
        capacity: parseInt(formData.capacity) || 0,
        volunteers: { ...e.volunteers, required: parseInt(formData.capacity) || 0 },
        skills: formData.skills.split(',').map(s => s.trim())
      } : e));
    } else {
      // Create new event
      const event = {
        id: events.length + 1,
        title: formData.title,
        date: formData.date,
        time: formData.time,
        location: formData.location,
        status: 'Upcoming',
        volunteers: { registered: 0, required: parseInt(formData.capacity) || 10 },
        skills: formData.skills.split(',').map(s => s.trim()),
        description: formData.description,
        capacity: parseInt(formData.capacity) || 10
      };
      setEvents([event, ...events]);
    }
    setIsCreateOpen(false);
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
                {editingEvent ? 'Update the details of the event.' : 'Fill in the details for the new volunteer opportunity.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">Title</Label>
                <Input 
                  id="title" 
                  className="col-span-3" 
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">Date</Label>
                <Input 
                  id="date" 
                  type="date" 
                  className="col-span-3"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="time" className="text-right">Time</Label>
                <Input 
                  id="time" 
                  type="time" 
                  className="col-span-3"
                  value={formData.time}
                  onChange={(e) => setFormData({...formData, time: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="location" className="text-right">Location</Label>
                <Input 
                  id="location" 
                  className="col-span-3"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="capacity" className="text-right">Capacity</Label>
                <Input 
                  id="capacity" 
                  type="number" 
                  className="col-span-3"
                  value={formData.capacity}
                  onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="skills" className="text-right">Skills (comma sep)</Label>
                <Input 
                  id="skills" 
                  className="col-span-3"
                  placeholder="e.g. Driving, First Aid"
                  value={formData.skills}
                  onChange={(e) => setFormData({...formData, skills: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">Description</Label>
                <Textarea 
                  id="description" 
                  className="col-span-3"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
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
              <Button type="submit" onClick={handleSubmit}>{editingEvent ? 'Update Event' : 'Create Event'}</Button>
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
              {events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">
                    <div>{event.title}</div>
                    <div className="flex gap-1 mt-1">
                      {event.skills.map((skill, i) => (
                        <Badge key={i} variant="secondary" className="text-[10px] px-1 py-0 h-5">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="mr-2 h-4 w-4" />
                      {event.date}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                      <Clock className="mr-2 h-4 w-4" />
                      {event.time}
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
                      <div className="w-full bg-gray-200 rounded-full h-2.5 w-24">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full" 
                          style={{ width: `${(event.volunteers.registered / event.volunteers.required) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {event.volunteers.registered}/{event.volunteers.required}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        event.status === 'Active' ? 'default' : 
                        event.status === 'Completed' ? 'secondary' : 'outline'
                      }
                      className={
                        event.status === 'Active' ? 'bg-green-500 hover:bg-green-600' : ''
                      }
                    >
                      {event.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(event)}>Edit</Button>
                      <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDeleteEvent(event.id)}>Delete</Button>
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
