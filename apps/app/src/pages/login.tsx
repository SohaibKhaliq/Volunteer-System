import React, { useState } from 'react';
import api from '@/lib/api';

import { Input } from '@/components/ui/input';
import { toast } from '@/components/atoms/use-toast';
import { useLocation, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/lib/store';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { setToken } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const returnTo = params.get('returnTo') || '/';

  const mutation = useMutation((credentials: any) => api.login(credentials), {
    onSuccess(data) {
      const token = data?.token?.token;
      if (token) {
        setToken(token);
        try {
          toast({ 
            title: 'Signed in', 
            description: 'Welcome back!',
            variant: 'success' 
          });
        } catch (e) {
          console.warn('Unable to show toast', e);
        }

        // sanitize return target — only allow relative paths
        let target = '/';
        try {
          const decoded = decodeURIComponent(returnTo);
          if (decoded.startsWith('/')) target = decoded;
        } catch (e) {
          // fallback to root
        }

        navigate(target);
      }
    },
    onError(error: any) {
      toast({
        title: 'Authentication failed',
        description: error?.response?.data?.error?.message || 'Invalid email or password',
        variant: 'destructive'
      });
    }
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full bg-white rounded shadow p-6">
        <h2 className="text-lg font-semibold mb-2">Login</h2>
        <p className="text-sm text-slate-600 mb-4">
          Sign in to your account
        </p>
        <form onSubmit={submit} className="grid gap-3">
          <Input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            placeholder="Email" 
            required
          />
          <Input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            placeholder="Password" 
            required
          />
          <div className="flex justify-between gap-2 items-center">
            <button type="submit" className="px-4 py-2 rounded bg-primary text-white w-full">
              Sign In
            </button>
          </div>
        </form>
        <div className="mt-4 text-center text-sm">
          Don't have an account? <Link to="/register" className="text-primary hover:underline">Sign up</Link>
        </div>
        {mutation.isError && <div className="mt-3 text-sm text-destructive">Authentication failed</div>}
      </div>
    </div>
  );
}
