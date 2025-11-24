import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { toast } from '@/components/atoms/use-toast';
import { Award, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function Profile() {
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useQuery(['me'], api.getCurrentUser);
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    bio: ''
  });

  useEffect(() => {
    if (user) {
      const u = (user as any).data || user;
      setFormData({
        firstName: u.firstName || u.first_name || '',
        lastName: u.lastName || u.last_name || '',
        email: u.email || '',
        phone: u.phone || '',
        bio: u.profileMetadata?.bio || ''
      });
    }
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.updateUser((user as any).id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['me']);
      toast.success('Profile updated');
      setIsEditing(false);
    },
    onError: () => {
      toast.error('Failed to update profile');
    }
  });

  if (isLoading) return <div className="p-8 text-center">Loading profile...</div>;

  const userData = (user as any).data || user;

  return (
    <div className="container mx-auto py-8 max-w-4xl space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">My Profile</h1>
        <Button variant={isEditing ? "outline" : "default"} onClick={() => setIsEditing(!isEditing)}>
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Info */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">First Name</label>
                <Input 
                  disabled={!isEditing}
                  value={formData.firstName}
                  onChange={e => setFormData({...formData, firstName: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Last Name</label>
                <Input 
                  disabled={!isEditing}
                  value={formData.lastName}
                  onChange={e => setFormData({...formData, lastName: e.target.value})}
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Email</label>
              <Input 
                disabled
                value={formData.email}
                className="bg-gray-50"
              />
              <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Phone</label>
              <Input 
                disabled={!isEditing}
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Bio</label>
              <textarea 
                className="w-full p-2 border rounded-md"
                rows={4}
                disabled={!isEditing}
                value={formData.bio}
                onChange={e => setFormData({...formData, bio: e.target.value})}
              />
            </div>

            {isEditing && (
              <div className="flex justify-end pt-4">
                <Button onClick={() => updateMutation.mutate({
                  firstName: formData.firstName,
                  lastName: formData.lastName,
                  phone: formData.phone,
                  profileMetadata: { ...userData.profileMetadata, bio: formData.bio }
                })}>
                  Save Changes
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats & Badges */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {userData.roles?.map((r: any) => (
                  <Badge key={r.id} variant="secondary">{r.name}</Badge>
                ))}
                {userData.volunteerStatus === 'active' && (
                  <Badge className="bg-green-500">Active Volunteer</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                Impact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-2xl font-bold">{userData.hours || 0}</div>
                <div className="text-sm text-muted-foreground">Total Volunteer Hours</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{userData.participationCount || 0}</div>
                <div className="text-sm text-muted-foreground">Events Attended</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
