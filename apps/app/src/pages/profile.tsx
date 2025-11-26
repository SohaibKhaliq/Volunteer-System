import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/atoms/use-toast';
import { 
  Award, Clock, Calendar, MapPin, User, Settings, 
  LogOut, Shield, Heart, CheckCircle2, History 
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useQuery(['me'], api.getCurrentUser);
  const { setToken } = useStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  
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
      toast({ title: 'Profile updated', description: 'Your changes have been saved successfully.' });
    },
    onError: () => {
      toast({ title: 'Update failed', description: 'Could not update profile. Please try again.', variant: 'destructive' });
    }
  });

  const handleLogout = () => {
    api.logout().finally(() => {
      setToken('');
      navigate('/login');
    });
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h2 className="text-2xl font-bold">Please log in to view your profile</h2>
        <Button onClick={() => navigate('/login')}>Log In</Button>
      </div>
    );
  }

  const userData = (user as any).data || user;

  // Mock data for dashboard
  const upcomingShifts = [
    { id: 1, title: 'Community Park Cleanup', date: 'Nov 25, 2024', time: '09:00 AM', location: 'Central Park', role: 'General Volunteer' },
    { id: 2, title: 'Food Bank Distribution', date: 'Nov 28, 2024', time: '10:00 AM', location: 'Community Center', role: 'Sorter' }
  ];

  const history = [
    { id: 101, title: 'Beach Cleanup', date: 'Oct 15, 2024', hours: 4, status: 'Verified' },
    { id: 102, title: 'Senior Home Visit', date: 'Oct 01, 2024', hours: 2, status: 'Verified' },
    { id: 103, title: 'Charity Run Support', date: 'Sep 20, 2024', hours: 5, status: 'Pending' }
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12">
      {/* Header / Banner */}
      <div className="bg-slate-900 text-white pt-12 pb-24 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
            <Avatar className="h-32 w-32 border-4 border-white shadow-xl">
              <AvatarImage src={userData.profileImageUrl} />
              <AvatarFallback className="bg-primary text-white text-4xl font-bold">
                {userData.firstName?.[0]}{userData.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="text-center md:text-left flex-1">
              <h1 className="text-3xl font-bold mb-1">
                {userData.firstName || userData.first_name} {userData.lastName || userData.last_name}
              </h1>
              <p className="text-slate-300 flex items-center gap-2 justify-center md:justify-start">
                <Shield className="h-4 w-4" /> Verified Volunteer
              </p>
              <div className="flex gap-2 mt-3 justify-center md:justify-start">
                <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30">
                  <Award className="h-3 w-3 mr-1" /> Top Contributor
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-5xl px-4 -mt-12">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white shadow-sm p-1 h-12 w-full md:w-auto grid grid-cols-4 md:flex">
            <TabsTrigger value="overview" className="flex gap-2"><User className="h-4 w-4" /> <span className="hidden md:inline">Overview</span></TabsTrigger>
            <TabsTrigger value="schedule" className="flex gap-2"><Calendar className="h-4 w-4" /> <span className="hidden md:inline">My Schedule</span></TabsTrigger>
            <TabsTrigger value="history" className="flex gap-2"><History className="h-4 w-4" /> <span className="hidden md:inline">History</span></TabsTrigger>
            <TabsTrigger value="settings" className="flex gap-2"><Settings className="h-4 w-4" /> <span className="hidden md:inline">Settings</span></TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Stats Cards */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Hours</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold flex items-center gap-2">
                    {userData.hours || 0}
                    <Clock className="h-5 w-5 text-blue-500" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">+12% from last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Impact Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold flex items-center gap-2">
                    {userData.impactScore || 850}
                    <Heart className="h-5 w-5 text-red-500" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Top 10% of volunteers</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Events Attended</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold flex items-center gap-2">
                    {userData.participationCount || 0}
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">3 upcoming</p>
                </CardContent>
              </Card>

              {/* Upcoming Schedule Preview */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Upcoming Schedule</CardTitle>
                  <CardDescription>Your next commitments</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {upcomingShifts.map(shift => (
                    <div key={shift.id} className="flex items-center justify-between p-4 border rounded-lg bg-slate-50/50">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {shift.date.split(' ')[1]}
                        </div>
                        <div>
                          <h4 className="font-semibold">{shift.title}</h4>
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Clock className="h-3 w-3" /> {shift.time} • <MapPin className="h-3 w-3" /> {shift.location}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">View</Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Badges/Achievements */}
              <Card>
                <CardHeader>
                  <CardTitle>Achievements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="px-3 py-1"><Award className="h-3 w-3 mr-1 text-yellow-500" /> Early Adopter</Badge>
                    <Badge variant="secondary" className="px-3 py-1"><Award className="h-3 w-3 mr-1 text-blue-500" /> 50 Hours Club</Badge>
                    <Badge variant="secondary" className="px-3 py-1"><Award className="h-3 w-3 mr-1 text-green-500" /> Eco Warrior</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* SCHEDULE TAB */}
          <TabsContent value="schedule">
            <Card>
              <CardHeader>
                <CardTitle>My Schedule</CardTitle>
                <CardDescription>Manage your upcoming volunteer shifts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingShifts.length > 0 ? upcomingShifts.map(shift => (
                    <div key={shift.id} className="flex flex-col md:flex-row md:items-center justify-between p-6 border rounded-lg gap-4">
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center justify-center w-16 h-16 bg-slate-100 rounded-lg shrink-0">
                          <span className="text-xs font-bold uppercase text-slate-500">{shift.date.split(' ')[0]}</span>
                          <span className="text-xl font-bold">{shift.date.split(' ')[1]}</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{shift.title}</h3>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {shift.time}</span>
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {shift.location}</span>
                            <span className="flex items-center gap-1"><User className="h-3 w-3" /> {shift.role}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 w-full md:w-auto">
                        <Button variant="outline" className="flex-1 md:flex-none">Cancel</Button>
                        <Button className="flex-1 md:flex-none">Details</Button>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-12 text-muted-foreground">
                      No upcoming shifts. <Button variant="link" onClick={() => navigate('/map')}>Find opportunities</Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* HISTORY TAB */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Volunteer History</CardTitle>
                <CardDescription>Your past contributions and verified hours</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b">
                      <tr>
                        <th className="p-4">Activity</th>
                        <th className="p-4">Date</th>
                        <th className="p-4">Hours</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {history.map(item => (
                        <tr key={item.id}>
                          <td className="p-4 font-medium">{item.title}</td>
                          <td className="p-4 text-slate-500">{item.date}</td>
                          <td className="p-4">{item.hours}h</td>
                          <td className="p-4">
                            <Badge variant={item.status === 'Verified' ? 'default' : 'secondary'} className={item.status === 'Verified' ? 'bg-green-500 hover:bg-green-600' : ''}>
                              {item.status}
                            </Badge>
                          </td>
                          <td className="p-4 text-right">
                            <Button variant="ghost" size="sm">Certificate</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SETTINGS TAB */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>Update your personal information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First name</Label>
                    <Input 
                      id="firstName" 
                      value={formData.firstName}
                      onChange={e => setFormData({...formData, firstName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last name</Label>
                    <Input 
                      id="lastName" 
                      value={formData.lastName}
                      onChange={e => setFormData({...formData, lastName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      value={formData.email}
                      disabled
                      className="bg-slate-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone number</Label>
                    <Input 
                      id="phone" 
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea 
                      id="bio" 
                      rows={4}
                      value={formData.bio}
                      onChange={e => setFormData({...formData, bio: e.target.value})}
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-4">
                  <Button 
                    onClick={() => updateMutation.mutate({
                      firstName: formData.firstName,
                      lastName: formData.lastName,
                      phone: formData.phone,
                      profileMetadata: { ...userData.profileMetadata, bio: formData.bio }
                    })}
                    disabled={updateMutation.isLoading}
                  >
                    {updateMutation.isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
              <CardFooter className="bg-red-50 border-t border-red-100 p-6 flex justify-between items-center mt-6">
                <div>
                  <h4 className="text-red-900 font-medium">Danger Zone</h4>
                  <p className="text-red-700 text-sm">Sign out or delete your account</p>
                </div>
                <Button variant="destructive" className="border-red-200 text-red-700 hover:bg-red-100 hover:text-red-900" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" /> Sign Out
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
