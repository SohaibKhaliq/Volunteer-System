import { useState, useEffect, FormEvent } from 'react';
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
            <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-muted-foreground mt-2">Enter your credentials to access your account</p>
          </div>

          <form onSubmit={submit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link to="/forgot-password" className="text-sm font-medium text-primary hover:underline">
                  Forgot password?
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
                className="h-11"
              />
            </div>

            <Button type="submit" className="w-full h-11" disabled={mutation.isLoading}>
              {mutation.isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <div className="text-center text-sm">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-medium text-primary hover:underline">
              Sign up for free
            </Link>
          </div>
        </div>
      </div>

      {/* Right Side - Image/Visual */}
      <div className="hidden lg:block relative bg-slate-900">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-slate-900/60 mix-blend-multiply" />
        <img
          src="https://images.unsplash.com/photo-1559027615-cd4628902d4a?q=80&w=2074&auto=format&fit=crop"
          alt="Volunteers working together"
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />
        <div className="relative h-full flex flex-col justify-end p-12 text-white">
          <blockquote className="space-y-2">
            <p className="text-lg font-medium leading-relaxed">
              Volunteering is at the very core of being a human. No one has made it through life without someone
              else&apos;s help.
            </p>
            <footer className="text-sm opacity-80">— Heather French Henry</footer>
          </blockquote>
        </div>
      </div>
    </div>
  );
}
