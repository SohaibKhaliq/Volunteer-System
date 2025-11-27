import { useTranslation } from 'react-i18next';
import { Users, Heart, Shield, Globe } from 'lucide-react';

const About = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="bg-primary text-white py-20">
        <div className="container px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">{t('About Local Aid')}</h1>
          <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto">
            {t('Empowering communities through seamless volunteer management and meaningful connections.')}
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 bg-white">
        <div className="container px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6 text-slate-900">{t('Our Mission')}</h2>
              <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                {t(
                  'At Local Aid, we believe that everyone has the power to make a difference. Our platform bridges the gap between passionate volunteers and organizations that need their help.'
                )}
              </p>
              <p className="text-lg text-slate-600 leading-relaxed">
                {t(
                  'We strive to simplify the volunteering process, making it easier for organizations to manage their workforce and for individuals to find opportunities that align with their values and skills.'
                )}
              </p>
            </div>
            <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-xl">
              <img
                src="https://images.unsplash.com/photo-1559027615-cd4628902d4a?q=80&w=2074&auto=format&fit=crop"
                alt="Volunteers working together"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-slate-50">
        <div className="container px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">{t('Our Core Values')}</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              {t('These principles guide everything we do, from product development to community support.')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Users, title: 'Community', desc: 'Building strong connections between people.' },
              { icon: Heart, title: 'Compassion', desc: 'Driven by a desire to help others.' },
              { icon: Shield, title: 'Trust', desc: 'Creating a safe and reliable environment.' },
              { icon: Globe, title: 'Impact', desc: 'Focusing on tangible, positive change.' }
            ].map((item, i) => (
              <div key={i} className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-all text-center">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{t(item.title)}</h3>
                <p className="text-slate-600">{t(item.desc)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section (Placeholder) */}
      <section className="py-16 bg-white">
        <div className="container px-4 text-center">
          <h2 className="text-3xl font-bold mb-12">{t('Meet the Team')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[1, 2, 3].map((i) => (
              <div key={i} className="group">
                <div className="w-48 h-48 bg-slate-200 rounded-full mx-auto mb-6 overflow-hidden">
                  <img
                    src={`https://i.pravatar.cc/300?img=${i + 10}`}
                    alt="Team Member"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                  />
                </div>
                <h3 className="text-xl font-semibold mb-1">
                  {i === 1 ? 'Sarah Johnson' : i === 2 ? 'Michael Chen' : 'Amira Ahmed'}
                </h3>
                <p className="text-primary font-medium mb-2">
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
