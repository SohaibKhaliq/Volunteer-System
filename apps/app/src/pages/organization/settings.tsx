
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, 
  Lock, 
  Globe, 
  Palette, 
  HelpCircle,
  LogOut
} from 'lucide-react';

export default function OrganizationSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Manage your organization's preferences and configuration.</p>
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
              <TabsTrigger
                value="appearance"
                className="w-full justify-start px-4 py-2 data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900"
              >
                <Palette className="h-4 w-4 mr-2" />
                Appearance
              </TabsTrigger>
              <TabsTrigger 
                value="help" 
                className="w-full justify-start px-4 py-2 data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900"
              >
                <HelpCircle className="h-4 w-4 mr-2" />
                Help & Support
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
                    <Input id="org-name" defaultValue="Eghata Foundation" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <select 
                      id="timezone" 
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option>UTC (GMT+00:00)</option>
                      <option>EST (GMT-05:00)</option>
                      <option>PST (GMT-08:00)</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div className="space-y-0.5">
                      <Label>Public Profile</Label>
                      <p className="text-xs text-muted-foreground">Make your organization visible to all volunteers</p>
                    </div>
                    <Switch defaultChecked />
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
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <div className="space-y-0.5">
                      <Label>Event Signups</Label>
                      <p className="text-xs text-muted-foreground">Notify when someone signs up for an event</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <div className="space-y-0.5">
                      <Label>Compliance Alerts</Label>
                      <p className="text-xs text-muted-foreground">Important alerts about document expiry</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div className="space-y-0.5">
                      <Label>Marketing Updates</Label>
                      <p className="text-xs text-muted-foreground">News and feature updates from Eghata</p>
                    </div>
                    <Switch />
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
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input id="current-password" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input id="new-password" type="password" />
                  </div>
                  <div className="pt-4">
                    <Button>Update Password</Button>
                  </div>
                  
                  <div className="pt-6 border-t mt-6">
                    <h4 className="text-sm font-medium text-red-600 mb-2">Danger Zone</h4>
                    <Button variant="destructive" size="sm">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign out of all devices
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="appearance" className="mt-0 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Appearance Settings</CardTitle>
                  <CardDescription>Customize how the organization panel looks.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Theme</Label>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="border-2 border-blue-600 rounded-md p-2 cursor-pointer bg-white">
                        <div className="h-2 w-full bg-gray-200 rounded mb-2"></div>
                        <div className="h-2 w-2/3 bg-gray-200 rounded"></div>
                        <p className="text-xs font-medium mt-2 text-center text-blue-600">Light</p>
                      </div>
                      <div className="border rounded-md p-2 cursor-pointer bg-gray-900">
                        <div className="h-2 w-full bg-gray-700 rounded mb-2"></div>
                        <div className="h-2 w-2/3 bg-gray-700 rounded"></div>
                        <p className="text-xs font-medium mt-2 text-center text-white">Dark</p>
                      </div>
                      <div className="border rounded-md p-2 cursor-pointer bg-white">
                        <div className="h-2 w-full bg-gray-200 rounded mb-2"></div>
                        <div className="h-2 w-2/3 bg-gray-200 rounded"></div>
                        <p className="text-xs font-medium mt-2 text-center">System</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div className="space-y-0.5">
                      <Label>Compact Mode</Label>
                      <p className="text-xs text-muted-foreground">Reduce spacing and font size</p>
                    </div>
                    <Switch />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="help" className="mt-0 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Help & Support</CardTitle>
                  <CardDescription>Get help with using the platform.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4">
                    <Button variant="outline" className="justify-start h-auto py-4 px-4">
                      <div className="flex flex-col items-start gap-1">
                        <span className="font-semibold">Documentation</span>
                        <span className="text-xs text-muted-foreground">Read guides and tutorials</span>
                      </div>
                    </Button>
                    <Button variant="outline" className="justify-start h-auto py-4 px-4">
                      <div className="flex flex-col items-start gap-1">
                        <span className="font-semibold">Contact Support</span>
                        <span className="text-xs text-muted-foreground">Get in touch with our team</span>
                      </div>
                    </Button>
                    <Button variant="outline" className="justify-start h-auto py-4 px-4">
                      <div className="flex flex-col items-start gap-1">
                        <span className="font-semibold">Report a Bug</span>
                        <span className="text-xs text-muted-foreground">Let us know if something isn't working</span>
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
}
