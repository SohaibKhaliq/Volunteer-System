// src/pages/admin/settings.tsx
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from '@/components/atoms/use-toast';
import SkeletonCard from '@/components/atoms/skeleton-card';

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<Record<string, any>>({});

  const { isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.getSettings(),
    onSuccess: (incoming) => {
      if (incoming && typeof incoming === 'object') {
        setSettings(incoming);
      }
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Settings saved successfully');
    },
    onError: () => toast.error('Failed to save settings')
  });

  const handleSave = () => {
    updateMutation.mutate(settings);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto p-4">
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8 text-primary" />
          Application Settings
        </h2>
        <Button onClick={handleSave} disabled={updateMutation.isPending}>
          {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="content">Page Content</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Enable Email Notifications</span>
                <Switch
                  id="email-notifications"
                  checked={settings['emailNotifications'] || false}
                  onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
                />
              </div>
              <div className="flex flex-col space-y-1">
                <Label htmlFor="site-name">Site Name</Label>
                <Input
                  id="site-name"
                  value={settings['siteName'] || 'Local Aid'}
                  onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle>About Page Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mission">Our Mission</Label>
                <Textarea
                  id="mission"
                  className="min-h-[100px]"
                  value={settings['mission'] || ''}
                  onChange={(e: any) => setSettings({ ...settings, mission: e.target.value })}
                  placeholder="Describe the organization's mission..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vision">Our Vision</Label>
                <Textarea
                  id="vision"
                  className="min-h-[100px]"
                  value={settings['vision'] || ''}
                  onChange={(e: any) => setSettings({ ...settings, vision: e.target.value })}
                  placeholder="Describe the organization's vision..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="values">Our Values</Label>
                <Textarea
                  id="values"
                  className="min-h-[100px]"
                  value={settings['values'] || ''}
                  onChange={(e: any) => setSettings({ ...settings, values: e.target.value })}
                  placeholder="List core values..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
