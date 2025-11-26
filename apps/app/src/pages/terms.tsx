import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const Terms = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white py-20">
      <div className="container px-4 mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold mb-4">{t('Terms of Service')}</h1>
        <p className="text-muted-foreground mb-6">{t('Effective date')} — November 2025</p>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">{t('Acceptance of terms')}</h2>
          <p className="text-muted-foreground">
            {t('By using Eghata you agree to these terms. Please read them carefully.')}
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">{t('Use of the service')}</h2>
          <p className="text-muted-foreground">
            {t(
              'You may use the platform to discover and advertise volunteer opportunities; you must not misuse it or violate applicable law.'
            )}
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">{t('Content & conduct')}</h2>
          <p className="text-muted-foreground">
            {t(
              'Users are responsible for any content they post. We reserve the right to remove content that violates these terms.'
            )}
          </p>
        </section>

        <div className="mt-8 text-sm text-muted-foreground">
          <p>
            {t('If you need clarification on any of the terms, contact')}{' '}
            <Link to="/contact" className="text-primary">
              contact@eghata.org
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Terms;
