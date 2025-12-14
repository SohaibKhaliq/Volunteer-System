import { useState, useEffect, useRef } from 'react';
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
import { Mail, MapPin, Upload, Plus, MoreHorizontal, Trash2, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';

export default function OrganizationProfile() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);

  // Helper to normalize fields returned from API into canonical keys
  const normalizeProfile = (p: any) => {
    if (!p) return {};
    return {
      ...p,
      email: p.email ?? p.contactEmail ?? p.contact_email ?? '',
      phone: p.phone ?? p.contactPhone ?? p.contact_phone ?? '',
      // normalize logo values: if the server returned a stored path like `organizations/xxx.png`
      // ensure it becomes an absolute-ish URL that will be served by the API (Drive local serves under /uploads)
      logo: (() => {
        const raw = p.logo ?? null;
        if (!raw) return null;
        if (typeof raw !== 'string') return raw;
        if (raw.startsWith('http') || raw.startsWith('/')) return raw;
        // assume local drive stored path
        return `/uploads/${raw.replace(/^\//, '')}`;
      })(),
      publicProfile: p.publicProfile ?? p.public_profile ?? false,
      autoApproveVolunteers: p.autoApproveVolunteers ?? p.auto_approve_volunteers ?? false
    };
  };

  // Fetch Profile (unwrap axios response -> data)
  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['organizationProfile'],
    queryFn: async () => {
      const res = await api.getOrganizationProfile();
      // axios returns { data }, but if API returns directly, handle both.
      // Return an empty object as fallback so React Query's data is never undefined.
      return (res && (res.data !== undefined ? res.data : res)) ?? {};
    },
    // On success, initialize local state for editing (guard against undefined)
    onSuccess: (data) => {
      if (data !== undefined) setProfileData(normalizeProfile(data));
    }
  });

  // Fetch Team (unwrap axios response -> data)
  const { data: team, isLoading: isTeamLoading } = useQuery({
    queryKey: ['organizationTeam'],
    queryFn: async () => {
      const res = await api.listOrganizationTeam();
      // return empty array as fallback so UI doesn't break
      return (res && (res.data !== undefined ? res.data : res)) ?? [];
    }
  });

  // Update Profile Mutation (unwrap axios response and store returned payload)
  const updateProfileMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.updateOrganizationProfile(payload);
      return res && (res.data !== undefined ? res.data : res);
    },
    onSuccess: (data) => {
      if (!data) {
        // fallback: refetch profile and alert
        queryClient.invalidateQueries({ queryKey: ['organizationProfile'] });
        toast.success('Profile saved (server did not return payload)');
        setIsEditing(false);
        return;
      }
      // replace local state with normalized payload returned by server
      setProfileData(normalizeProfile(data));
      // keep preview in sync (server returns stored image path)
      if (data.logo && typeof data.logo === 'string') setLogoPreview(data.logo);
      // clear any selected file input
      if (fileInputRef.current) fileInputRef.current.value = '';
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
    mutationFn: async (data: any) => {
      if (editingMember) {
        // updates only accept role at the moment
        return api.updateTeamMember(editingMember.id, data);
      }

      // For invitations via org/team/invite, backend expects first_name/last_name
      const name = data.name?.trim() || '';
      const [first_name, ...rest] = name.split(' ');
      const last_name = rest.join(' ');
      const payload = {
        email: data.email,
        first_name: first_name || undefined,
        last_name: last_name || undefined,
        role: data.role
      };

      try {
        return await api.inviteTeamMember(payload);
      } catch (err: any) {
        // If user doesn't exist, backend returns 400 with message 'User not found'
        const status = err?.response?.status;
        const message = err?.response?.data?.message;
        if (status === 400 && message && message.toLowerCase().includes('user not found')) {
          // fallback: create an invitation via the org invites endpoint (email invite flow)
          const orgId = profile?.id ?? profile?.organizationId;
          if (!orgId) throw err;
          // payload for organization invites includes first_name/last_name + message optionally
          return api.sendOrganizationInvite(orgId, payload);
        }

        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationTeam'] });
      setIsTeamModalOpen(false);
      toast.success(editingMember ? 'Team member updated' : 'Invitation sent');
    },
    onError: (err: any) => {
      const message = err?.response?.data?.message || err?.message || 'Failed to save team member';
      toast.error(String(message));
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

  // Initialize profile data for editing when profile loads
  useEffect(() => {
    if (profile) {
      const normalized = normalizeProfile(profile);
      setProfileData(normalized);
      // set preview if logo exists
      if (normalized.logo && typeof normalized.logo === 'string') setLogoPreview(normalized.logo);
      // run validations for existing values
      setErrors({
        email: validateEmail(normalized.email),
        phone: validatePhone(normalized.phone)
      });
    }
  }, [profile]);

  // logo preview state + input ref
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // validation
  const [errors, setErrors] = useState<{ email?: string; phone?: string }>({});

  const validateEmail = (value?: string) => {
    if (!value) return '';
    const re = /^\S+@\S+\.\S+$/;
    return re.test(value) ? '' : 'Invalid email address';
  };

  const validatePhone = (value?: string) => {
    if (!value) return '';
    // simple phone validation: digits, spaces, +, -, parentheses
    const re = /^[0-9+()\-\s]{6,20}$/;
    return re.test(value) ? '' : 'Invalid phone number';
  };

  const handleSave = () => {
    // Build payload from the UI's current state (displayProfile) so we never lose fields
    const source = profileData || profile || {};
    const payload = {
      ...source,
      email: source?.email ?? source?.contactEmail ?? source?.contact_email,
      phone: source?.phone ?? source?.contactPhone ?? source?.contact_phone
    };

    // if logo is a File, send multipart/form-data
    const hasFile = payload.logo && (payload.logo as any) instanceof File;
    if (hasFile) {
      const form = new FormData();
      // append known fields
      for (const key of ['name', 'description', 'website', 'address', 'type', 'email', 'phone']) {
        const val = (payload as any)[key];
        if (val !== undefined && val !== null) form.append(key, String(val));
      }
      // append settings flags if present
      if (typeof payload.publicProfile === 'boolean') form.append('public_profile', String(payload.publicProfile));
      if (typeof payload.autoApproveVolunteers === 'boolean')
        form.append('auto_approve_volunteers', String(payload.autoApproveVolunteers));
      form.append('logo', payload.logo as File);
      updateProfileMutation.mutate(form);
    } else {
      updateProfileMutation.mutate(payload);
    }
  };

  const handleOpenAddMember = () => {
    setEditingMember(null);
    setTeamFormData({ name: '', email: '', role: 'Coordinator' });
    setIsTeamModalOpen(true);
  };

  const onLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // store file so update will send form-data
    setProfileData((prev: any) => ({ ...(prev ?? profile ?? {}), logo: file }));
    const url = URL.createObjectURL(file);
    setLogoPreview(url);
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
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Fallback if data is missing (e.g. API error or empty)
  const displayProfile = profileData || profile || {};
  const displayTeam = Array.isArray(team) ? team : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Organization Profile</h2>
          <p className="text-muted-foreground">Manage your organization&apos;s details and team members.</p>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={updateProfileMutation.isLoading || Boolean(errors.email || errors.phone)}
              >
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
                    <AvatarImage src={logoPreview ?? displayProfile.logo} />
                    <AvatarFallback>EF</AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={onLogoFileChange}
                        style={{ display: 'none' }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="h-3 w-3 mr-2" />
                        Change Logo
                      </Button>
                    </>
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
                        onChange={(e) =>
                          setProfileData((prev: any) => ({ ...(prev ?? displayProfile), name: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type">Type</Label>
                      <Input
                        id="type"
                        value={displayProfile.type || ''}
                        disabled={!isEditing}
                        onChange={(e) =>
                          setProfileData((prev: any) => ({ ...(prev ?? displayProfile), type: e.target.value }))
                        }
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
                      onChange={(e) =>
                        setProfileData((prev: any) => ({ ...(prev ?? displayProfile), description: e.target.value }))
                      }
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
                        onChange={(e) => {
                          const val = e.target.value;
                          setProfileData((prev: any) => ({ ...(prev ?? displayProfile), email: val }));
                          setErrors((prev) => ({ ...prev, email: validateEmail(val) }));
                        }}
                      />
                      {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={displayProfile.phone || ''}
                        disabled={!isEditing}
                        onChange={(e) => {
                          const val = e.target.value;
                          setProfileData((prev: any) => ({ ...(prev ?? displayProfile), phone: val }));
                          setErrors((prev) => ({ ...prev, phone: validatePhone(val) }));
                        }}
                      />
                      {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={displayProfile.website || ''}
                        disabled={!isEditing}
                        onChange={(e) =>
                          setProfileData((prev: any) => ({ ...(prev ?? displayProfile), website: e.target.value }))
                        }
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
                        onChange={(e) =>
                          setProfileData((prev: any) => ({ ...(prev ?? displayProfile), address: e.target.value }))
                        }
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
                <CardDescription>Manage access to your organization&apos;s dashboard.</CardDescription>
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
                        <AvatarFallback>
                          {member.name
                            ?.split(' ')
                            .map((n: string) => n[0])
                            .join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={member.role === 'Admin' ? 'default' : 'secondary'}>{member.role}</Badge>
                      <Badge
                        variant={member.status?.toLowerCase() === 'active' ? 'outline' : 'secondary'}
                        className={
                          member.status?.toLowerCase() === 'active' ? 'text-green-600 border-green-200 bg-green-50' : ''
                        }
                      >
                        {member.status}
                      </Badge>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEditMember(member)}>
                          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600"
                          onClick={() => deleteTeamMemberMutation.mutate(member.id)}
                        >
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
                    <Switch
                      id="public-profile-toggle"
                      checked={Boolean(displayProfile.publicProfile)}
                      disabled={!isEditing}
                      onCheckedChange={(v) =>
                        setProfileData((prev: any) => ({ ...(prev ?? displayProfile), publicProfile: Boolean(v) }))
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <h4 className="font-medium text-sm">Auto-approve Volunteers</h4>
                    <p className="text-xs text-muted-foreground">Automatically accept volunteer applications.</p>
                  </div>
                  <div className="flex items-center h-6">
                    {/* Toggle switch placeholder */}
                    <Switch
                      id="auto-approve-toggle"
                      checked={Boolean(displayProfile.autoApproveVolunteers)}
                      disabled={!isEditing}
                      onCheckedChange={(v) =>
                        setProfileData((prev: any) => ({
                          ...(prev ?? displayProfile),
                          autoApproveVolunteers: Boolean(v)
                        }))
                      }
                    />
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
              {editingMember ? (
                'Update member details.'
              ) : (
                <>
                  Send an invitation to a new team member.
                  <p className="text-xs text-muted-foreground mt-2">
                    Note: If the email belongs to a registered user, they will be added directly to your team. Otherwise
                    an email invitation will be created which the recipient can accept to join your organization.
                  </p>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="member-name">Name</Label>
              <Input
                id="member-name"
                value={teamFormData.name}
                onChange={(e) => setTeamFormData({ ...teamFormData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-email">Email</Label>
              <Input
                id="member-email"
                value={teamFormData.email}
                onChange={(e) => setTeamFormData({ ...teamFormData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-role">Role</Label>
              <Input
                id="member-role"
                value={teamFormData.role}
                onChange={(e) => setTeamFormData({ ...teamFormData, role: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTeamModalOpen(false)}>
              Cancel
            </Button>
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
