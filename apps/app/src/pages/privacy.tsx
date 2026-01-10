// React namespace not required
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const Privacy = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background py-24">
      <div className="container px-4 mx-auto max-w-4xl">
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4 text-foreground">{t('Privacy Policy')}</h1>
          <p className="text-muted-foreground font-medium">{t('Last updated')} — November 2025</p>
        </div>

        <div className="bg-card border border-border/50 rounded-[2.5rem] p-8 md:p-12 shadow-2xl shadow-primary/5 space-y-10">
          <p className="text-lg font-medium text-foreground/80 leading-relaxed">
            {t('We take your privacy seriously. This policy explains what personal data we collect and how we use it.')}
          </p>

          <section className="pt-8 border-t border-border/50">
            <h2 className="text-2xl font-bold mb-4 text-foreground flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              {t('Information we collect')}
            </h2>
            <ul className="space-y-3">
              {[
                t('Information you provide when creating an account or requesting help'),
                t('Usage data such as page visits and interactions'),
                t('Cookies and similar technologies')
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-muted-foreground">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary/40" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="pt-8 border-t border-border/50">
            <h2 className="text-2xl font-bold mb-4 text-foreground flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              {t('How we use your data')}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {t('To provide and improve the service, communicate with users, and comply with legal obligations.')}
            </p>
          </section>

          <section className="pt-8 border-t border-border/50">
            <h2 className="text-2xl font-bold mb-4 text-foreground flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              {t('Your choices')}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {t(
                'You can change your account settings and opt out of marketing communications in your profile settings.'
              )}
            </p>
          </section>

          <div className="pt-10 mt-10 border-t-2 border-dashed border-border/50 text-center">
            <p className="text-muted-foreground font-medium">
              {t('If you have questions about this policy, reach out to us at')}{' '}
              <Link to="/contact" className="text-primary hover:underline underline-offset-4 decoration-2 font-bold transition-all">
                contact@Local Aid.org
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
