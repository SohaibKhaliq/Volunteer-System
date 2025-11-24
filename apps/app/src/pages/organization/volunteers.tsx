import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  Search, 
  Filter, 
  MoreHorizontal, 
  MessageSquare, 
  Star, 
  UserCheck,
  AlertTriangle,
  Plus
} from 'lucide-react';

export default function OrganizationVolunteers() {
  const [selectedVolunteer, setSelectedVolunteer] = useState<any>(null);
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingVolunteer, setEditingVolunteer] = useState<any>(null);

  const [volunteers, setVolunteers] = useState([
    {
      id: 1,
      name: 'Sarah Ahmed',
      email: 'sarah.ahmed@example.com',
      phone: '+1 555-0101',
      role: 'Volunteer',
      status: 'Active',
      hours: 45,
      rating: 4.8,
      skills: ['First Aid', 'Teaching'],
      lastActive: '2 days ago',
      risk: 'Low'
    },
    {
      id: 2,
      name: 'Mohammed Ali',
      email: 'm.ali@example.com',
      phone: '+1 555-0102',
      role: 'Team Leader',
      status: 'Active',
      hours: 120,
      rating: 5.0,
      skills: ['Logistics', 'Leadership'],
      lastActive: '5 hours ago',
      risk: 'Low'
    },
    {
      id: 3,
      name: 'Layla Hassan',
      email: 'layla.h@example.com',
      phone: '+1 555-0103',
      role: 'Volunteer',
      status: 'Inactive',
      hours: 12,
      rating: 3.5,
      skills: ['Cooking'],
      lastActive: '3 weeks ago',
      risk: 'High'
    }
  ]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Volunteer',
    skills: ''
  });

  const handleOpenAdd = () => {
    setEditingVolunteer(null);
    setFormData({ name: '', email: '', phone: '', role: 'Volunteer', skills: '' });
    setIsEditOpen(true);
  };

  const handleOpenEdit = (volunteer: any) => {
    setEditingVolunteer(volunteer);
    setFormData({
      name: volunteer.name,
      email: volunteer.email,
      phone: volunteer.phone,
      role: volunteer.role,
      skills: volunteer.skills.join(', ')
    });
    setIsEditOpen(true);
  };

  const handleDeleteVolunteer = (id: number) => {
    setVolunteers(volunteers.filter(v => v.id !== id));
  };

  const handleSubmit = () => {
    if (editingVolunteer) {
      // Update
      setVolunteers(volunteers.map(v => v.id === editingVolunteer.id ? {
        ...v,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        skills: formData.skills.split(',').map(s => s.trim())
      } : v));
    } else {
      // Create
      const newVolunteer = {
        id: volunteers.length + 1,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        status: 'Active',
        hours: 0,
        rating: 0,
        skills: formData.skills.split(',').map(s => s.trim()),
        lastActive: 'Just now',
        risk: 'Low'
      };
      setVolunteers([newVolunteer, ...volunteers]);
    }
    setIsEditOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Volunteers</h2>
          <p className="text-muted-foreground">Manage and communicate with your volunteers.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <UserCheck className="h-4 w-4 mr-2" />
            Verify New
          </Button>
          <Button onClick={handleOpenAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add Volunteer
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search volunteers by name, email, or skills..."
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
                <TableHead>Volunteer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Risk Level</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {volunteers.map((volunteer) => (
                <TableRow key={volunteer.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{volunteer.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{volunteer.name}</div>
                        <div className="text-xs text-muted-foreground">{volunteer.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={volunteer.status === 'Active' ? 'default' : 'secondary'}
                      className={volunteer.status === 'Active' ? 'bg-green-500 hover:bg-green-600' : ''}
                    >
                      {volunteer.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{volunteer.hours} hrs</div>
                    <div className="text-xs text-muted-foreground">Last: {volunteer.lastActive}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span>{volunteer.rating}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {volunteer.risk === 'High' ? (
                      <div className="flex items-center gap-1 text-red-600 text-xs font-medium">
                        <AlertTriangle className="h-3 w-3" />
                        At Risk
                      </div>
                    ) : (
                      <span className="text-xs text-green-600">Stable</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => {
                        setSelectedVolunteer(volunteer);
                        setIsMessageOpen(true);
                      }}>
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(volunteer)}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-600" onClick={() => handleDeleteVolunteer(volunteer.id)}>
                        <AlertTriangle className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Message Dialog */}
      <Dialog open={isMessageOpen} onOpenChange={setIsMessageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Message {selectedVolunteer?.name}</DialogTitle>
            <DialogDescription>
              Send an email or in-app notification to this volunteer.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" placeholder="e.g. Upcoming Event Details" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" placeholder="Type your message here..." className="h-32" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMessageOpen(false)}>Cancel</Button>
            <Button onClick={() => setIsMessageOpen(false)}>Send Message</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingVolunteer ? 'Edit Volunteer' : 'Add Volunteer'}</DialogTitle>
            <DialogDescription>
              {editingVolunteer ? 'Update volunteer details.' : 'Add a new volunteer to your organization.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name</Label>
              <Input 
                id="name" 
                className="col-span-3" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">Email</Label>
              <Input 
                id="email" 
                className="col-span-3" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">Phone</Label>
              <Input 
                id="phone" 
                className="col-span-3" 
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">Role</Label>
              <Input 
                id="role" 
                className="col-span-3" 
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="skills" className="text-right">Skills</Label>
              <Input 
                id="skills" 
                className="col-span-3" 
                placeholder="Comma separated"
                value={formData.skills}
                onChange={(e) => setFormData({...formData, skills: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>{editingVolunteer ? 'Update' : 'Add'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
