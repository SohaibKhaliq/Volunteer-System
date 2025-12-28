import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from '@/components/atoms/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Loader2, Pencil, Trash2, Users } from 'lucide-react';

interface TeamMember {
  id: number;
  userId: number;
  role: string;
  user?: {
    id: number;
    firstName?: string;
    lastName?: string;
    email: string;
  };
}

interface Team {
  id: number;
  name: string;
  description?: string;
  leadUserId?: number;
  lead?: {
    id: number;
    firstName?: string;
    lastName?: string;
    email: string;
  };
  createdAt: string;
}

export default function OrganizationTeams() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    lead_user_id: ''
  });

  // Fetch Teams
  const { data: teams, isLoading } = useQuery({
    queryKey: ['organizationTeams'],
    queryFn: () => api.listOrganizationTeams()
  });

  // Fetch Organization Team Members for lead selection
  const { data: teamMembers } = useQuery({
    queryKey: ['organizationTeam'],
    queryFn: () => api.listOrganizationTeam()
  });

  // Create/Update Team Mutation
  const saveTeamMutation = useMutation({
    mutationFn: (data: any) => {
      if (editingTeam) {
        return api.updateOrganizationTeam(editingTeam.id, data);
      }
      return api.createOrganizationTeam(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationTeams'] });
      setIsDialogOpen(false);
      setEditingTeam(null);
      toast.success(editingTeam ? 'Team updated successfully' : 'Team created successfully');
    },
    onError: () => {
      toast.error('Failed to save team');
    }
  });

  // Delete Team Mutation
  const deleteTeamMutation = useMutation({
    mutationFn: api.deleteOrganizationTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationTeams'] });
      toast.success('Team deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete team');
    }
  });

  const handleOpenCreate = () => {
    setEditingTeam(null);
    setFormData({
      name: '',
      description: '',
      lead_user_id: ''
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (team: Team) => {
    setEditingTeam(team);
    setFormData({
      name: team.name,
      description: team.description || '',
      lead_user_id: team.leadUserId?.toString() || ''
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    const payload: any = {
      name: formData.name,
      description: formData.description || undefined
    };
    if (formData.lead_user_id) {
      payload.lead_user_id = parseInt(formData.lead_user_id);
    }
    saveTeamMutation.mutate(payload);
  };

  const handleDelete = (teamId: number) => {
    if (window.confirm('Are you sure you want to delete this team?')) {
      deleteTeamMutation.mutate(teamId as any);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const teamsList = Array.isArray(teams) ? teams : (teams as any)?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Teams / Departments</h2>
          <p className="text-muted-foreground">Organize your volunteers into teams for better management.</p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Team
        </Button>
      </div>

      {teamsList.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Teams Yet</h3>
            <p className="text-muted-foreground mb-4">Create your first team to organize volunteers.</p>
            <Button onClick={handleOpenCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create Team
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Teams</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Team Lead</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamsList.map((team: Team) => (
                  <TableRow key={team.id}>
                    <TableCell className="font-medium">{team.name}</TableCell>
                    <TableCell className="max-w-xs truncate">{team.description || '-'}</TableCell>
                    <TableCell>
                      {team.lead ? (
                        <div>
                          <div className="font-medium">
                            {team.lead.firstName || team.lead.lastName
                              ? `${team.lead.firstName || ''} ${team.lead.lastName || ''}`.trim()
                              : team.lead.email}
                          </div>
                          {team.lead.firstName && (
                            <div className="text-xs text-muted-foreground">{team.lead.email}</div>
                          )}
                        </div>
                      ) : (
                        <Badge variant="outline">No Lead</Badge>
                      )}
                    </TableCell>
                    <TableCell>{new Date(team.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(team)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600"
                          onClick={() => handleDelete(team.id)}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTeam ? 'Edit Team' : 'Create Team'}</DialogTitle>
            <DialogDescription>
              {editingTeam ? 'Update the team details below.' : 'Create a new team to organize your volunteers.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name *
              </Label>
              <Input
                id="name"
                className="col-span-3"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Event Coordination"
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
                placeholder="What does this team do?"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="lead_user_id" className="text-right">
                Team Lead
              </Label>
              <Select
                value={formData.lead_user_id}
                onValueChange={(value) => setFormData({ ...formData, lead_user_id: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a team lead (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No lead assigned</SelectItem>
                  {(Array.isArray(teamMembers) ? teamMembers : [])
                    .filter((member: TeamMember) => member.userId !== undefined && member.userId !== null)
                    .map((member: TeamMember) => (
                      <SelectItem key={member.userId} value={member.userId.toString()}>
                        {member.user?.firstName || member.user?.lastName
                          ? `${member.user.firstName || ''} ${member.user.lastName || ''}`.trim()
                          : member.user?.email || `User #${member.userId}`}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.name || saveTeamMutation.isPending}>
              {saveTeamMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingTeam ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
