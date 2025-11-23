import React, { useState } from 'react';
import api from '@/lib/api';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/atoms/use-toast';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/lib/store';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  
  const { setToken } = useStore();
  const navigate = useNavigate();

  const mutation = useMutation((data: any) => api.register(data), {
    onSuccess(data) {
      const token = data?.token?.token;
      if (token) {
        setToken(token);
        try {
          toast({ 
            title: 'Account created', 
            description: 'Welcome!',
            variant: 'success'
          });
        } catch (e) {
          console.warn('Unable to show toast', e);
        }
        navigate('/');
      }
    },
    onError(error: any) {
      toast({
        title: 'Registration failed',
        description: error?.response?.data?.error?.message || 'Unable to create account',
        variant: 'destructive'
      });
    }
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ email, password, firstName, lastName });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full bg-white rounded shadow p-6">
        <h2 className="text-lg font-semibold mb-2">Sign Up</h2>
        <p className="text-sm text-slate-600 mb-4">
          Create a new account
        </p>
        <form onSubmit={submit} className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Input 
              value={firstName} 
              onChange={(e) => setFirstName(e.target.value)} 
              placeholder="First Name" 
            />
            <Input 
              value={lastName} 
              onChange={(e) => setLastName(e.target.value)} 
              placeholder="Last Name" 
            />
          </div>
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
            minLength={8}
          />
          <div className="flex justify-between gap-2 items-center">
            <button type="submit" className="px-4 py-2 rounded bg-primary text-white w-full">
              Sign Up
            </button>
          </div>
        </form>
        <div className="mt-4 text-center text-sm">
          Already have an account? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
        </div>
        {mutation.isError && <div className="mt-3 text-sm text-destructive">Registration failed</div>}
      </div>
    </div>
  );
}
