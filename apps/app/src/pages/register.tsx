import { useState, FormEvent } from 'react';
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
        } catch (e) {}
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
            <h1 className="text-3xl font-bold tracking-tight">Create an account</h1>
            <p className="text-muted-foreground mt-2">Join our community of volunteers today</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  required
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  required
                  className="h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                required
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">Must be at least 8 characters long</p>
            </div>

            <Button type="submit" className="w-full h-11" disabled={mutation.isLoading}>
              {mutation.isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          <div className="text-center text-sm">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>

      {/* Right Side - Image/Visual */}
      <div className="hidden lg:block relative bg-slate-900">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-slate-900/60 mix-blend-multiply" />
        <img
          src="https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=2070&auto=format&fit=crop"
          alt="Community support"
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />
        <div className="relative h-full flex flex-col justify-end p-12 text-white">
          <blockquote className="space-y-2">
            <p className="text-lg font-medium leading-relaxed">
              The best way to find yourself is to lose yourself in the service of others.
            </p>
            <footer className="text-sm opacity-80">— Mahatma Gandhi</footer>
          </blockquote>
        </div>
      </div>
    </div>
  );
}
