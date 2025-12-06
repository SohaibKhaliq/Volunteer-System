import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';

const VolunteerSettings = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">{t('Settings')}</h1>
        <p className="text-slate-600">{t('Manage your account preferences.')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('Notifications')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">{t('Email Notifications')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('Receive emails about new opportunities and updates.')}
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">{t('SMS Notifications')}</Label>
              <p className="text-sm text-muted-foreground">{t('Receive text messages for urgent alerts.')}</p>
            </div>
            <Switch />
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
