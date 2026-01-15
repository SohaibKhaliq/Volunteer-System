import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight, Heart, Users, Calendar, MapPin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { safeFormatDate } from '@/lib/format-utils';


const Home = () => {
  const { t } = useTranslation();
  const { data: featuredEvents, isLoading } = useQuery(
    ['featured-events'],
    () => api.listEvents() as unknown as Promise<any[]>
  );
  const { data: stats, isLoading: isLoadingStats } = useQuery(
    ['home-stats'],
    () => api.getHomeStats() as unknown as Promise<any>
  );

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-[500px] flex items-center justify-center bg-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-primary/5 to-transparent z-10" />
        <img
          src="https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=2070&auto=format&fit=crop"
          alt="Volunteers in action"
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
        <div className="container relative z-20 px-4">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight tracking-tight">
              {t('Make a Difference in Your Community Today')}
            </h1>
            <p className="text-lg md:text-xl text-slate-300 mb-10 max-w-2xl leading-relaxed">
              {t(
                'Join thousands of volunteers connecting with organizations to create meaningful change. Find opportunities that match your skills and passion.'
              )}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/map">
                <Button size="lg" className="w-full sm:w-auto h-12 text-base px-8 rounded-md shadow-xl font-semibold bg-primary text-white hover:bg-primary/90 transition-all duration-300">
                  {t('Find Opportunities')} <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/organizations">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto h-12 text-base px-8 rounded-md border-white/20 bg-white/5 hover:bg-white/10 text-white font-semibold backdrop-blur-sm transition-all duration-300"
                >
                  {t('For Organizations')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-background relative z-30 -mt-12">
        <div className="container px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: t('Active Volunteers'), value: stats?.activeVolunteers, fallback: '5,000+', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/20' },
              { label: t('Hours Contributed'), value: stats?.hoursContributed, fallback: '12,000+', icon: Heart, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-950/20' },
              { label: t('Partner Organizations'), value: stats?.partnerOrganizations, fallback: '150+', icon: MapPin, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/20' }
            ].map((stat, i) => (
              <div key={i} className="bg-card p-8 rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-300 group">
                <div className={`w-12 h-12 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center mb-6 transition-colors`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div className="text-3xl font-bold text-foreground mb-1 tracking-tight">
                  {isLoadingStats ? '...' : (stat.value?.toLocaleString() || stat.fallback)}
                </div>
                <div className="text-muted-foreground font-semibold text-sm uppercase tracking-wide">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-slate-50 dark:bg-slate-900/50">
        <div className="container px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground tracking-tight">{t('How It Works')}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
              {t('Getting started is easy. Follow these simple steps to begin your volunteering journey.')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { i: 1, title: t('Create an Account'), desc: t('Sign up in seconds. Complete your profile to highlight your skills and interests.'), icon: Users, color: 'text-indigo-600' },
              { i: 2, title: t('Find Opportunities'), desc: t('Browse local events and tasks. Filter by cause, location, and schedule to find the perfect match.'), icon: MapPin, color: 'text-orange-600' },
              { i: 3, title: t('Make an Impact'), desc: t('Join the event, track your hours, and see the difference you make in your community.'), icon: Heart, color: 'text-rose-600' }
            ].map((step) => (
              <div key={step.i} className="relative group">
                <div className="absolute -left-4 -top-4 text-8xl font-black text-slate-200/50 dark:text-slate-800/10 -z-10 group-hover:text-primary/10 transition-colors">
                  0{step.i}
                </div>
                <div className="space-y-4">
                  <div className={`w-12 h-12 ${step.color} flex items-center mb-6`}>
                    <step.icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-base">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Opportunities */}
      <section className="py-24 bg-background">
        <div className="container px-4">
          <div className="flex flex-col md:flex-row justify-between items-baseline mb-16 gap-6">
            <div className="space-y-2">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">{t('Featured Opportunities')}</h2>
              <p className="text-muted-foreground text-lg">{t('Discover urgent needs and popular events near you.')}</p>
            </div>
            <Link to="/map" className="group flex items-center gap-2 font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-widest text-xs">
              {t('View All Opportunities')} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {isLoading
              ? [1, 2, 3].map((i) => (
                <div key={i} className="bg-card rounded-xl overflow-hidden h-[450px] border border-border animate-pulse" />
              ))
              : featuredEvents?.slice(0, 3).map((event: any) => (
                <div
                  key={event.id}
                  className="group bg-card rounded-xl overflow-hidden border border-border hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 flex flex-col"
                >
                  <div className="h-56 overflow-hidden relative">
                    <img
                      src={
                        event.image ||
                        `https://images.unsplash.com/photo-${event.id % 2 === 0 ? '1559027615-cd4628902d4a' : '1593113598332-cd288d649433'}?q=80&w=800&auto=format&fit=crop`
                      }
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    {event.isUrgent && (
                      <div className="absolute top-4 right-4 bg-rose-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                        {t('Urgent')}
                      </div>
                    )}
                  </div>
                  <div className="p-8 flex-1 flex flex-col">
                    <div className="text-[10px] font-black uppercase tracking-widest text-primary mb-3">{event.type || 'Community Service'}</div>
                    <h3 className="text-xl font-bold mb-3 text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                      {event.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-8 line-clamp-2 leading-relaxed">
                      {event.description}
                    </p>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        <Calendar className="h-4 w-4 text-primary/70" />
                        {safeFormatDate(event.startAt || event.date)}
                      </div>
                      <Link to={`/events/${event.id}`}>
                        <Button variant="ghost" size="sm" className="font-bold text-primary group-hover:bg-primary group-hover:text-white rounded-md transition-all">
                          {t('Details')} <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-slate-950 opacity-10" />
        <div className="container px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold mb-8 tracking-tight">{t('Ready to Start Your Journey?')}</h2>
          <p className="text-xl text-primary-foreground/80 mb-12 max-w-2xl mx-auto leading-relaxed">
            {t('Whether you want to volunteer or need help organizing volunteers, Local Aid is the platform for you.')}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Link to="/register">
              <Button size="lg" className="w-full sm:w-auto h-14 text-lg px-10 rounded-md font-bold bg-white text-primary hover:bg-slate-100 shadow-2xl transition-all">
                {t('Join as Volunteer')}
              </Button>
            </Link>
            <Link to="/organizations/register">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto h-14 text-lg px-10 rounded-md border-white/30 bg-white/5 hover:bg-white/10 text-white font-bold backdrop-blur-sm transition-all"
              >
                {t('Register Organization')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section className="py-20 bg-muted/20">
        <div className="container px-4 mx-auto text-center">
          <h2 className="text-2xl font-bold mb-3 text-foreground">{t('Our Partners')}</h2>
          <p className="text-muted-foreground mb-10 max-w-2xl mx-auto text-base">
            {t('We work with organisations large and small to deliver local impact')}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-center max-w-5xl mx-auto">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="group p-6 bg-card rounded-lg shadow-sm border border-border/50 flex items-center justify-center h-32 hover:shadow-md transition-all duration-300">
                <img src={`/partners/partner-${i}.svg`} alt={`Partner ${i}`} className="h-12 opacity-60 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-background border-t border-border/50">
        <div className="container px-4 mx-auto text-center">
          <h2 className="text-2xl font-bold mb-3 text-foreground">{t('Stories from our community')}</h2>
          <p className="text-muted-foreground mb-12 max-w-2xl mx-auto text-base">
            {t('Real stories from volunteers and organisations who were able to make a difference')}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              { text: t('“I found the perfect opportunity nearby and contributed 100 hours!”'), author: 'Sofia', role: 'Volunteer' },
              { text: t('“Our organisation doubled its volunteer base through the platform.”'), author: 'Ahmed', role: 'Organization Lead' },
              { text: t('“A simple and intuitive way to organize events and track hours.”'), author: 'Priya', role: 'Event Coordinator' }
            ].map((tst, i) => (
              <div key={i} className="bg-card p-8 rounded-lg shadow-sm border border-border/50 text-left hover:shadow-md transition-all duration-300">
                <div className="text-lg font-semibold text-foreground mb-6 leading-relaxed">
                  {tst.text}
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-muted overflow-hidden flex items-center justify-center font-semibold text-primary text-base">
                    {tst.author[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">— {tst.author}</div>
                    <div className="text-sm text-muted-foreground">{tst.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick FAQ / Resources */}
      <section className="py-16 bg-muted/40 border-t border-border/50">
        <div className="container px-4 mx-auto text-center max-w-3xl">
          <h3 className="text-xl font-bold mb-3 text-foreground">{t('Questions?')}</h3>
          <p className="text-muted-foreground mb-8 text-base">
            {t('Check our Help Center or contact us if you need assistance getting started.')}
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/help">
              <Button variant="outline" className="h-11 rounded-lg px-6 font-semibold border-border/50 bg-card hover:bg-muted">{t('Help Center')}</Button>
            </Link>
            <Link to="/contact">
              <Button className="h-11 rounded-lg px-6 font-semibold shadow-sm">{t('Contact')}</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
