import { useState, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/atoms/use-toast';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Building2 } from 'lucide-react';

export default function OrganizationRegister() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    description: '',
    password: '',
    confirmPassword: ''
  });

  const navigate = useNavigate();

  const mutation = useMutation((data: any) => api.register(data), {
    onSuccess(response: any) {
      // Check if organization registration is pending approval
      if (response?.status === 'pending') {
        toast({
          title: 'Application Submitted Successfully',
          description: 'Your organization registration is under review. You will be notified once approved.'
        });
      } else {
        toast({
          title: 'Registration Successful',
          description: response?.message || 'Welcome! You can now log in.'
        });
      }
      navigate('/login');
    },
    onError(error: any) {
      toast({
        title: 'Registration failed',
        description: error?.response?.data?.error?.message || 'Something went wrong'
      });
    }
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast({ title: 'Passwords do not match' });
      return;
    }
    // Add org specific flag or data structure if needed by backend
    mutation.mutate({
      ...formData,
      role: 'organization' // Assuming backend handles role assignment
    });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Side - Form */}
      <div className="flex items-center justify-center p-8 bg-background overflow-y-auto">
        <div className="w-full max-w-lg space-y-8">
          <div className="text-center lg:text-left">
            <h1 className="text-4xl font-black tracking-tight text-foreground">{t('Register Organization')}</h1>
            <p className="text-muted-foreground mt-3 text-lg font-medium">
              {t('Partner with us to find volunteers and manage your events')}
            </p>
          </div>

          <form onSubmit={submit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="font-bold text-foreground/80 px-1">{t('Organization Name')}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('e.g. Green Earth Initiative')}
                required
                className="h-12 bg-card/50 border-border/50 rounded-xl focus:bg-card transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-bold text-foreground/80 px-1">{t('Email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@org.com"
                  required
                  className="h-12 bg-card/50 border-border/50 rounded-xl focus:bg-card transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="font-bold text-foreground/80 px-1">{t('Phone')}</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+123..."
                  required
                  className="h-12 bg-card/50 border-border/50 rounded-xl focus:bg-card transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="font-bold text-foreground/80 px-1">{t('Address')}</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder={t('123 Main St, City')}
                required
                className="h-12 bg-card/50 border-border/50 rounded-xl focus:bg-card transition-all"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="font-bold text-foreground/80 px-1">{t('Description')}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t('Tell us about your mission...')}
                rows={3}
                className="bg-card/50 border-border/50 rounded-xl focus:bg-card transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="font-bold text-foreground/80 px-1">{t('Password')}</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="h-12 bg-card/50 border-border/50 rounded-xl focus:bg-card transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="font-bold text-foreground/80 px-1">{t('Confirm Password')}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  className="h-12 bg-card/50 border-border/50 rounded-xl focus:bg-card transition-all"
                />
              </div>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 space-y-3">
              <h4 className="font-black text-primary text-sm uppercase tracking-widest">{t('What happens next?')}</h4>
              <ul className="text-sm text-foreground/70 space-y-2 font-medium">
                <li className="flex gap-2">
                  <span className="text-primary font-black">•</span>
                  {t('Your application will be reviewed by our admin team')}
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-black">•</span>
                  {t("You'll receive an email notification once approved")}
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-black">•</span>
                  {t('After approval, you can upload compliance documents')}
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-black">•</span>
                  {t('Once compliance is verified, your organization will be fully activated')}
                </li>
              </ul>
            </div>

            <Button type="submit" className="w-full h-14 rounded-2xl shadow-xl shadow-primary/20 font-bold text-lg" disabled={mutation.isLoading}>
              {mutation.isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {t('Submitting...')}
                </>
              ) : (
                t('Submit Application')
              )}
            </Button>
          </form>

          <div className="text-center text-sm font-medium">
            {t('Already have an account?')}{' '}
            <Link to="/login" className="font-bold text-primary hover:underline underline-offset-4 decoration-2">
              {t('Sign in')}
            </Link>
          </div>
        </div>
      </div>

      {/* Right Side - Image/Visual */}
      <div className="hidden lg:block relative bg-primary overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/80 mix-blend-multiply z-10" />
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:30px_30px] z-10" />
        <img
          src="https://images.unsplash.com/photo-1559027615-cd4628902d4a?q=80&w=2074&auto=format&fit=crop"
          alt="Teamwork"
          className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
        />
        <div className="relative h-full flex flex-col justify-end p-16 text-white z-20">
          <div className="max-w-xl">
            <div className="flex items-center gap-5 mb-10">
              <div className="p-5 bg-white/10 backdrop-blur-md rounded-[1.5rem] border border-white/20 shadow-2xl">
                <Building2 className="h-10 w-10 text-white" />
              </div>
              <div>
                <h3 className="text-3xl font-black tracking-tight">{t('For Non-Profits & NGOs')}</h3>
                <p className="text-lg font-medium text-primary-foreground/80">{t('Manage volunteers, events, and impact.')}</p>
              </div>
            </div>
            <div className="w-16 h-1 w-primary-foreground/30 mb-8 rounded-full" />
            <blockquote className="space-y-6">
              <p className="text-3xl font-black leading-[1.3] tracking-tight italic">
                {t('“Alone we can do so little; together we can do so much.”')}
              </p>
              <footer className="flex items-center gap-4">
                <div className="h-0.5 w-8 bg-primary-foreground/50" />
                <span className="text-xl font-bold opacity-90">— Helen Keller</span>
              </footer>
            </blockquote>
          </div>
        </div>
      </div>
    </div>
  );
}
