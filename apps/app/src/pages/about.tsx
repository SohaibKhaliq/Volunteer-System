import { useTranslation } from 'react-i18next';
import { Users, Heart, Shield, Globe } from 'lucide-react';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

const About = () => {
  const { t } = useTranslation();
  const { data: settings } = useQuery(['settings'], () => api.getSettings().then((res: any) => res || {}));

  const mission =
    settings?.mission ||
    t(
      'At Local Aid, we believe that everyone has the power to make a difference. Our platform bridges the gap between passionate volunteers and organizations that need their help.'
    );

  const vision =
    settings?.vision ||
    t(
      'We strive to simplify the volunteering process, making it easier for organizations to manage their workforce and for individuals to find opportunities that align with their values and skills.'
    );

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-32 flex items-center justify-center bg-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent z-10" />
        <div className="container relative z-20 px-4">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
              {t('About Local Aid')}
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl leading-relaxed">
              {t('Empowering communities through seamless volunteer management and meaningful connections.')}
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-24 bg-background">
        <div className="container px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div className="space-y-10">
              <div className="space-y-6">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">{t('Our Mission')}</h2>
                <p className="text-lg text-muted-foreground leading-relaxed whitespace-pre-wrap">{mission}</p>
              </div>
              {vision && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-foreground tracking-tight">{t('Our Vision')}</h3>
                  <p className="text-lg text-muted-foreground leading-relaxed whitespace-pre-wrap">{vision}</p>
                </div>
              )}
            </div>
            <div className="relative h-[600px] rounded-2xl overflow-hidden shadow-2xl border border-border">
              <img
                src="https://images.unsplash.com/photo-1559027615-cd4628902d4a?q=80&w=2074&auto=format&fit=crop"
                alt="Volunteers working together"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 bg-slate-50 dark:bg-slate-900/50">
        <div className="container px-4">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground tracking-tight">{t('Our Core Values')}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
              {t('These principles guide everything we do, from product development to community support.')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Users, title: 'Community', desc: 'Building strong connections between people.', color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/20' },
              { icon: Heart, title: 'Compassion', desc: 'Driven by a desire to help others.', color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-950/20' },
              { icon: Shield, title: 'Trust', desc: 'Creating a safe and reliable environment.', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/20' },
              { icon: Globe, title: 'Impact', desc: 'Focusing on tangible, positive change.', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/20' }
            ].map((item, i) => (
              <div key={i} className="bg-card p-10 rounded-2xl shadow-sm border border-border hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 text-center">
                <div className={`w-14 h-14 ${item.bg} ${item.color} rounded-xl flex items-center justify-center mx-auto mb-8`}>
                  <item.icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-foreground">{t(item.title)}</h3>
                <p className="text-muted-foreground leading-relaxed">{t(item.desc)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-background">
        <div className="container px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-foreground">{t('Meet the Team')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 max-w-5xl mx-auto">
            {[1, 2, 3].map((i) => (
              <div key={i} className="group text-center">
                <div className="relative w-48 h-48 mx-auto mb-6">
                  <div className="absolute inset-0 bg-card rounded-lg border border-border/50 overflow-hidden shadow-sm group-hover:shadow-md transition-all duration-300">
                    <img
                      src={`https://i.pravatar.cc/400?img=${i + 15}`}
                      alt="Team Member"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">
                  {i === 1 ? 'Sarah Johnson' : i === 2 ? 'Michael Chen' : 'Amira Ahmed'}
                </h3>
                <p className="text-primary font-semibold text-sm">
                  {i === 1 ? 'Founder & CEO' : i === 2 ? 'Head of Product' : 'Community Lead'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
