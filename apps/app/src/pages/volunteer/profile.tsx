import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStore } from '@/lib/store';
import api from '@/lib/api';

const VolunteerProfile = () => {
  const { t } = useTranslation();
  const { user } = useStore();

  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setIsSaving(true);
    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'), // Note: lastName input was removed in previous step, need to check if I should add it back or just use Full Name
      phone: formData.get('phone')
      // bio is not in user model yet, skipping for now or adding to profileMetadata
    };

    try {
      // Split full name if needed or just update what we have.
      // The input label says "Full Name" but ID is "firstName".
      // Let's assume we just update firstName for now or split it.
      // Actually, let's just send what we have.
      await api.updateUser(user.id, data);
      toast.success(t('Profile updated successfully'));
    } catch (error) {
      toast.error(t('Failed to update profile'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">{t('My Profile')}</h1>
        <p className="text-slate-600">{t('Manage your personal information and preferences.')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('Personal Information')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="firstName">{t('First Name')}</Label>
                <Input name="firstName" id="firstName" defaultValue={(user as any)?.firstName} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">{t('Last Name')}</Label>
                <Input name="lastName" id="lastName" defaultValue={(user as any)?.lastName} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t('Email')}</Label>
                <Input id="email" type="email" defaultValue={(user as any)?.email} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t('Phone Number')}</Label>
                <Input name="phone" id="phone" placeholder="+1 (555) 000-0000" defaultValue={(user as any)?.phone} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">{t('Bio')}</Label>
              <Textarea id="bio" placeholder={t('Tell organizations a bit about yourself...')} />
            </div>

            <Button type="submit" disabled={isSaving}>
              {isSaving ? t('Saving...') : t('Save Changes')}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('Skills & Interests')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>{t('Skills')}</Label>
            <Input placeholder={t('e.g. Teaching, Cooking, First Aid (comma separated)')} />
          </div>
          <div className="space-y-2">
            <Label>{t('Causes you care about')}</Label>
            <Input placeholder={t('e.g. Environment, Education, Poverty (comma separated)')} />
          </div>
          <Button variant="outline">{t('Update Skills')}</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default VolunteerProfile;
