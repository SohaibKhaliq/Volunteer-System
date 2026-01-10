import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import api from '@/lib/api';

const Contact = () => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      email: formData.get('email'),
      subject: formData.get('subject'),
      message: formData.get('message')
    };

    try {
      await api.contact(data);
      toast.success(t('Message sent successfully! We will get back to you soon.'));
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      toast.error(t('Failed to send message. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <section className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-white py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        <div className="container px-4 text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6">{t('Contact Us')}</h1>
          <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto font-medium">
            {t("Have questions or feedback? We'd love to hear from you.")}
          </p>
        </div>
      </section>

      <section className="py-16 -mt-16 relative z-20">
        <div className="container px-4">
          <div className="bg-card rounded-3xl shadow-2xl shadow-primary/5 overflow-hidden flex flex-col md:flex-row max-w-6xl mx-auto border border-border/50">
            {/* Contact Info */}
            <div className="bg-primary/5 dark:bg-primary/10 p-10 md:w-2/5 flex flex-col justify-between border-b md:border-b-0 md:border-r border-border/50">
              <div>
                <h2 className="text-3xl font-black tracking-tight text-foreground mb-6">{t('Get in Touch')}</h2>
                <p className="text-muted-foreground mb-10 font-medium">
                  {t('Fill out the form and our team will get back to you within 24 hours.')}
                </p>

                <div className="space-y-8">
                  <div className="flex items-start gap-4 group">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <Mail className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground mb-1">{t('Email')}</h3>
                      <p className="text-muted-foreground text-sm font-medium">support@Local Aid.com</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 group">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <Phone className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground mb-1">{t('Phone')}</h3>
                      <p className="text-muted-foreground text-sm font-medium">+1 (555) 123-4567</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 group">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <MapPin className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground mb-1">{t('Office')}</h3>
                      <p className="text-muted-foreground text-sm font-medium leading-relaxed">
                        123 Volunteer Way
                        <br />
                        San Francisco, CA 94105
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-12 flex gap-4">
                {/* Social icons placeholder */}
                <div className="w-12 h-12 bg-primary/5 border border-primary/20 rounded-2xl flex items-center justify-center hover:bg-primary/20 cursor-pointer transition-all hover:scale-110 text-primary">
                  <span className="sr-only">Facebook</span>
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.791-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </div>
                <div className="w-12 h-12 bg-primary/5 border border-primary/20 rounded-2xl flex items-center justify-center hover:bg-primary/20 cursor-pointer transition-all hover:scale-110 text-primary">
                  <span className="sr-only">Twitter</span>
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.84 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="p-10 md:w-3/5">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label htmlFor="firstName" className="text-sm font-bold text-foreground/80 px-1">
                      {t('First Name')}
                    </label>
                    <Input id="firstName" name="firstName" required placeholder="John" className="h-12 bg-card/50 border-border/50 rounded-xl focus:bg-card transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="lastName" className="text-sm font-bold text-foreground/80 px-1">
                      {t('Last Name')}
                    </label>
                    <Input id="lastName" name="lastName" required placeholder="Doe" className="h-12 bg-card/50 border-border/50 rounded-xl focus:bg-card transition-all" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-bold text-foreground/80 px-1">
                    {t('Email Address')}
                  </label>
                  <Input id="email" name="email" type="email" required placeholder="john@example.com" className="h-12 bg-card/50 border-border/50 rounded-xl focus:bg-card transition-all" />
                </div>

                <div className="space-y-2">
                  <label htmlFor="subject" className="text-sm font-bold text-foreground/80 px-1">
                    {t('Subject')}
                  </label>
                  <Input id="subject" name="subject" required placeholder={t('How can we help?')} className="h-12 bg-card/50 border-border/50 rounded-xl focus:bg-card transition-all" />
                </div>

                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-bold text-foreground/80 px-1">
                    {t('Message')}
                  </label>
                  <Textarea
                    id="message"
                    name="message"
                    required
                    placeholder={t('Tell us more about your inquiry...')}
                    className="min-h-[160px] bg-card/50 border-border/50 rounded-2xl focus:bg-card transition-all p-4"
                  />
                </div>

                <Button type="submit" className="w-full h-14 rounded-2xl shadow-xl shadow-primary/20 font-bold text-lg" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      {t('Sending...')}
                    </span>
                  ) : (
                    <>
                      {t('Send Message')} <Send className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
