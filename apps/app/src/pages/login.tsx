import { useState, useEffect, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/atoms/use-toast';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export default function Login() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { setToken, setUser } = useStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const returnTo = params.get('returnTo') || '/';

  // If we're already authenticated (token present), redirect away from the login page
  const { token } = useStore();
  useEffect(() => {
    if (token) {
      let target = '/';
      try {
        const decoded = decodeURIComponent(returnTo);
        if (decoded.startsWith('/')) target = decoded;
      } catch (e) {
        // fallback to root
      }
      navigate(target, { replace: true });
    }
  }, [token, returnTo, navigate]);

  const mutation = useMutation((credentials: any) => api.login(credentials), {
    async onSuccess(data) {
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
          toast({ title: 'Welcome back!', description: 'You have successfully signed in.' });
        } catch (e) {
          console.warn('Unable to show toast', e);
        }

        // Determine redirect target. Prefer explicit returnTo param when valid.
        let target = '/';
        try {
          const decoded = decodeURIComponent(returnTo);
          if (decoded.startsWith('/')) target = decoded;
        } catch (e) {
          // fallback to root
        }

        // If response didn't include user data, fetch current user to determine role
        let currentUser = userData;
        try {
          if (!currentUser) {
            const meRes = await api.getCurrentUser();
            currentUser = (meRes as any)?.data ?? meRes;
          }
        } catch (e) {
          // ignore - proceed with default target
        }

        // If user is organization admin and no explicit returnTo provided, send to /organization
        try {
          const isOrgAdmin = !!(
            currentUser &&
            Array.isArray(currentUser.organizations) &&
            currentUser.organizations.some((org: any) => {
              const role = org.role || org.pivot?.role;
              return ['admin', 'Admin', 'owner', 'Owner', 'manager', 'Manager'].includes(role);
            })
          );

          if (isOrgAdmin && (returnTo === '/' || !returnTo)) {
            target = '/organization';
          }
        } catch (e) {
          // ignore and fallback to previously determined target
        }

        navigate(target);
      }
    },
    onError(error: any) {
      toast({
        title: 'Authentication failed',
        description: error?.response?.data?.error?.message || 'Invalid email or password'
      });
    }
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    mutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Side - Form */}
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">{t('Welcome back')}</h1>
            <p className="text-muted-foreground mt-3 text-lg font-medium">
              {t('Enter your credentials to access your account')}
            </p>
          </div>

          <form onSubmit={submit} className="space-y-6">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1"
              >
                {t('Email')}
              </Label>
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
              <div className="flex items-center justify-between px-1">
                <Label
                  htmlFor="password"
                  className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1"
                >
                  {t('Password')}
                </Label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-bold text-primary hover:underline underline-offset-4 uppercase tracking-wider self-center"
                >
                  {t('Forgot password?')}
                </Link>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="h-12 bg-slate-50 dark:bg-slate-900 border-border/50 rounded-lg focus:bg-background transition-all"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-14 rounded-md shadow-xl shadow-primary/20 font-bold text-lg"
              disabled={mutation.isLoading}
            >
              {mutation.isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {t('Signing in...')}
                </>
              ) : (
                t('Sign In')
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs font-bold uppercase tracking-widest">
              <span className="bg-background px-4 text-muted-foreground">{t('Or continue with')}</span>
            </div>
          </div>

          <div className="text-center text-sm font-medium">
            {t("Don't have an account?")}{' '}
            <Link to="/register" className="font-bold text-primary hover:underline underline-offset-4 decoration-2">
              {t('Sign up for free')}
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
          alt="Volunteers working together"
          className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
        />
        <div className="relative h-full flex flex-col justify-end p-16 text-white z-20">
          <div className="max-w-xl">
            <div className="w-16 h-1 w-primary-foreground/30 mb-8 rounded-full" />
            <blockquote className="space-y-6">
              <p className="text-3xl font-bold leading-[1.3] tracking-tight italic">
                {t(
                  "“Volunteering is at the very core of being a human. No one has made it through life without someone else's help.”"
                )}
              </p>
              <footer className="flex items-center gap-4">
                <div className="h-0.5 w-8 bg-primary-foreground/50" />
                <span className="text-xl font-bold opacity-90">— Heather French Henry</span>
              </footer>
            </blockquote>
          </div>
        </div>
      </div>
    </div>
  );
}
