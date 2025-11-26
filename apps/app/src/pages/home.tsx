import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight, Heart, Users, Calendar, MapPin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

const Home = () => {
  const { t } = useTranslation();
  const { data: featuredEvents, isLoading } = useQuery(['featured-events'], () => api.listEvents() as unknown as Promise<any[]>);
  const { data: stats, isLoading: isLoadingStats } = useQuery(['public-stats'], () => api.getReportsOverview() as unknown as Promise<any>);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center bg-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 to-slate-900/40 z-10" />
        <img 
          src="https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=2070&auto=format&fit=crop" 
          alt="Volunteers in action" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="container relative z-20 px-4 text-center md:text-left">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight max-w-3xl">
            {t('Make a Difference in Your Community Today')}
          </h1>
          <p className="text-lg md:text-xl text-slate-200 mb-8 max-w-2xl">
            {t('Join thousands of volunteers connecting with organizations to create meaningful change. Find opportunities that match your skills and passion.')}
          </p>
          <div className="flex flex-col md:flex-row gap-4">
            <Link to="/map">
              <Button size="lg" className="w-full md:w-auto text-lg px-8 py-6">
                {t('Find Opportunities')} <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/organizations">
              <Button size="lg" variant="outline" className="w-full md:w-auto text-lg px-8 py-6 bg-white/10 hover:bg-white/20 border-white/20 text-white">
                {t('For Organizations')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white border-b">
        <div className="container px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-6">
              <div className="text-4xl font-bold text-primary mb-2">
                {isLoadingStats ? '...' : (stats?.volunteers?.total || '5,000+')}
              </div>
              <div className="text-muted-foreground">{t('Active Volunteers')}</div>
            </div>
            <div className="p-6 border-l-0 md:border-l border-r-0 md:border-r">
              <div className="text-4xl font-bold text-primary mb-2">
                {isLoadingStats ? '...' : (stats?.hours?.total || '12,000+')}
              </div>
              <div className="text-muted-foreground">{t('Hours Contributed')}</div>
            </div>
            <div className="p-6">
              <div className="text-4xl font-bold text-primary mb-2">
                {isLoadingStats ? '...' : (stats?.organizations?.total || '150+')}
              </div>
              <div className="text-muted-foreground">{t('Partner Organizations')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-slate-50">
        <div className="container px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">{t('How It Works')}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('Getting started is easy. Follow these simple steps to begin your volunteering journey.')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-6">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{t('1. Create an Account')}</h3>
              <p className="text-muted-foreground">
                {t('Sign up in seconds. Complete your profile to highlight your skills and interests.')}
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-6">
                <MapPin className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{t('2. Find Opportunities')}</h3>
              <p className="text-muted-foreground">
                {t('Browse local events and tasks. Filter by cause, location, and schedule to find the perfect match.')}
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 mb-6">
                <Heart className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{t('3. Make an Impact')}</h3>
              <p className="text-muted-foreground">
                {t('Join the event, track your hours, and see the difference you make in your community.')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Opportunities (Placeholder for dynamic content) */}
      <section className="py-20 bg-white">
        <div className="container px-4">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold mb-4">{t('Featured Opportunities')}</h2>
              <p className="text-muted-foreground">
                {t('Discover urgent needs and popular events near you.')}
              </p>
            </div>
            <Link to="/map">
              <Button variant="ghost" className="hidden md:flex">
                {t('View All')} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              // Loading skeletons
              [1, 2, 3].map((i) => (
                <div key={i} className="border rounded-lg overflow-hidden h-[400px] bg-slate-100 animate-pulse" />
              ))
            ) : (
              featuredEvents?.slice(0, 3).map((event: any) => (
                <div key={event.id} className="group border rounded-lg overflow-hidden hover:shadow-lg transition-all">
                  <div className="h-48 bg-slate-200 relative">
                    <img 
                      src={event.image || `https://images.unsplash.com/photo-${event.id % 2 === 0 ? '1559027615-cd4628902d4a' : '1593113598332-cd288d649433'}?q=80&w=800&auto=format&fit=crop`}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {event.isUrgent && (
                      <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full text-xs font-medium shadow-sm">
                        Urgent
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="text-sm text-primary font-medium mb-2">{event.type || 'Community Service'}</div>
                    <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                      {event.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                      {event.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-slate-500 mb-6">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(event.startAt || event.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{event.location || 'TBD'}</span>
                      </div>
                    </div>
                    <Link to={`/events/${event.id}`}>
                      <Button className="w-full">{t('View Details')}</Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="mt-8 text-center md:hidden">
            <Link to="/map">
              <Button variant="outline" className="w-full">
                {t('View All Opportunities')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-white">
        <div className="container px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            {t('Ready to Start Your Journey?')}
          </h2>
          <p className="text-lg text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            {t('Whether you want to volunteer or need help organizing volunteers, Eghata is the platform for you.')}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/register">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto text-lg px-8">
                {t('Join as Volunteer')}
              </Button>
            </Link>
            <Link to="/organizations/register">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 bg-transparent border-white text-white hover:bg-white hover:text-primary">
                {t('Register Organization')}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
