import React, { useState } from 'react';
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
  Trash2
} from 'lucide-react';

export default function OrganizationProfile() {
  const [isEditing, setIsEditing] = useState(false);

  // Mock data
  const [profile, setProfile] = useState({
    name: 'Eghata Foundation',
    description: 'Non-profit organization dedicated to environmental conservation and community support.',
    email: 'contact@eghata.org',
    phone: '+1 (555) 123-4567',
    website: 'https://eghata.org',
    address: '123 Charity Lane, Volunteer City, VC 90210',
    logo: 'https://github.com/shadcn.png',
    type: 'Non-Profit',
    founded: '2015'
  });

  const [team, setTeam] = useState([
    { id: 1, name: 'Sarah Ahmed', role: 'Admin', email: 'sarah@eghata.org', status: 'Active' },
    { id: 2, name: 'Mohammed Ali', role: 'Coordinator', email: 'mohammed@eghata.org', status: 'Active' },
    { id: 3, name: 'Layla Hassan', role: 'Coordinator', email: 'layla@eghata.org', status: 'Invited' }
  ]);

  const handleSave = () => {
    setIsEditing(false);
    // Logic to save profile would go here
  };

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
              <Button onClick={handleSave}>Save Changes</Button>
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
                    <AvatarImage src={profile.logo} />
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
                        value={profile.name} 
                        disabled={!isEditing}
                        onChange={(e) => setProfile({...profile, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type">Type</Label>
                      <Input 
                        id="type" 
                        value={profile.type} 
                        disabled={!isEditing}
                        onChange={(e) => setProfile({...profile, type: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea 
                      id="description" 
                      value={profile.description} 
                      disabled={!isEditing}
                      className="h-24"
                      onChange={(e) => setProfile({...profile, description: e.target.value})}
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
                        value={profile.email} 
                        disabled={!isEditing}
                        onChange={(e) => setProfile({...profile, email: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="phone">Phone</Label>
                      <Input 
                        id="phone" 
                        value={profile.phone} 
                        disabled={!isEditing}
                        onChange={(e) => setProfile({...profile, phone: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="website">Website</Label>
                      <Input 
                        id="website" 
                        value={profile.website} 
                        disabled={!isEditing}
                        onChange={(e) => setProfile({...profile, website: e.target.value})}
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
                        value={profile.address} 
                        disabled={!isEditing}
                        className="h-24"
                        onChange={(e) => setProfile({...profile, address: e.target.value})}
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
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Invite Member
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {team.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg bg-white">
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
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
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                      </Button>
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
    </div>
  );
}
