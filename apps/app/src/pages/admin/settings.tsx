// src/pages/admin/settings.tsx
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import MonacoEditor from '@/components/MonacoEditor';
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
  const [rawMode, setRawMode] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState('');

  const { isLoading } = useQuery({
    queryKey: ['admin', 'system-settings'],
    queryFn: () => api.getSystemSettings(),
    onSuccess: (incoming) => {
      if (incoming && typeof incoming === 'object') {
        setSettings(incoming);
      }
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.updateSystemSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'system-settings'] });
      toast.success('Settings saved successfully');
    },
    onError: () => toast.error('Failed to save settings')
  });

  const handleSave = () => {
    // If raw editor is active we should parse and merge features before saving
    if (rawMode) {
      try {
        const parsed = JSON.parse(jsonText || '{}');
        updateMutation.mutate({ ...settings, features: parsed });
      } catch (err: any) {
        setJsonError(String(err?.message ?? err));
        toast.error('Invalid JSON in Raw editor — please fix before saving');
      }
    } else {
      updateMutation.mutate(settings);
    }
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
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
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

        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle>Server feature flags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Toggle server-driven features that control admin UI.
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant={!rawMode ? 'outline' : 'ghost'} onClick={() => setRawMode(false)}>
                    Form View
                  </Button>
                  <Button
                    size="sm"
                    variant={rawMode ? 'outline' : 'ghost'}
                    onClick={() => {
                      setRawMode(true);
                      try {
                        setJsonText(JSON.stringify(settings?.features || {}, null, 2));
                        setJsonError('');
                      } catch (e) {
                        setJsonText('{}');
                        setJsonError('Unable to prepare json');
                      }
                    }}
                  >
                    Raw JSON
                  </Button>
                </div>
              </div>

              {rawMode ? (
                <div className="space-y-3">
                  <div className="text-xs text-muted-foreground">
                    Edit features as raw JSON. Changes will be persisted under the <code>features</code> system setting.
                  </div>
                  <MonacoEditor
                    value={jsonText}
                    onChange={(v: string) => {
                      setJsonText(v);
                      try {
                        JSON.parse(v);
                        setJsonError('');
                      } catch (err: any) {
                        setJsonError(String(err?.message ?? err));
                      }
                    }}
                    language="json"
                    height="240px"
                    jsonSchema={
                      {
                        type: 'object',
                        additionalProperties: { type: 'boolean' },
                        properties: {
                          dataOps: { type: 'boolean', description: 'Enable data operations: imports/exports/backups' },
                          analytics: { type: 'boolean', description: 'Enable analytics pages and reports' },
                          monitoring: { type: 'boolean', description: 'Enable monitoring features' },
                          scheduling: { type: 'boolean', description: 'Enable scheduling features' }
                        }
                      } as any
                    }
                    schemaUri="inmemory://model/features-schema.json"
                  />
                  {jsonError ? (
                    <div className="text-xs text-red-600">JSON error: {jsonError}</div>
                  ) : (
                    <div className="bg-slate-50 p-3 rounded border text-xs">
                      <pre className="text-xs whitespace-pre-wrap">{jsonText}</pre>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {(['dataOps', 'analytics', 'monitoring', 'scheduling'] as string[]).map((k) => (
                    <div className="flex items-center justify-between" key={k}>
                      <span className="font-medium">{k}</span>
                      <Switch
                        id={`feature-${k}`}
                        checked={(settings?.features?.[k] as boolean) ?? false}
                        onCheckedChange={(checked) =>
                          setSettings({ ...settings, features: { ...(settings.features || {}), [k]: checked } })
                        }
                      />
                    </div>
                  ))}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle>Platform Branding</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="platform-name">Platform Name</Label>
                  <Input
                    id="platform-name"
                    value={settings['platform_name'] || ''}
                    onChange={(e) => setSettings({ ...settings, platform_name: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="platform-tagline">Platform Tagline</Label>
                  <Input
                    id="platform-tagline"
                    value={settings['platform_tagline'] || ''}
                    onChange={(e) => setSettings({ ...settings, platform_tagline: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="primary-color">Primary color</Label>
                  <Input
                    id="primary-color"
                    value={settings['primary_color'] || ''}
                    onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                    placeholder="#FF5733"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="secondary-color">Secondary color</Label>
                  <Input
                    id="secondary-color"
                    value={settings['secondary_color'] || ''}
                    onChange={(e) => setSettings({ ...settings, secondary_color: e.target.value })}
                    placeholder="#0EA5A6"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="logo-url">Logo URL</Label>
                  <Input
                    id="logo-url"
                    value={settings['logo_url'] || ''}
                    onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
                    placeholder="https://example.com/logo.png"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="favicon-url">Favicon URL</Label>
                  <Input
                    id="favicon-url"
                    value={settings['favicon_url'] || ''}
                    onChange={(e) => setSettings({ ...settings, favicon_url: e.target.value })}
                    placeholder="https://example.com/favicon.ico"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={async () => {
                    try {
                      const payload = {
                        platform_name: settings['platform_name'] || undefined,
                        platform_tagline: settings['platform_tagline'] || undefined,
                        primary_color: settings['primary_color'] || undefined,
                        secondary_color: settings['secondary_color'] || undefined,
                        logo_url: settings['logo_url'] || undefined,
                        favicon_url: settings['favicon_url'] || undefined
                      };

                      await api.updateBranding(payload as any);
                      queryClient.invalidateQueries({ queryKey: ['admin', 'system-settings'] });
                      toast.success('Branding saved');
                    } catch (err) {
                      toast.error('Failed to save branding');
                    }
                  }}
                >
                  Save Branding
                </Button>
                <div className="text-xs text-muted-foreground">Branding values are stored in system settings.</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
