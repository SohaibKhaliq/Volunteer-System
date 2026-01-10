// no default React import needed
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const Terms = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background py-24">
      <div className="container px-4 mx-auto max-w-4xl">
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4 text-foreground">{t('Terms of Service')}</h1>
          <p className="text-muted-foreground font-medium">{t('Effective date')} — November 2025</p>
        </div>

        <div className="bg-card border border-border/50 rounded-3xl p-8 md:p-12 shadow-2xl shadow-primary/5 space-y-10">

          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              {t('Acceptance of terms')}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {t('By using Local Aid you agree to these terms. Please read them carefully.')}
            </p>
          </section>

          <section className="pt-8 border-t border-border/50">
            <h2 className="text-2xl font-bold mb-4 text-foreground flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              {t('Use of the service')}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {t(
                'You may use the platform to discover and advertise volunteer opportunities; you must not misuse it or violate applicable law.'
              )}
            </p>
          </section>

          <section className="pt-8 border-t border-border/50">
            <h2 className="text-2xl font-bold mb-4 text-foreground flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              {t('Content & conduct')}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {t(
                'Users are responsible for any content they post. We reserve the right to remove content that violates these terms.'
              )}
            </p>
          </section>

          <div className="pt-10 mt-10 border-t-2 border-dashed border-border/50 text-center">
            <p className="text-muted-foreground font-medium">
              {t('If you need clarification on any of the terms, contact')}{' '}
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

export default Terms;
