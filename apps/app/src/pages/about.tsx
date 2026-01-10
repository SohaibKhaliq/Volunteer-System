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
      <section className="relative py-24 flex items-center justify-center bg-primary text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/80 z-10" />
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:30px_30px] z-10" />
        <div className="container relative z-20 px-4 text-center">
          <h1 className="text-5xl md:text-7xl font-black mb-8 tracking-tight">
            {t('About Local Aid')}
          </h1>
          <p className="text-xl md:text-2xl text-primary-foreground/90 max-w-3xl mx-auto leading-relaxed font-medium">
            {t('Empowering communities through seamless volunteer management and meaningful connections.')}
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-24 bg-background">
        <div className="container px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div className="space-y-10">
              <div className="bg-card p-10 rounded-[2.5rem] border border-border/50 shadow-sm">
                <h2 className="text-4xl font-black mb-6 text-foreground tracking-tight">{t('Our Mission')}</h2>
                <p className="text-lg text-muted-foreground mb-10 leading-relaxed font-medium whitespace-pre-wrap">{mission}</p>
                {vision && (
                  <>
                    <h3 className="text-2xl font-black mb-4 text-foreground tracking-tight">{t('Our Vision')}</h3>
                    <p className="text-lg text-muted-foreground leading-relaxed font-medium whitespace-pre-wrap">{vision}</p>
                  </>
                )}
              </div>
            </div>
            <div className="relative h-[500px] rounded-[3rem] overflow-hidden shadow-2xl shadow-primary/10 border border-border/30">
              <img
                src="https://images.unsplash.com/photo-1559027615-cd4628902d4a?q=80&w=2074&auto=format&fit=crop"
                alt="Volunteers working together"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 bg-muted/30">
        <div className="container px-4">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight text-foreground">{t('Our Core Values')}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg font-medium leading-relaxed">
              {settings?.values ? (
                <span className="whitespace-pre-wrap">{settings.values}</span>
              ) : (
                t('These principles guide everything we do, from product development to community support.')
              )}
            </p>
          </div>

          {!settings?.values && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { icon: Users, title: 'Community', desc: 'Building strong connections between people.', color: 'text-blue-500', bg: 'bg-blue-500/10' },
                { icon: Heart, title: 'Compassion', desc: 'Driven by a desire to help others.', color: 'text-rose-500', bg: 'bg-rose-500/10' },
                { icon: Shield, title: 'Trust', desc: 'Creating a safe and reliable environment.', color: 'text-amber-500', bg: 'bg-amber-500/10' },
                { icon: Globe, title: 'Impact', desc: 'Focusing on tangible, positive change.', color: 'text-emerald-500', bg: 'bg-emerald-500/10' }
              ].map((item, i) => (
                <div key={i} className="bg-card p-10 rounded-[2.5rem] shadow-sm hover:shadow-2xl transition-all duration-500 text-center border border-border/50 group">
                  <div className={`w-16 h-16 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 group-hover:rotate-6 transition-transform`}>
                    <item.icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-2xl font-black mb-4 text-foreground">{t(item.title)}</h3>
                  <p className="text-muted-foreground font-medium leading-relaxed">{t(item.desc)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Team Section */}
      <section className="py-24 bg-background">
        <div className="container px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-16 tracking-tight text-foreground">{t('Meet the Team')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            {[1, 2, 3].map((i) => (
              <div key={i} className="group text-center">
                <div className="relative w-56 h-56 mx-auto mb-8">
                  <div className="absolute inset-0 bg-primary/10 rounded-[2.5rem] rotate-6 group-hover:rotate-12 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-card rounded-[2.5rem] border border-border/50 overflow-hidden z-10">
                    <img
                      src={`https://i.pravatar.cc/400?img=${i + 15}`}
                      alt="Team Member"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  </div>
                </div>
                <h3 className="text-2xl font-black mb-2 text-foreground">
                  {i === 1 ? 'Sarah Johnson' : i === 2 ? 'Michael Chen' : 'Amira Ahmed'}
                </h3>
                <p className="text-primary font-black uppercase tracking-widest text-xs">
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
