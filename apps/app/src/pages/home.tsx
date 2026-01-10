import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight, Heart, Users, Calendar, MapPin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';


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
      <section className="relative min-h-[700px] flex items-center justify-center bg-primary text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/80 z-10" />
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:40px_40px] z-10" />
        <img
          src="https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=2070&auto=format&fit=crop"
          alt="Volunteers in action"
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-50"
        />
        <div className="container relative z-20 px-4 text-center md:text-left">
          <div className="max-w-4xl">
            <h1 className="text-5xl md:text-7xl font-black mb-8 leading-[1.1] tracking-tight">
              {t('Make a Difference in Your Community Today')}
            </h1>
            <p className="text-xl md:text-2xl text-primary-foreground/90 mb-10 max-w-2xl leading-relaxed font-medium">
              {t(
                'Join thousands of volunteers connecting with organizations to create meaningful change. Find opportunities that match your skills and passion.'
              )}
            </p>
            <div className="flex flex-col sm:flex-row gap-5">
              <Link to="/map">
                <Button size="lg" className="w-full sm:w-auto h-16 text-xl px-10 rounded-2xl shadow-2xl shadow-black/20 font-bold bg-white text-primary hover:bg-white/90">
                  {t('Find Opportunities')} <ArrowRight className="ml-2 h-6 w-6" />
                </Button>
              </Link>
              <Link to="/organizations">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto h-16 text-xl px-10 rounded-2xl border-2 border-white/30 bg-white/10 hover:bg-white/20 text-white font-bold backdrop-blur-md"
                >
                  {t('For Organizations')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-background relative z-30">
        <div className="container px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { label: t('Active Volunteers'), value: stats?.activeVolunteers, fallback: '5,000+', icon: Users, color: 'text-blue-500' },
              { label: t('Hours Contributed'), value: stats?.hoursContributed, fallback: '12,000+', icon: Heart, color: 'text-rose-500' },
              { label: t('Partner Organizations'), value: stats?.partnerOrganizations, fallback: '150+', icon: MapPin, color: 'text-emerald-500' }
            ].map((stat, i) => (
              <div key={i} className="bg-card p-10 rounded-[2.5rem] border border-border/50 shadow-sm hover:shadow-xl transition-all duration-500 text-center group">
                <div className={`w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform ${stat.color}`}>
                  <stat.icon className="h-8 w-8" />
                </div>
                <div className="text-5xl font-black text-foreground mb-3 tracking-tight">
                  {isLoadingStats ? '...' : (stat.value?.toLocaleString() || stat.fallback)}
                </div>
                <div className="text-muted-foreground font-bold uppercase tracking-widest text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-muted/30">
        <div className="container px-4">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight text-foreground">{t('How It Works')}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg font-medium">
              {t('Getting started is easy. Follow these simple steps to begin your volunteering journey.')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { i: 1, title: t('Create an Account'), desc: t('Sign up in seconds. Complete your profile to highlight your skills and interests.'), icon: Users, color: 'bg-blue-500/10 text-blue-500' },
              { i: 2, title: t('Find Opportunities'), desc: t('Browse local events and tasks. Filter by cause, location, and schedule to find the perfect match.'), icon: MapPin, color: 'bg-orange-500/10 text-orange-500' },
              { i: 3, title: t('Make an Impact'), desc: t('Join the event, track your hours, and see the difference you make in your community.'), icon: Heart, color: 'bg-rose-500/10 text-rose-500' }
            ].map((step) => (
              <div key={step.i} className="bg-card p-10 rounded-[2.5rem] shadow-sm hover:shadow-2xl transition-all duration-500 border border-border/30 group">
                <div className={`w-16 h-16 ${step.color} rounded-2xl flex items-center justify-center mb-8 group-hover:rotate-12 transition-transform`}>
                  <step.icon className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-black mb-4 text-foreground">{step.i}. {step.title}</h3>
                <p className="text-muted-foreground leading-relaxed font-medium">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Opportunities */}
      <section className="py-24 bg-background">
        <div className="container px-4">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div className="space-y-2">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">{t('Featured Opportunities')}</h2>
              <p className="text-muted-foreground text-lg font-medium">{t('Discover urgent needs and popular events near you.')}</p>
            </div>
            <Link to="/map">
              <Button variant="outline" className="h-12 rounded-xl px-6 font-bold border-border/50 hover:bg-muted transition-colors">
                {t('View All Opportunities')} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {isLoading
              ? [1, 2, 3].map((i) => (
                <div key={i} className="bg-card rounded-[2.5rem] overflow-hidden h-[450px] border border-border/50 animate-pulse" />
              ))
              : featuredEvents?.slice(0, 3).map((event: any) => (
                <div
                  key={event.id}
                  className="group bg-card rounded-[2.5rem] overflow-hidden border border-border/50 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500"
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
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />
                    {event.isUrgent && (
                      <div className="absolute top-4 right-4 bg-destructive text-destructive-foreground px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg">
                        {t('Urgent')}
                      </div>
                    )}
                  </div>
                  <div className="p-8">
                    <div className="text-xs font-black uppercase tracking-widest text-primary mb-3">{event.type || 'Community Service'}</div>
                    <h3 className="text-2xl font-black mb-3 text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                      {event.title}
                    </h3>
                    <p className="text-muted-foreground font-medium text-sm mb-8 line-clamp-2 leading-relaxed">
                      {event.description}
                    </p>
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex -space-x-2">
                        <div className="h-8 w-8 rounded-full border-2 border-card bg-muted flex items-center justify-center text-[10px] font-bold">+12</div>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground">
                        <span className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1.5 rounded-lg border border-border/50">
                          <Calendar className="h-3.5 w-3.5 text-primary/70" />
                          {new Date(event.startAt || event.date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Link to={`/events/${event.id}`} className="block mt-8">
                      <Button className="w-full h-12 rounded-xl font-bold transition-all shadow-lg shadow-primary/5 group-hover:shadow-primary/20">
                        {t('View Details')}
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:30px_30px]" />
        <div className="container px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-black mb-8 tracking-tight">{t('Ready to Start Your Journey?')}</h2>
          <p className="text-xl text-primary-foreground/90 mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
            {t('Whether you want to volunteer or need help organizing volunteers, Local Aid is the platform for you.')}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Link to="/register">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto h-16 text-xl px-10 rounded-2xl font-bold shadow-2xl shadow-black/20">
                {t('Join as Volunteer')}
              </Button>
            </Link>
            <Link to="/organizations/register">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto h-16 text-xl px-10 rounded-2xl border-2 border-white/30 bg-white/10 hover:bg-white/20 text-white font-bold backdrop-blur-md"
              >
                {t('Register Organization')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section className="py-24 bg-muted/20">
        <div className="container px-4 mx-auto text-center">
          <h2 className="text-3xl font-black mb-4 tracking-tight text-foreground">{t('Our Partners')}</h2>
          <p className="text-muted-foreground mb-12 max-w-2xl mx-auto text-lg font-medium">
            {t('We work with organisations large and small to deliver local impact')}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center max-w-5xl mx-auto">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="group p-8 bg-card rounded-[2rem] shadow-sm border border-border/50 flex items-center justify-center h-40 hover:shadow-xl transition-all duration-500">
                <img src={`/partners/partner-${i}.svg`} alt={`Partner ${i}`} className="h-16 opacity-60 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-background border-t border-border/50">
        <div className="container px-4 mx-auto text-center">
          <h2 className="text-3xl font-black mb-4 tracking-tight text-foreground">{t('Stories from our community')}</h2>
          <p className="text-muted-foreground mb-16 max-w-2xl mx-auto text-lg font-medium">
            {t('Real stories from volunteers and organisations who were able to make a difference')}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              { text: t('“I found the perfect opportunity nearby and contributed 100 hours!”'), author: 'Sofia', role: 'Volunteer' },
              { text: t('“Our organisation doubled its volunteer base through the platform.”'), author: 'Ahmed', role: 'Organization Lead' },
              { text: t('“A simple and intuitive way to organize events and track hours.”'), author: 'Priya', role: 'Event Coordinator' }
            ].map((tst, i) => (
              <div key={i} className="bg-card p-10 rounded-[2.5rem] shadow-sm border border-border/50 text-left hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 group">
                <div className="text-xl font-black text-foreground mb-8 leading-relaxed group-hover:text-primary transition-colors">
                  {tst.text}
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-muted overflow-hidden flex items-center justify-center font-black text-primary text-xl">
                    {tst.author[0]}
                  </div>
                  <div>
                    <div className="font-black text-foreground">— {tst.author}</div>
                    <div className="text-sm text-muted-foreground font-medium">{tst.role}</div>
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
          <h3 className="text-2xl font-black mb-4 text-foreground tracking-tight">{t('Questions?')}</h3>
          <p className="text-muted-foreground mb-10 text-lg font-medium">
            {t('Check our Help Center or contact us if you need assistance getting started.')}
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/help">
              <Button variant="outline" className="h-12 rounded-xl px-8 font-bold border-border/50 bg-card hover:bg-muted">{t('Help Center')}</Button>
            </Link>
            <Link to="/contact">
              <Button className="h-12 rounded-xl px-8 font-bold shadow-lg shadow-primary/10">{t('Contact')}</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
