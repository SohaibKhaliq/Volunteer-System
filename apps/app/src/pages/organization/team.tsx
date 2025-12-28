import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import organizationApi from '@/lib/api/organizationApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, UserPlus, Mail, Trash2, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/providers/app-provider';

/**
 * Organization Team Management Page
 * Invite members, assign roles (admin/manager/viewer)
 */
export default function OrganizationTeam() {
  const { user } = useApp();
  const membership = Array.isArray(user?.teamMemberships) ? user.teamMemberships[0] : undefined;
  const organizationId =
    membership?.organizationId || membership?.organization_id || membership?.organization?.id || user?.organizationId;
  const actorRole = (membership?.role || '').toLowerCase();
  const canManage = ['admin', 'coordinator'].includes(actorRole) || user?.isAdmin;

  const queryClient = useQueryClient();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  const {
    data: team,
    isLoading,
    error
  } = useQuery({
    queryKey: ['organization', 'team'],
    queryFn: () => organizationApi.listTeam(organizationId),
    enabled: !!organizationId,
    retry: false
  });

  const inviteMutation = useMutation({
    mutationFn: (data: any) => organizationApi.inviteTeamMember(data, organizationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization', 'team'] });
      toast.success('Invitation sent!', {
        description: 'Team member will receive an email invitation.'
      });
      setInviteDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error('Failed to send invitation', {
        description: error.message || 'Please try again.'
      });
    }
  });

  const updateMemberMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => organizationApi.updateTeamMember(id, data, organizationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization', 'team'] });
      toast.success('Team member updated');
    },
    onError: (error: any) => {
      toast.error('Failed to update member', {
        description: error.message
      });
    }
  });

  const removeMemberMutation = useMutation({
    mutationFn: (id: number) => organizationApi.deleteTeamMember(id, organizationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization', 'team'] });
      toast.success('Team member removed');
    },
    onError: (error: any) => {
      toast.error('Failed to remove member', {
        description: error.message
      });
    }
  });

  const handleInvite = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      email: formData.get('email'),
      role: formData.get('role'),
      name: formData.get('name')
    };
    inviteMutation.mutate(data);
  };

  const handleUpdateRole = (memberId: number, role: string) => {
    updateMemberMutation.mutate({ id: memberId, data: { role } });
  };

  const handleRemove = (memberId: number, memberName: string) => {
    if (confirm(`Remove ${memberName} from the team?`)) {
      removeMemberMutation.mutate(memberId);
    }
  };

  const teamList = Array.isArray(team) ? team : (team as any)?.data || (team as any)?.members || [];

  const getRoleBadge = (role: string) => {
    const roleMap: Record<string, { label: string; variant: any }> = {
      admin: { label: 'Admin', variant: 'destructive' },
      coordinator: { label: 'Coordinator', variant: 'default' },
      member: { label: 'Member', variant: 'secondary' }
    };
    const config = roleMap[role?.toLowerCase()] || { label: role, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (!organizationId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Users className="h-12 w-12 mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Join an organization to manage its team.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Users className="h-12 w-12 mx-auto text-destructive" />
          <p className="text-muted-foreground">{(error as any)?.message || 'Unable to load team.'}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Users className="h-12 w-12 mx-auto text-primary animate-pulse" />
          <p className="text-muted-foreground">Loading team...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Team Management
          </h1>
          <p className="text-muted-foreground">Manage your organization&apos;s team members and their roles</p>
        </div>

        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={!canManage}>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>Send an invitation to join your organization team</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" placeholder="John Doe" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="john@example.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select name="role" defaultValue="member" required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="coordinator">Coordinator</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Admin: Full access • Coordinator: Can manage volunteers & events • Member: Read-only
                </p>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setInviteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={inviteMutation.isPending || !canManage}>
                  {inviteMutation.isPending ? 'Sending...' : 'Send Invitation'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Team Members List */}
      <div className="grid gap-4">
        {teamList.map((member: any) => (
          <Card key={member.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{member.name || member.user?.name || 'Team Member'}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      {member.email || member.user?.email}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">{getRoleBadge(member.role)}</div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {member.joinedAt && `Joined ${new Date(member.joinedAt).toLocaleDateString()}`}
                  {member.status && (
                    <Badge variant="outline" className="ml-2">
                      {member.status}
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Select
                    value={member.role}
                    onValueChange={(value) => handleUpdateRole(member.id, value)}
                    disabled={!canManage}
                  >
                    <SelectTrigger className="w-40">
                      <Shield className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="coordinator">Coordinator</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleRemove(member.id, member.name || 'this member')}
                    disabled={removeMemberMutation.isPending || !canManage}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty state */}
      {teamList.length === 0 && (
        <Card className="p-12">
          <div className="text-center space-y-4">
            <Users className="h-16 w-16 mx-auto text-gray-300" />
            <div>
              <h3 className="text-lg font-semibold">No team members yet</h3>
              <p className="text-muted-foreground">Invite your first team member to get started</p>
            </div>
            <Button onClick={() => setInviteDialogOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
