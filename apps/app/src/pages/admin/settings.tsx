// src/pages/admin/settings.tsx
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import SkeletonCard from '@/components/atoms/skeleton-card';

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<Record<string, any>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: api.getSettings,
    onSuccess: (data) => {
      if (data && typeof data === 'object') {
        setSettings(data);
      }
    }
  });

  const updateMutation = useMutation({
    mutationFn: api.updateSettings,
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
      <div className="space-y-6 max-w-2xl mx-auto p-4">
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Application Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Enable Email Notifications</span>
            <Switch
              id="email-notifications"
              checked={settings['emailNotifications'] || false}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, emailNotifications: checked })
              }
            />
          </div>
          <div className="flex flex-col space-y-1">
            <label htmlFor="site-name" className="font-medium">
              Site Name
            </label>
            <Input
              id="site-name"
              value={settings['siteName'] || 'Eghata Volunteer System'}
              onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
            />
          </div>
          <Button className="mt-2" onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
