import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from '@/components/atoms/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Lock, Globe } from 'lucide-react';

export default function OrganizationSettings() {
  /* logic */
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<any>({});

  const { isLoading } = useQuery(['orgSettings'], () => api.getOrganizationSettings().then((res: any) => res || {}), {
    onSuccess: (data) => setFormData(data)
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.updateOrganizationSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['orgSettings']);
      toast({ title: 'Settings updated', variant: 'success' });
    },
    onError: () => toast({ title: 'Failed to update settings', variant: 'destructive' })
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  if (isLoading) return <div>Loading settings...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">Manage your organization&apos;s preferences and configuration.</p>
        </div>
        <Button onClick={handleSave} disabled={updateMutation.isLoading}>
             {updateMutation.isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <div className="flex flex-col md:flex-row gap-6">
          <aside className="w-full md:w-64">
            <TabsList className="flex flex-col h-auto w-full bg-transparent p-0 space-y-1">
              <TabsTrigger
                value="general"
                className="w-full justify-start px-4 py-2 data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900"
              >
                <Globe className="h-4 w-4 mr-2" />
                General
              </TabsTrigger>
              <TabsTrigger
                value="notifications"
                className="w-full justify-start px-4 py-2 data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900"
              >
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </TabsTrigger>
              <TabsTrigger
                value="security"
                className="w-full justify-start px-4 py-2 data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900"
              >
                <Lock className="h-4 w-4 mr-2" />
                Security
              </TabsTrigger>
            </TabsList>
          </aside>

          <div className="flex-1">
            <TabsContent value="general" className="mt-0 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>Basic configuration for your organization.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="org-name">Display Name</Label>
                    <Input 
                        id="org-name" 
                        value={formData.displayName || ''} 
                        onChange={(e) => handleChange('displayName', e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <select
                      id="timezone"
                      value={formData.timezone || 'UTC'}
                      onChange={(e) => handleChange('timezone', e.target.value)}
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="UTC">UTC (GMT+00:00)</option>
                      <option value="EST">EST (GMT-05:00)</option>
                      <option value="PST">PST (GMT-08:00)</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div className="space-y-0.5">
                      <Label>Public Profile</Label>
                      <p className="text-xs text-muted-foreground">Make your organization visible to all volunteers</p>
                    </div>
                    <Switch 
                        checked={formData.isPublic || false}
                        onCheckedChange={(checked) => handleChange('isPublic', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="mt-0 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>Choose what you want to be notified about.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b">
                    <div className="space-y-0.5">
                      <Label>New Volunteer Registrations</Label>
                      <p className="text-xs text-muted-foreground">Receive an email when a new volunteer joins</p>
                    </div>
                    <Switch 
                        checked={formData.notifyVolunteerJoin || false}
                        onCheckedChange={(checked) => handleChange('notifyVolunteerJoin', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <div className="space-y-0.5">
                      <Label>Event Signups</Label>
                      <p className="text-xs text-muted-foreground">Notify when someone signs up for an event</p>
                    </div>
                    <Switch 
                        checked={formData.notifyEventSignup || false}
                        onCheckedChange={(checked) => handleChange('notifyEventSignup', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="mt-0 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Manage your account security and access.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <p className="text-sm text-muted-foreground">Password management is handled via your personal profile settings.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
}
