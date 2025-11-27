import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const Privacy = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white py-20">
      <div className="container px-4 mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold mb-4">{t('Privacy Policy')}</h1>
        <p className="text-muted-foreground mb-6">{t('Last updated')} — November 2025</p>

        <p className="mb-4">
          {t('We take your privacy seriously. This policy explains what personal data we collect and how we use it.')}
        </p>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">{t('Information we collect')}</h2>
          <ul className="list-disc pl-6 text-muted-foreground">
            <li>{t('Information you provide when creating an account or requesting help')}</li>
            <li>{t('Usage data such as page visits and interactions')}</li>
            <li>{t('Cookies and similar technologies')}</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">{t('How we use your data')}</h2>
          <p className="text-muted-foreground">
            {t('To provide and improve the service, communicate with users, and comply with legal obligations.')}
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">{t('Your choices')}</h2>
          <p className="text-muted-foreground">
            {t(
              'You can change your account settings and opt out of marketing communications in your profile settings.'
            )}
          </p>
        </section>

        <div className="mt-8 text-sm text-muted-foreground">
          <p>
            {t('If you have questions about this policy, reach out to us at')}{' '}
            <Link to="/contact" className="text-primary">
              contact@Local Aid.org
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
