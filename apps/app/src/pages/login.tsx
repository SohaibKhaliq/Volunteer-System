import React, { useState } from 'react';
import api from '@/lib/api';
import storage from '@/lib/storage';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/atoms/use-toast';
import { useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/lib/store';

export default function Login() {
  const [fingerprint, setFingerprint] = useState('');
  const { setToken } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const returnTo = params.get('returnTo') || '/';

  const mutation = useMutation((fp: string) => api.authenticate(fp), {
    onSuccess(data) {
      const token = data?.token?.token;
      if (token) {
        storage.setFingerprint(fingerprint);
        setToken(token);
        try {
          toast({ title: 'Signed in', description: 'Welcome back!' });
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
    }
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(fingerprint || null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full bg-white rounded shadow p-6">
        <h2 className="text-lg font-semibold mb-2">Login</h2>
        <p className="text-sm text-slate-600 mb-4">
          If you have a fingerprint you can authenticate here. For local testing try{' '}
          <code>admin-local-fingerprint</code>.
        </p>
        <form onSubmit={submit} className="grid gap-3">
          <Input value={fingerprint} onChange={(e) => setFingerprint(e.target.value)} placeholder="Fingerprint" />
          <div className="flex justify-between gap-2">
            <button type="submit" className="px-4 py-2 rounded bg-primary text-white">
              Authenticate
            </button>
            <button
              type="button"
              onClick={() => setFingerprint('admin-local-fingerprint')}
              className="px-4 py-2 rounded bg-slate-100"
            >
              Use Dev Fingerprint
            </button>
          </div>
        </form>
        {mutation.isError && <div className="mt-3 text-sm text-destructive">Authentication failed</div>}
      </div>
    </div>
  );
}
