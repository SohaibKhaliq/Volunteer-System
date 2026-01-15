import { useState, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/atoms/use-toast';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export default function Register() {
  const { t } = useTranslation();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { setToken, setUser } = useStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const mutation = useMutation((data: any) => api.register(data), {
    onSuccess(data) {
      const token = (data as any)?.token?.token;
      if (token) {
        setToken(token);

        // Update user in store if available in response
        const userData = (data as any)?.user;
        if (userData) {
          setUser(userData);
        }

        // Invalidate the 'me' query to force AppProvider to refetch user data
        queryClient.invalidateQueries(['me']);

        try {
          toast({ title: 'Account created!', description: 'Welcome to Local Aid.' });
        } catch (e) { }
        navigate('/');
      } else {
        // maybe email verification required?
        toast({ title: 'Registration successful', description: 'Please check your email to verify your account.' });
        navigate('/login');
      }
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
    mutation.mutate({ firstName, lastName, email, password });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Side - Form */}
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">{t('Create an account')}</h1>
            <p className="text-muted-foreground mt-3 text-lg font-medium">
              {t('Join our community of volunteers today')}
            </p>
          </div>

          <form onSubmit={submit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">{t('First name')}</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  required
                  className="h-12 bg-slate-50 dark:bg-slate-900 border-border/50 rounded-lg focus:bg-background transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">{t('Last name')}</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  required
                  className="h-12 bg-slate-50 dark:bg-slate-900 border-border/50 rounded-lg focus:bg-background transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">{t('Email')}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="h-12 bg-slate-50 dark:bg-slate-900 border-border/50 rounded-lg focus:bg-background transition-all"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">{t('Password')}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('Create a password')}
                required
                className="h-12 bg-slate-50 dark:bg-slate-900 border-border/50 rounded-lg focus:bg-background transition-all"
              />
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                {t('Must be at least 8 characters long')}
              </p>
            </div>

            <Button type="submit" className="w-full h-14 rounded-md shadow-xl shadow-primary/20 font-bold text-lg" disabled={mutation.isLoading}>
              {mutation.isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {t('Creating account...')}
                </>
              ) : (
                t('Create Account')
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
          src="https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=2070&auto=format&fit=crop"
          alt="Community support"
          className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
        />
        <div className="relative h-full flex flex-col justify-end p-16 text-white z-20">
          <div className="max-w-xl">
            <div className="w-16 h-1 w-primary-foreground/30 mb-8 rounded-full" />
            <blockquote className="space-y-6">
              <p className="text-3xl font-bold leading-[1.3] tracking-tight italic">
                {t('“The best way to find yourself is to lose yourself in the service of others.”')}
              </p>
              <footer className="flex items-center gap-4">
                <div className="h-0.5 w-8 bg-primary-foreground/50" />
                <span className="text-xl font-bold opacity-90">— Mahatma Gandhi</span>
              </footer>
            </blockquote>
          </div>
        </div>
      </div>
    </div>
  );
}
