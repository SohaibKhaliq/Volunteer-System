import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Loader2, RefreshCw } from 'lucide-react';
import { toast } from '@/components/atoms/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type NotificationPreference = {
  notificationType: string;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  frequency: 'instant' | 'daily' | 'weekly';
};

const VolunteerSettings = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: preferences, isLoading, isError } = useQuery<NotificationPreference[]>(
    ['notification-preferences'],
    () => api.get('/notification-preferences').then((res) => res.data)
  );

  const updateMutation = useMutation(
    (prefs: NotificationPreference[]) => api.put('/notification-preferences', { preferences: prefs }),
    {
      onSuccess: () => {
        toast({ title: t('Success'), description: t('Preferences updated successfully') });
        queryClient.invalidateQueries(['notification-preferences']);
      },
      onError: () => {
        toast({ title: t('Error'), description: t('Failed to update preferences'), variant: 'destructive' });
      },
    }
  );

  const resetMutation = useMutation(
    () => api.post('/notification-preferences/reset', {}),
    {
      onSuccess: () => {
        toast({ title: t('Success'), description: t('Preferences reset to defaults') });
        queryClient.invalidateQueries(['notification-preferences']);
      },
      onError: () => {
        toast({ title: t('Error'), description: t('Failed to reset preferences'), variant: 'destructive' });
      },
    }
  );

  const handleToggle = (type: string, field: 'inAppEnabled' | 'emailEnabled', value: boolean) => {
    if (!preferences) return;
    const updated = preferences.map((p) =>
      p.notificationType === type ? { ...p, [field]: value } : p
    );
    updateMutation.mutate(updated);
  };

  const handleFrequencyChange = (type: string, value: string) => {
    if (!preferences) return;
    const updated = preferences.map((p) =>
      p.notificationType === type ? { ...p, frequency: value as any } : p
    );
    updateMutation.mutate(updated);
  };

  const formatType = (type: string) => {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center p-12 text-red-500">
        {t('Failed to load preferences.')}
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">{t('Settings')}</h1>
        <p className="text-slate-600">{t('Manage your account preferences.')}</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('Notification Preferences')}</CardTitle>
              <CardDescription>{t('Manage how and when you receive notifications.')}</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => resetMutation.mutate()}
              disabled={resetMutation.isLoading}
            >
              {resetMutation.isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              {t('Reset Defaults')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6">
            {/* Header Row */}
            <div className="grid grid-cols-12 gap-4 text-sm font-medium text-slate-500 border-b pb-2">
              <div className="col-span-5 md:col-span-4">{t('Notification Type')}</div>
              <div className="col-span-3 md:col-span-2 text-center">{t('In-App')}</div>
              <div className="col-span-3 md:col-span-2 text-center">{t('Email')}</div>
              <div className="hidden md:block md:col-span-4">{t('Frequency')}</div>
            </div>

            {preferences?.map((pref) => (
              <div key={pref.notificationType} className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-5 md:col-span-4">
                  <p className="font-medium text-slate-900">{formatType(pref.notificationType)}</p>
                </div>

                <div className="col-span-3 md:col-span-2 flex justify-center">
                  <Switch
                    checked={pref.inAppEnabled}
                    onCheckedChange={(checked) => handleToggle(pref.notificationType, 'inAppEnabled', checked)}
                    disabled={updateMutation.isLoading}
                  />
                </div>

                <div className="col-span-3 md:col-span-2 flex justify-center">
                  <Switch
                    checked={pref.emailEnabled}
                    onCheckedChange={(checked) => handleToggle(pref.notificationType, 'emailEnabled', checked)}
                    disabled={updateMutation.isLoading}
                  />
                </div>

                <div className="col-span-1 md:col-span-4 hidden md:block">
                  <Select
                    value={pref.frequency}
                    onValueChange={(val) => handleFrequencyChange(pref.notificationType, val)}
                    disabled={!pref.emailEnabled || updateMutation.isLoading}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instant">{t('Instant')}</SelectItem>
                      <SelectItem value="daily">{t('Daily Digest')}</SelectItem>
                      <SelectItem value="weekly">{t('Weekly Digest')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">{t('Danger Zone')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {t('Once you delete your account, there is no going back. Please be certain.')}
          </p>
          <Button variant="destructive">{t('Delete Account')}</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default VolunteerSettings;
