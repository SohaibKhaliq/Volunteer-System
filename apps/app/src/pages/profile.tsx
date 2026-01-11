import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';
import { useStore } from '@/lib/store';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import TagInput from '@/components/molecules/tag-input';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/atoms/use-toast';
import {
  Loader2,
  Settings,
  Bell,
  Shield,
  LogOut,
  Camera,
  CheckCircle2,
  ListChecks,
  Building2,
  Box,
  Menu,
  X,
  Award,
  Users
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

// Page Imports
import VolunteerCertificates from '@/pages/volunteer/certificates';
import VolunteerTeams from '@/pages/volunteer/teams';
import ChatPage from '@/pages/chat';
import VolunteerApplicationsPage from '@/pages/volunteer/applications';
import VolunteerOrganizationsPage from '@/pages/volunteer/organizations';
import VolunteerCompliance from '@/pages/volunteer/compliance';
import VolunteerAttendance from '@/pages/volunteer/attendance';

export default function Profile() {
  const { t } = useTranslation();
  const { logout } = useStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [activeTab, setActiveTab] = useState('applications');
  const [avatarVersion, setAvatarVersion] = useState(Date.now());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Queries
  const { data: profileData, isLoading } = useQuery(
    ['volunteer-profile'],
    () => api.getVolunteerProfile()
  );
  const { data: preferencesResponse } = useQuery(
    ['user-preferences'],
    () => api.getPreferences()
  );

  // Helper getters
  const userData = profileData || {};

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    bio: '',
    address: '',
    skills: [] as string[],
    interests: [] as string[],
    availability: '',
  });

  const [prefsFormData, setPrefsFormData] = useState<any>({});

  // Populate form when data loads
  useEffect(() => {
    if (profileData) {
      setFormData({
        firstName: profileData.firstName || '',
        lastName: profileData.lastName || '',
        email: profileData.email || '',
        phone: profileData.phone || '', // Ensure empty string, not undefined
        bio: profileData.profileMetadata?.bio || '',
        address: profileData.profileMetadata?.address || '',
        skills: profileData.profileMetadata?.skills || [],
        interests: profileData.profileMetadata?.interests || [],
        availability: profileData.profileMetadata?.availability || '',
      });
    }
  }, [profileData]);

  useEffect(() => {
    if (preferencesResponse?.preferences) {
      setPrefsFormData({ ...preferencesResponse.preferences });
    }
  }, [preferencesResponse]);

  // Mutations
  const updateMutation = useMutation(
    (data: any) => api.updateVolunteerProfile(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['volunteer-profile']);
        toast({ title: t('Profile updated'), description: t('Your information has been saved.') });
      },
      onError: (error: any) => {
        console.error('Profile update error:', error);
        toast({
          title: t('Update failed'),
          description: error?.response?.data?.error?.message || t('Could not update profile.'),
          variant: 'destructive',
        });
      },
    }
  );

  const preferencesMutation = useMutation(
    (data: any) => api.updatePreferences(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['user-preferences']);
        // toast({ title: t('Preferences updated') });
      },
    }
  );

  // Handlers
  const handleSaveAll = async () => {
    try {
      // 1. Sanitize Profile Data Payload
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone && formData.phone.trim().length > 0 ? formData.phone.trim() : undefined,
        profileMetadata: {
          bio: formData.bio ? formData.bio.trim() : undefined,
          address: formData.address ? formData.address.trim() : undefined,
          skills: Array.isArray(formData.skills) ? formData.skills.filter(s => typeof s === 'string') : [],
          interests: Array.isArray(formData.interests) ? formData.interests.filter(s => typeof s === 'string') : [],
          availability: formData.availability ? formData.availability.trim() : undefined,
        },
      };

      await updateMutation.mutateAsync(payload);

      // 2. Save Preferences
      if (Object.keys(prefsFormData).length > 0) {
        await preferencesMutation.mutateAsync({
          ...prefsFormData,
          maxHoursPerWeek: prefsFormData.maxHoursPerWeek ? Number(prefsFormData.maxHoursPerWeek) : undefined,
        });
      }
    } catch (error) {
      console.error('Unified save error:', error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: t('File too large'),
        description: t('Maximum file size is 5MB.'),
        variant: 'destructive',
      });
      return;
    }

    const fd = new FormData();
    fd.append('avatar', file);

    try {
      await api.updateVolunteerAvatar(fd);
      queryClient.invalidateQueries(['volunteer-profile']);

      // Force refresh of images by updating version
      setAvatarVersion(Date.now());
      toast({ title: t('Avatar updated'), description: t('Your profile picture has been updated.') });
    } catch (err: any) {
      console.error('Avatar upload error:', err);
      toast({
        title: t('Upload failed'),
        description: err?.response?.data?.error?.message || t('Could not upload avatar.'),
        variant: 'destructive',
      });
    }
  };

  const handlePrefChange = (key: string, value: any) => {
    setPrefsFormData((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // derived state
  const missingFields = [];
  if (!formData.phone) missingFields.push('Phone number');
  if (!formData.address) missingFields.push('Address');
  if (formData.skills.length === 0) missingFields.push('Skills');

  const totalFields = 6;
  const filledFields = 3 + (formData.phone ? 1 : 0) + (formData.address ? 1 : 0) + (formData.skills.length > 0 ? 1 : 0);
  const profileCompletion = Math.round((filledFields / totalFields) * 100);

  // Render Helpers
  const NavigationMenu = ({ mobile = false }) => {
    const items = [
      { id: 'certificates', label: t('Certificates'), icon: Award },
      { id: 'messages', label: t('Messages'), icon: MessageSquare },
      { id: 'applications', label: t('Applications'), icon: ListChecks },
      { id: 'organizations', label: t('My Organizations'), icon: Building2 },
      { id: 'teams', label: t('Teams'), icon: Users },
      { id: 'attendance', label: t('Attendance'), icon: CheckCircle2 },
      { id: 'resources', label: t('Resources'), icon: Box },
      { id: 'compliance', label: t('Compliance'), icon: Shield },
      { id: 'settings', label: t('Settings'), icon: Settings },
    ];

    return (
      <nav className={cn("space-y-1", mobile ? "p-4" : "")}>
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveTab(item.id);
              if (mobile) setIsMobileMenuOpen(false);
            }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200",
              activeTab === item.id
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <item.icon className={cn("h-4 w-4", activeTab === item.id ? "text-primary-foreground" : "text-muted-foreground")} />
            {item.label}
          </button>
        ))}
      </nav>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8 lg:py-12">

        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12 border-2 border-primary/10">
              <AvatarImage src={`${userData.profileImageUrl}?v=${avatarVersion}`} className="object-cover" />
              <AvatarFallback>{userData.firstName?.[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-bold">{userData.firstName} {userData.lastName}</h1>
              <p className="text-xs text-muted-foreground">{userData.email}</p>
            </div>
          </div>
          <Button variant="outline" size="icon" className="rounded-xl" onClick={() => setIsMobileMenuOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>

          {/* Simple Mobile Menu Overlay */}
          {isMobileMenuOpen && (
            <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}>
              <div
                className="fixed inset-y-0 left-0 z-50 h-full w-[300px] bg-card border-r p-6 shadow-2xl transition-transform duration-300"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-lg font-bold">{t('Menu')}</h2>
                  <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <NavigationMenu mobile />
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Sidebar (Desktop) */}
          <div className="hidden lg:block lg:col-span-3 xl:col-span-3 space-y-6">
            {/* Profile Card */}
            <Card className="border-border/50 shadow-sm rounded-3xl overflow-hidden bg-card/50 backdrop-blur-sm sticky top-24">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="relative mb-4 group cursor-pointer">
                  <Avatar className="h-32 w-32 border-4 border-background shadow-xl rounded-full">
                    <AvatarImage src={`${userData.profileImageUrl}?v=${avatarVersion}`} className="object-cover" />
                    <AvatarFallback className="text-3xl font-bold bg-muted text-muted-foreground">
                      {userData.firstName?.[0]}{userData.lastName?.[0]}
                    </AvatarFallback>
                    {/* Overlay */}
                    <div
                      className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Camera className="h-8 w-8 text-white" />
                    </div>
                  </Avatar>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </div>

                <h2 className="text-2xl font-bold tracking-tight mb-1">
                  {userData.firstName} {userData.lastName}
                </h2>
                <p className="text-sm text-muted-foreground font-medium mb-4 flex items-center gap-1.5 break-all justify-center">
                  {userData.isBackgroundChecked && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                  {userData.email}
                </p>

                <div className="w-full grid grid-cols-2 gap-2 mb-6">
                  <div className="p-3 bg-primary/5 rounded-2xl border border-primary/10">
                    <div className="text-2xl font-black text-primary">{userData.hours || 0}</div>
                    <div className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Hours</div>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-2xl border border-border/50">
                    <div className="text-2xl font-black text-foreground">{profileCompletion}%</div>
                    <div className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Profile</div>
                  </div>
                </div>

                {/* Navigation */}
                <div className="w-full text-left">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 pl-2">Menu</p>
                  <NavigationMenu />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-9 xl:col-span-9 space-y-6">

            {/* --- CERTIFICATES --- */}
            {activeTab === 'certificates' && (
              <div className="animate-in fade-in duration-300">
                <VolunteerCertificates />
              </div>
            )}

            {/* --- APPLICATIONS --- */}
            {activeTab === 'applications' && (
              <div className="animate-in fade-in duration-300">
                <VolunteerApplicationsPage />
              </div>
            )}

            {/* --- ORGANIZATIONS --- */}
            {activeTab === 'organizations' && (
              <div className="animate-in fade-in duration-300">
                <VolunteerOrganizationsPage />
              </div>
            )}

            {/* --- TEAMS --- */}
            {activeTab === 'teams' && (
              <div className="animate-in fade-in duration-300">
                <VolunteerTeams />
              </div>
            )}

            {/* --- COMPLIANCE --- */}
            {activeTab === 'compliance' && (
              <div className="animate-in fade-in duration-300">
                <VolunteerCompliance embed={true} />
              </div>
            )}

            {/* --- ATTENDANCE --- */}
            {activeTab === 'attendance' && (
              <div className="animate-in fade-in duration-300">
                <Card className="border-border/50 shadow-sm rounded-3xl overflow-hidden bg-card/50">
                  <CardHeader className="p-8 pb-4">
                    <CardTitle className="text-2xl font-bold">{t('Attendance & Schedule')}</CardTitle>
                    <CardDescription>{t('Manage your shifts and view attendance history.')}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-8">
                    <VolunteerAttendance />
                  </CardContent>
                </Card>
              </div>
            )}

            {/* --- RESOURCES --- */}
            {activeTab === 'resources' && (
              <div className="animate-in fade-in duration-300">
                <Card className="border-border/50 shadow-sm rounded-3xl overflow-hidden bg-card/50">
                  <CardHeader className="p-8 pb-4">
                    <CardTitle className="text-2xl font-bold">{t('My Resources')}</CardTitle>
                    <CardDescription>{t('Equipment and resources assigned to you.')}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-8 pt-0">
                    <div className="py-12 flex flex-col items-center justify-center text-center text-muted-foreground">
                      <Box className="h-12 w-12 mb-4 opacity-20" />
                      <p className="font-medium">{t('No resources assigned.')}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* --- SETTINGS (The Main Form) --- */}
            {activeTab === 'settings' && (
              <div className="space-y-6 animate-in fade-in duration-300">

                {/* Profile Form Card */}
                <Card className="border-border/50 shadow-sm rounded-3xl overflow-hidden bg-card/50">
                  <CardHeader className="p-8 border-b border-border/40">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-2xl font-bold">{t('Profile Information')}</CardTitle>
                        <CardDescription>{t('Update your personal details.')}</CardDescription>
                      </div>
                      <Button onClick={handleSaveAll} disabled={updateMutation.isLoading} className="rounded-xl shadow-lg shadow-primary/20">
                        {updateMutation.isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        {t('Save Changes')}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <Label>{t('First Name')}</Label>
                        <Input
                          value={formData.firstName}
                          onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                          className="h-11 rounded-xl bg-background/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('Last Name')}</Label>
                        <Input
                          value={formData.lastName}
                          onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                          className="h-11 rounded-xl bg-background/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('Email Address')}</Label>
                        <Input
                          value={formData.email}
                          disabled
                          className="h-11 rounded-xl bg-muted/50 text-muted-foreground"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('Phone Number')}</Label>
                        <Input
                          value={formData.phone}
                          onChange={e => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+1 234 567 8900"
                          className="h-11 rounded-xl bg-background/50"
                          required={false}
                        />
                      </div>
                      <div className="col-span-1 md:col-span-2 space-y-2">
                        <Label>{t('Address')}</Label>
                        <Input
                          value={formData.address}
                          onChange={e => setFormData({ ...formData, address: e.target.value })}
                          className="h-11 rounded-xl bg-background/50"
                        />
                      </div>
                      <div className="col-span-1 md:col-span-2 space-y-2">
                        <Label>{t('Bio')}</Label>
                        <Textarea
                          value={formData.bio}
                          onChange={e => setFormData({ ...formData, bio: e.target.value })}
                          className="min-h-[120px] rounded-xl bg-background/50 resize-y"
                          placeholder={t('Tell us about yourself...')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('Skills')}</Label>
                        <TagInput
                          value={formData.skills}
                          onChange={(vals) => setFormData({ ...formData, skills: vals })}
                          placeholder={t('Add skill...')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('Interests')}</Label>
                        <TagInput
                          value={formData.interests}
                          onChange={(vals) => setFormData({ ...formData, interests: vals })}
                          placeholder={t('Add interest...')}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Preferences Card */}
                <Card className="border-border/50 shadow-sm rounded-3xl overflow-hidden bg-card/50">
                  <CardHeader className="p-8 border-b border-border/40">
                    <CardTitle className="text-xl font-bold">{t('Preferences')}</CardTitle>
                    <CardDescription>{t('Manage your app experience.')}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-8 space-y-8">

                    <div className="space-y-4">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <Bell className="h-4 w-4" /> {t('Notifications')}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-background/40 border border-border/50">
                          <Label htmlFor="emailNotif" className="cursor-pointer">{t('Email Notifications')}</Label>
                          <Switch
                            id="emailNotif"
                            checked={prefsFormData.emailNotifications}
                            onCheckedChange={c => handlePrefChange('emailNotifications', c)}
                          />
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-xl bg-background/40 border border-border/50">
                          <Label htmlFor="smsNotif" className="cursor-pointer">{t('SMS Notifications')}</Label>
                          <Switch
                            id="smsNotif"
                            checked={prefsFormData.smsNotifications}
                            onCheckedChange={c => handlePrefChange('smsNotifications', c)}
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <Shield className="h-4 w-4" /> {t('Privacy')}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-background/40 border border-border/50">
                          <Label htmlFor="profilePublic" className="cursor-pointer">{t('Public Profile')}</Label>
                          <Switch
                            id="profilePublic"
                            checked={prefsFormData.profilePublic}
                            onCheckedChange={c => handlePrefChange('profilePublic', c)}
                          />
                        </div>
                      </div>
                    </div>

                  </CardContent>
                  <CardFooter className="p-8 bg-muted/20 border-t border-border/40 flex justify-end">
                    <Button onClick={handleSaveAll} disabled={updateMutation.isLoading || preferencesMutation.isLoading} className="rounded-xl shadow-lg">
                      {t('Save All Changes')}
                    </Button>
                  </CardFooter>
                </Card>

                {/* Danger Zone */}
                <Card className="border-red-200 dark:border-red-900/30 shadow-sm rounded-3xl overflow-hidden bg-red-50/50 dark:bg-red-950/10">
                  <CardHeader className="p-8">
                    <CardTitle className="text-xl font-bold text-destructive">{t('Danger Zone')}</CardTitle>
                    <CardDescription className="text-red-600/80 dark:text-red-400/80">{t('Sign out of your account.')}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-8 pt-0">
                    <Button variant="destructive" onClick={handleLogout} className="rounded-xl">
                      <LogOut className="h-4 w-4 mr-2" /> {t('Sign Out')}
                    </Button>
                  </CardContent>
                </Card>

              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
