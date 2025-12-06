// no default React import required
import { useTranslation } from 'react-i18next';

const Cookies = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white py-20">
      <div className="container px-4 mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold mb-4">{t('Cookies & Tracking')}</h1>
        <p className="text-muted-foreground mb-6">
          {t('This page explains how we use cookies and similar technologies on the Local Aid platform.')}
        </p>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">{t('What are cookies?')}</h2>
          <p className="text-muted-foreground">
            {t('Cookies are small text files used to store preferences and analytics data to improve the site.')}
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">{t('How we use them')}</h2>
          <p className="text-muted-foreground">
            {t('We use cookies for session management, analytics, and to provide a personalized experience.')}
          </p>
        </section>

        <section className="mb-6 text-sm text-muted-foreground">
          <p>
            {t(
              'You can control cookie preferences through your browser; some features may be limited if cookies are disabled.'
            )}
          </p>
        </section>
      </div>
    </div>
  );
};

export default Cookies;
