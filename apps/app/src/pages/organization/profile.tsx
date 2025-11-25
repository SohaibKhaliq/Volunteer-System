import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from '@/components/atoms/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  MapPin, 
  Upload, 
  Plus, 
  MoreHorizontal,
  Trash2,
  Loader2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function OrganizationProfile() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);

  // Fetch Profile
  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['organizationProfile'],
    queryFn: api.getOrganizationProfile,
    // On success, initialize local state for editing
    onSuccess: (data) => setProfileData(data)
  });

  // Fetch Team
  const { data: team, isLoading: isTeamLoading } = useQuery({
    queryKey: ['organizationTeam'],
    queryFn: api.listOrganizationTeam
  });

  // Update Profile Mutation
  const updateProfileMutation = useMutation({
    mutationFn: api.updateOrganizationProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationProfile'] });
      setIsEditing(false);
      toast.success('Profile updated successfully');
    },
    onError: () => {
      toast.error('Failed to update profile');
    }
  });

  // Invite/Update Team Member Mutation
  const saveTeamMemberMutation = useMutation({
    mutationFn: (data: any) => {
      if (editingMember) {
        return api.updateTeamMember(editingMember.id, data);
      }
      return api.inviteTeamMember(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationTeam'] });
      setIsTeamModalOpen(false);
      toast.success(editingMember ? 'Team member updated' : 'Invitation sent');
    },
    onError: () => {
      toast.error('Failed to save team member');
    }
  });

  // Delete Team Member Mutation
  const deleteTeamMemberMutation = useMutation({
    mutationFn: api.deleteTeamMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationTeam'] });
      toast.success('Team member removed');
    },
    onError: () => {
      toast.error('Failed to remove team member');
    }
  });

  const [teamFormData, setTeamFormData] = useState({
    name: '',
    email: '',
    role: 'Coordinator'
  });

  // Initialize profile data for editing if not already set
  if (profile && !profileData) {
    setProfileData(profile);
  }

  const handleSave = () => {
    updateProfileMutation.mutate(profileData);
  };

  const handleOpenAddMember = () => {
    setEditingMember(null);
    setTeamFormData({ name: '', email: '', role: 'Coordinator' });
    setIsTeamModalOpen(true);
  };

  const handleOpenEditMember = (member: any) => {
    setEditingMember(member);
    setTeamFormData({
      name: member.name,
      email: member.email,
      role: member.role
    });
    setIsTeamModalOpen(true);
  };

  const handleTeamSubmit = () => {
    saveTeamMemberMutation.mutate(teamFormData);
  };

  if (isProfileLoading || isTeamLoading) {
    return <div className="flex justify-center items-center h-96"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  // Fallback if data is missing (e.g. API error or empty)
  const displayProfile = profileData || profile || {};
  const displayTeam = Array.isArray(team) ? team : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Organization Profile</h2>
          <p className="text-muted-foreground">Manage your organization's details and team members.</p>
        </div>
        <div className="flex gap-2">
           {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={updateProfileMutation.isLoading}>
                {updateProfileMutation.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="team">Team Members</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Organization Information</CardTitle>
              <CardDescription>Public information about your organization.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start gap-6">
                <div className="flex flex-col items-center gap-3">
                  <Avatar className="h-32 w-32">
                    <AvatarImage src={displayProfile.logo} />
                    <AvatarFallback>EF</AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <Button variant="outline" size="sm" className="w-full">
                      <Upload className="h-3 w-3 mr-2" />
                      Change Logo
                    </Button>
                  )}
                </div>

                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Organization Name</Label>
                      <Input 
                        id="name" 
                        value={displayProfile.name || ''} 
                        disabled={!isEditing}
                        onChange={(e) => setProfileData({...displayProfile, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type">Type</Label>
                      <Input 
                        id="type" 
                        value={displayProfile.type || ''} 
                        disabled={!isEditing}
                        onChange={(e) => setProfileData({...displayProfile, type: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea 
                      id="description" 
                      value={displayProfile.description || ''} 
                      disabled={!isEditing}
                      className="h-24"
                      onChange={(e) => setProfileData({...displayProfile, description: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                <div className="space-y-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4" /> Contact Information
                  </h3>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        value={displayProfile.email || ''} 
                        disabled={!isEditing}
                        onChange={(e) => setProfileData({...displayProfile, email: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="phone">Phone</Label>
                      <Input 
                        id="phone" 
                        value={displayProfile.phone || ''} 
                        disabled={!isEditing}
                        onChange={(e) => setProfileData({...displayProfile, phone: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="website">Website</Label>
                      <Input 
                        id="website" 
                        value={displayProfile.website || ''} 
                        disabled={!isEditing}
                        onChange={(e) => setProfileData({...displayProfile, website: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Location
                  </h3>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="address">Address</Label>
                      <Textarea 
                        id="address" 
                        value={displayProfile.address || ''} 
                        disabled={!isEditing}
                        className="h-24"
                        onChange={(e) => setProfileData({...displayProfile, address: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>Manage access to your organization's dashboard.</CardDescription>
              </div>
              <Button size="sm" onClick={handleOpenAddMember}>
                <Plus className="h-4 w-4 mr-2" />
                Invite Member
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {displayTeam.map((member: any) => (
                  <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg bg-white">
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarFallback>{member.name?.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={member.role === 'Admin' ? 'default' : 'secondary'}>
                        {member.role}
                      </Badge>
                      <Badge variant={member.status === 'Active' ? 'outline' : 'secondary'} className={member.status === 'Active' ? 'text-green-600 border-green-200 bg-green-50' : ''}>
                        {member.status}
                      </Badge>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEditMember(member)}>
                          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-600" onClick={() => deleteTeamMemberMutation.mutate(member.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Organization Settings</CardTitle>
              <CardDescription>Configure preferences and visibility.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <h4 className="font-medium text-sm">Public Profile Visibility</h4>
                    <p className="text-xs text-muted-foreground">Allow volunteers to find your organization.</p>
                  </div>
                  <div className="flex items-center h-6">
                    {/* Toggle switch placeholder */}
                    <div className="w-10 h-6 bg-green-500 rounded-full relative cursor-pointer">
                      <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <h4 className="font-medium text-sm">Auto-approve Volunteers</h4>
                    <p className="text-xs text-muted-foreground">Automatically accept volunteer applications.</p>
                  </div>
                  <div className="flex items-center h-6">
                    {/* Toggle switch placeholder */}
                    <div className="w-10 h-6 bg-gray-200 rounded-full relative cursor-pointer">
                      <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <Button variant="destructive" className="w-full sm:w-auto">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Organization
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Team Member Dialog */}
      <Dialog open={isTeamModalOpen} onOpenChange={setIsTeamModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMember ? 'Edit Team Member' : 'Invite Team Member'}</DialogTitle>
            <DialogDescription>
              {editingMember ? 'Update member details.' : 'Send an invitation to a new team member.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="member-name">Name</Label>
              <Input 
                id="member-name" 
                value={teamFormData.name}
                onChange={(e) => setTeamFormData({...teamFormData, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-email">Email</Label>
              <Input 
                id="member-email" 
                value={teamFormData.email}
                onChange={(e) => setTeamFormData({...teamFormData, email: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-role">Role</Label>
              <Input 
                id="member-role" 
                value={teamFormData.role}
                onChange={(e) => setTeamFormData({...teamFormData, role: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTeamModalOpen(false)}>Cancel</Button>
            <Button onClick={handleTeamSubmit} disabled={saveTeamMemberMutation.isLoading}>
              {saveTeamMemberMutation.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingMember ? 'Update' : 'Invite'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
