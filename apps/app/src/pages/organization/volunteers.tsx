import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from '@/components/atoms/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { Search, Filter, MoreHorizontal, Mail, Star, Loader2, Plus, Trash2 } from 'lucide-react';

export default function OrganizationVolunteers() {
  const queryClient = useQueryClient();
  const [selectedVolunteer, setSelectedVolunteer] = useState<any>(null);
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false); // Renamed from isEditOpen
  const [editingVolunteer, setEditingVolunteer] = useState<any>(null);

  // Fetch Volunteers
  const { data: volunteers, isLoading } = useQuery({
    queryKey: ['organizationVolunteers'],
    queryFn: () => api.listOrganizationVolunteers()
  });

  // Add/Update Volunteer Mutation
  const saveVolunteerMutation = useMutation({
    mutationFn: (data: any) => {
      if (editingVolunteer) {
        return api.updateOrganizationVolunteer(editingVolunteer.id, data);
      }
      return api.addOrganizationVolunteer(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationVolunteers'] });
      setIsAddOpen(false);
      toast.success(editingVolunteer ? 'Volunteer updated successfully' : 'Volunteer added successfully');
    },
    onError: () => {
      toast.error('Failed to save volunteer');
    }
  });

  // Delete Volunteer Mutation
  const deleteVolunteerMutation = useMutation({
    mutationFn: api.deleteOrganizationVolunteer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationVolunteers'] });
      toast.success('Volunteer removed successfully');
    },
    onError: () => {
      toast.error('Failed to remove volunteer');
    }
  });

  // per-item loading map for approve/reject actions
  const [loadingById, setLoadingById] = useState<Record<string | number, boolean>>({});

  // Approve Volunteer Mutation
  const approveVolunteerMutation = useMutation({
    mutationFn: (id: number | string) => api.updateOrganizationVolunteer(id, { status: 'Active' }),
    onMutate: (id: number | string) => {
      setLoadingById((s) => ({ ...s, [id]: true }));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationVolunteers'] });
      queryClient.invalidateQueries({ queryKey: ['myOrganizations'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      toast.success('Volunteer approved');
    },
    onError: () => {
      toast.error('Failed to approve volunteer');
    },
    onSettled: (data, err, id: any) => {
      setLoadingById((s) => {
        const ns = { ...s };
        delete ns[id];
        return ns;
      });
    }
  });

  // Reject Volunteer Mutation
  const rejectVolunteerMutation = useMutation({
    mutationFn: (id: number | string) => api.updateOrganizationVolunteer(id, { status: 'Rejected' }),
    onMutate: (id: number | string) => {
      setLoadingById((s) => ({ ...s, [id]: true }));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationVolunteers'] });
      queryClient.invalidateQueries({ queryKey: ['myOrganizations'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      toast.success('Volunteer rejected');
    },
    onError: () => {
      toast.error('Failed to reject volunteer');
    },
    onSettled: (data, err, id: any) => {
      setLoadingById((s) => {
        const ns = { ...s };
        delete ns[id];
        return ns;
      });
    }
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Volunteer',
    status: 'Active',
    skills: ''
  });

  const handleOpenAdd = () => {
    setEditingVolunteer(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'Volunteer',
      status: 'Active',
      skills: ''
    });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (volunteer: any) => {
    setEditingVolunteer(volunteer);
    setFormData({
      name: volunteer.name,
      email: volunteer.email,
      phone: volunteer.phone ?? '',
      role: volunteer.role,
      status: volunteer.status,
      skills: volunteer.skills ? volunteer.skills.join(', ') : ''
    });
    setIsAddOpen(true);
  };

  const handleSubmit = () => {
    const payload = {
      ...formData,
      skills: formData.skills
        .split(',')
        .map((s: string) => s.trim())
        .filter((s: string) => s)
    };
    saveVolunteerMutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const displayVolunteers = Array.isArray(volunteers) ? volunteers : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Volunteers</h2>
          <p className="text-muted-foreground">Manage your volunteer database and track engagement.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Export List</Button>
          <Button onClick={handleOpenAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add Volunteer
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search volunteers..." className="pl-8" />
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
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayVolunteers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No volunteers found. Add one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                displayVolunteers.map((volunteer: any) => (
                  <TableRow key={volunteer.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={volunteer.avatar} />
                          <AvatarFallback>
                            {volunteer.name
                              ?.split(' ')
                              .map((n: string) => n[0])
                              .join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{volunteer.name}</div>
                          <div className="text-xs text-muted-foreground">{volunteer.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{volunteer.role}</TableCell>
                    <TableCell>
                      <Badge variant={volunteer.status === 'Active' ? 'default' : 'secondary'}>
                        {volunteer.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{volunteer.hours || 0} hrs</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span>{volunteer.rating || 'N/A'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedVolunteer(volunteer);
                            setIsMessageOpen(true);
                          }}
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(volunteer)}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>

                        {volunteer.status && volunteer.status.toLowerCase() === 'pending' && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={!!loadingById[volunteer.id]}
                              onClick={() => approveVolunteerMutation.mutate(volunteer.id)}
                              title="Approve"
                            >
                              {loadingById[volunteer.id] ? (
                                <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                              ) : (
                                <Plus className="h-4 w-4 text-green-600" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={!!loadingById[volunteer.id]}
                              onClick={() => rejectVolunteerMutation.mutate(volunteer.id)}
                              title="Reject"
                            >
                              {loadingById[volunteer.id] ? (
                                <Loader2 className="h-4 w-4 animate-spin text-red-600" />
                              ) : (
                                <Trash2 className="h-4 w-4 text-red-600" />
                              )}
                            </Button>
                          </>
                        )}

                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600"
                          onClick={() => deleteVolunteerMutation.mutate(volunteer.id)}
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

      {/* Message Dialog */}
      <Dialog open={isMessageOpen} onOpenChange={setIsMessageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Message {selectedVolunteer?.name}</DialogTitle>
            <DialogDescription>Send an email or in-app notification to this volunteer.</DialogDescription>
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
            <Button variant="outline" onClick={() => setIsMessageOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsMessageOpen(false)}>Send Message</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingVolunteer ? 'Edit Volunteer' : 'Add Volunteer'}</DialogTitle>
            <DialogDescription>
              {editingVolunteer ? 'Update volunteer details.' : 'Add a new volunteer to your organization.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                className="col-span-3"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                className="col-span-3"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Phone
              </Label>
              <Input
                id="phone"
                className="col-span-3"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Role
              </Label>
              <Input
                id="role"
                className="col-span-3"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="skills" className="text-right">
                Skills
              </Label>
              <Input
                id="skills"
                className="col-span-3"
                placeholder="Comma separated"
                value={formData.skills}
                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>{editingVolunteer ? 'Update' : 'Add'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
