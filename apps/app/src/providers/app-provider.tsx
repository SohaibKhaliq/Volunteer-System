import api from '@/lib/api';
import { useStore } from '@/lib/store';
import { useQuery } from '@tanstack/react-query';
import { createContext, useContext, useEffect, useState } from 'react';
import { toast } from '@/components/atoms/use-toast';
import { useLocation } from 'react-router-dom';

type AppProviderProps = {
  children: React.ReactNode;
};

type AppProviderState = {
  showBackButton: boolean;
  authenticated?: boolean;
  user?: any;
};

const initialState: AppProviderState = {
  showBackButton: false,
  authenticated: false
};

const AppProviderContext = createContext<AppProviderState>(initialState);

export default function AppProvider({ children }: AppProviderProps) {
  const location = useLocation();
  const [showBackButton, setShowBackButton] = useState(location.pathname !== '/');
  const { token, setToken } = useStore();

  const { data: me, isLoading: isLoadingMe } = useQuery({
    queryKey: ['me'],
    queryFn: api.getCurrentUser,
    enabled: !!token,
    retry: false,
    suspense: false,
    onError: (err: any) => {
      // If the me endpoint returns 401, clear token and redirect to login
      const status = err?.response?.status;
      if (status === 401) {
        setToken('');
        try {
          toast({ title: 'Session expired', description: 'Please sign in again.' });
        } catch (e) {
          console.warn('Unable to show toast', e);
        }

        if (typeof window !== 'undefined') {
          const returnTo = encodeURIComponent(window.location.pathname + window.location.search + window.location.hash);
          window.location.href = `/login?returnTo=${returnTo}`;
        }
      }
    }
  });

  const value = {
    showBackButton,
    authenticated: !!token,
    user: me
  };

  useEffect(() => {
    setShowBackButton(location.pathname !== '/');
  }, [location]);

  if (isLoadingMe && !!token) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  return <AppProviderContext.Provider value={value}>{children}</AppProviderContext.Provider>;
}

export const useApp = () => {
  const context = useContext(AppProviderContext);
  if (context === undefined) throw new Error('useApp must be used within a AppProvider');

  return context;
};
