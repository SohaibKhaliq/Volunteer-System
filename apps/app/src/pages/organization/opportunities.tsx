import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from '@/components/atoms/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  Loader2,
  Pencil,
  Trash2,
  Calendar,
  Users,
  Eye,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface Opportunity {
  id: number;
  title: string;
  slug?: string;
  description?: string;
  location?: string;
  capacity: number;
  type: string;
  startAt: string;
  endAt?: string;
  status: string;
  visibility: string;
  applicationCount?: number;
  team?: {
    id: number;
    name: string;
  };
  creator?: {
    id: number;
    firstName?: string;
    lastName?: string;
    email: string;
  };
  createdAt: string;
}

export default function OrganizationOpportunities() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    capacity: '',
    type: 'event',
    start_at: '',
    end_at: '',
    visibility: 'public',
    status: 'draft'
  });

  // Fetch Opportunities
  const { data: opportunities, isLoading } = useQuery({
    queryKey: ['organizationOpportunities', filterStatus],
    queryFn: () => api.listOrganizationOpportunities({ status: filterStatus || undefined })
  });

  // Fetch Teams for dropdown
  const { data: teams } = useQuery({
    queryKey: ['organizationTeams'],
    queryFn: () => api.listOrganizationTeams()
  });

  // Create/Update Opportunity Mutation
  const saveOpportunityMutation = useMutation({
    mutationFn: (data: any) => {
      if (editingOpportunity) {
        return api.updateOrganizationOpportunity(editingOpportunity.id, data);
      }
      return api.createOrganizationOpportunity(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationOpportunities'] });
      setIsDialogOpen(false);
      setEditingOpportunity(null);
      toast.success(
        editingOpportunity ? 'Opportunity updated successfully' : 'Opportunity created successfully'
      );
    },
    onError: () => {
      toast.error('Failed to save opportunity');
    }
  });

  // Delete Opportunity Mutation
  const deleteOpportunityMutation = useMutation({
    mutationFn: api.deleteOrganizationOpportunity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationOpportunities'] });
      toast.success('Opportunity deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete opportunity');
    }
  });

  // Publish/Unpublish Mutation
  const publishMutation = useMutation({
    mutationFn: ({ id, publish }: { id: number; publish: boolean }) =>
      api.publishOpportunity(id, publish),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationOpportunities'] });
      toast.success('Status updated successfully');
    },
    onError: () => {
      toast.error('Failed to update status');
    }
  });

  const handleOpenCreate = () => {
    setEditingOpportunity(null);
    setFormData({
      title: '',
      description: '',
      location: '',
      capacity: '',
      type: 'event',
      start_at: '',
      end_at: '',
      visibility: 'public',
      status: 'draft'
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (opportunity: Opportunity) => {
    setEditingOpportunity(opportunity);
    setFormData({
      title: opportunity.title,
      description: opportunity.description || '',
      location: opportunity.location || '',
      capacity: opportunity.capacity?.toString() || '',
      type: opportunity.type,
      start_at: opportunity.startAt ? new Date(opportunity.startAt).toISOString().slice(0, 16) : '',
      end_at: opportunity.endAt ? new Date(opportunity.endAt).toISOString().slice(0, 16) : '',
      visibility: opportunity.visibility,
      status: opportunity.status
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    const payload: any = {
      title: formData.title,
      description: formData.description || undefined,
      location: formData.location || undefined,
      capacity: formData.capacity ? parseInt(formData.capacity) : 0,
      type: formData.type,
      start_at: formData.start_at,
      end_at: formData.end_at || undefined,
      visibility: formData.visibility,
      status: formData.status
    };
    saveOpportunityMutation.mutate(payload);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this opportunity?')) {
      deleteOpportunityMutation.mutate(id);
    }
  };

  const handlePublish = (id: number, currentStatus: string) => {
    publishMutation.mutate({ id, publish: currentStatus !== 'published' });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-500">Published</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getVisibilityBadge = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return <Badge variant="outline">Public</Badge>;
      case 'org-only':
        return <Badge variant="outline">Org Only</Badge>;
      case 'invite-only':
        return <Badge variant="outline">Invite Only</Badge>;
      default:
        return <Badge variant="outline">{visibility}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const opportunitiesList = Array.isArray(opportunities)
    ? opportunities
    : (opportunities as any)?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Opportunities</h2>
          <p className="text-muted-foreground">
            Create and manage volunteer opportunities, events, and shifts.
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Opportunity
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {opportunitiesList.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Opportunities Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first opportunity for volunteers.
            </p>
            <Button onClick={handleOpenCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create Opportunity
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Opportunities ({opportunitiesList.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Visibility</TableHead>
                  <TableHead>Applications</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {opportunitiesList.map((opportunity: Opportunity) => (
                  <TableRow key={opportunity.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{opportunity.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {opportunity.type}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(opportunity.startAt).toLocaleDateString()}{' '}
                        {new Date(opportunity.startAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      {opportunity.endAt && (
                        <div className="text-xs text-muted-foreground">
                          to{' '}
                          {new Date(opportunity.endAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{opportunity.location || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {opportunity.capacity || '∞'}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(opportunity.status)}</TableCell>
                    <TableCell>{getVisibilityBadge(opportunity.visibility)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{opportunity.applicationCount || 0}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            handlePublish(opportunity.id, opportunity.status)
                          }
                          title={
                            opportunity.status === 'published' ? 'Unpublish' : 'Publish'
                          }
                        >
                          {opportunity.status === 'published' ? (
                            <XCircle className="h-4 w-4 text-orange-500" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(opportunity)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600"
                          onClick={() => handleDelete(opportunity.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingOpportunity ? 'Edit Opportunity' : 'Create Opportunity'}
            </DialogTitle>
            <DialogDescription>
              {editingOpportunity
                ? 'Update the opportunity details below.'
                : 'Create a new volunteer opportunity.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title *
              </Label>
              <Input
                id="title"
                className="col-span-3"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Beach Cleanup Day"
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
                placeholder="What will volunteers be doing?"
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
                placeholder="e.g., Main Street Beach"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="start_at" className="text-right">
                Start Date/Time *
              </Label>
              <Input
                id="start_at"
                type="datetime-local"
                className="col-span-3"
                value={formData.start_at}
                onChange={(e) => setFormData({ ...formData, start_at: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="end_at" className="text-right">
                End Date/Time
              </Label>
              <Input
                id="end_at"
                type="datetime-local"
                className="col-span-3"
                value={formData.end_at}
                onChange={(e) => setFormData({ ...formData, end_at: e.target.value })}
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
                placeholder="0 for unlimited"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Type
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="event">Event</SelectItem>
                  <SelectItem value="shift">Shift</SelectItem>
                  <SelectItem value="recurring">Recurring</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="visibility" className="text-right">
                Visibility
              </Label>
              <Select
                value={formData.visibility}
                onValueChange={(value) => setFormData({ ...formData, visibility: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="org-only">Organization Only</SelectItem>
                  <SelectItem value="invite-only">Invite Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                !formData.title || !formData.start_at || saveOpportunityMutation.isPending
              }
            >
              {saveOpportunityMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {editingOpportunity ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
