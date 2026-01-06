// src/pages/admin/settings.tsx
import { useState, useEffect } from 'react';
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
  const [localSettings, setLocalSettings] = useState<any[]>([]);
  const [modifiedKeys, setModifiedKeys] = useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'system-settings'],
    queryFn: () => api.getSystemSettings()
  });

  useEffect(() => {
    if (Array.isArray(data)) {
      setLocalSettings(data);
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: (payload: Record<string, any>) => api.updateSystemSettings(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'system-settings'] });
      setModifiedKeys(new Set());
      toast.success('Settings saved successfully');
    },
    onError: () => toast.error('Failed to save settings')
  });

  const handleValueChange = (key: string, value: any) => {
    setLocalSettings((prev) =>
      prev.map((s) => (s.key === key ? { ...s, value: typeof value === 'object' ? JSON.stringify(value) : String(value) } : s))
    );
    setModifiedKeys((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  };

  const handleSaveAll = () => {
    if (modifiedKeys.size === 0) return;
    const payload: Record<string, any> = {};
    localSettings.forEach((s) => {
      if (modifiedKeys.has(s.key)) {
        // Parse JSON strings back to objects if they are JSON type to let backend handle appropriately
        if (s.type === 'json') {
          try {
            payload[s.key] = JSON.parse(s.value);
          } catch {
            payload[s.key] = s.value;
          }
        } else if (s.type === 'boolean') {
          payload[s.key] = s.value === 'true' || s.value === '1';
        } else if (s.type === 'number') {
          payload[s.key] = Number(s.value);
        } else {
          payload[s.key] = s.value;
        }
      }
    });
    updateMutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto p-4">
        <SkeletonCard />
      </div>
    );
  }

  // Group settings by category
  const categories = Array.from(new Set(localSettings.map((s) => s.category || 'General')));
  const groupedSettings = categories.reduce((acc, cat) => {
    acc[cat] = localSettings.filter((s) => (s.category || 'General') === cat);
    return acc;
  }, {} as Record<string, any[]>);

  const renderField = (setting: any) => {
    const { key, value, type } = setting;
    const isEditable = setting.isEditable !== false && setting.is_editable !== false;
    const label = key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());

    switch (type) {
      case 'boolean':
        return (
          <div className="flex items-center justify-between py-2 border-b last:border-0" key={key}>
            <div>
              <Label className="font-medium">{label}</Label>
              <div className="text-xs text-muted-foreground">{key}</div>
            </div>
            <Switch
              checked={value === 'true' || value === '1'}
              onCheckedChange={(checked) => handleValueChange(key, checked ? 'true' : 'false')}
              disabled={!isEditable}
            />
          </div>
        );
      case 'number':
        return (
          <div className="space-y-1 py-2" key={key}>
            <Label htmlFor={key}>{label}</Label>
            <Input
              id={key}
              type="number"
              value={value}
              onChange={(e) => handleValueChange(key, e.target.value)}
              disabled={!isEditable}
            />
            <div className="text-xs text-muted-foreground">{key}</div>
          </div>
        );
      case 'json':
        return (
          <div className="space-y-1 py-2" key={key}>
            <Label>{label}</Label>
            <MonacoEditor
              value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
              onChange={(v: string) => handleValueChange(key, v)}
              language="json"
              height="200px"
            />
            <div className="text-xs text-muted-foreground">{key}</div>
          </div>
        );
      default:
        return (
          <div className="space-y-1 py-2" key={key}>
            <Label htmlFor={key}>{label}</Label>
            {value && value.length > 100 ? (
              <Textarea
                id={key}
                value={value}
                onChange={(e: any) => handleValueChange(key, e.target.value)}
                className="min-h-[100px]"
                disabled={!isEditable}
              />
            ) : (
              <Input
                id={key}
                value={value}
                onChange={(e) => handleValueChange(key, e.target.value)}
                disabled={!isEditable}
              />
            )}
            <div className="text-xs text-muted-foreground">{key}</div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 mb-20">
      <div className="flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-sm z-10 py-4 border-b">
        <h2 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8 text-primary" />
          System Configuration
        </h2>
        <div className="flex items-center gap-2">
          {modifiedKeys.size > 0 && (
            <span className="text-sm text-yellow-600 font-medium">
              {modifiedKeys.size} Unsaved Change{modifiedKeys.size > 1 ? 's' : ''}
            </span>
          )}
          <Button onClick={handleSaveAll} disabled={updateMutation.isPending || modifiedKeys.size === 0}>
            {updateMutation.isPending ? 'Saving...' : 'Save All Changes'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue={categories[0]} className="w-full">
        <TabsList className="mb-4 flex-wrap h-auto">
          {categories.map((cat) => (
            <TabsTrigger key={cat} value={cat} className="capitalize">
              {cat}
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.entries(groupedSettings).map(([cat, settings]) => (
          <TabsContent key={cat} value={cat}>
            <Card>
              <CardHeader>
                <CardTitle className="capitalize">{cat} Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {settings.map((s) => renderField(s))}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
