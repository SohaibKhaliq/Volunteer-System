// src/pages/admin/settings.tsx
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';

export default function AdminSettings() {
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
          {/* Example toggle */}
          <div className="flex items-center justify-between">
            <span className="font-medium">Enable Email Notifications</span>
            <Switch id="email-notifications" />
          </div>
          {/* Example input */}
          <div className="flex flex-col space-y-1">
            <label htmlFor="site-name" className="font-medium">Site Name</label>
            <Input id="site-name" defaultValue="Eghata Volunteer System" />
          </div>
          {/* Save button */}
          <Button className="mt-2" onClick={() => alert('Settings saved (mock)')}>Save Changes</Button>
        </CardContent>
      </Card>
    </div>
  );
}
