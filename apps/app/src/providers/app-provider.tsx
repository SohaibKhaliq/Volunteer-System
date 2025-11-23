import api from '@/lib/api';
import { useStore } from '@/lib/store';
import { useQuery } from '@tanstack/react-query';
import { createContext, useContext, useEffect, useState } from 'react';
import { toast } from '@/components/atoms/use-toast';
import { useLocation, useNavigate } from 'react-router-dom';

type AppProviderProps = {
  children: React.ReactNode;
};

type AppProviderState = {
  showBackButton: boolean;
  authenticated: boolean;
  user?: any;
};

const initialState: AppProviderState = {
  showBackButton: false,
  authenticated: false
};

const AppProviderContext = createContext<AppProviderState | undefined>(undefined);

export default function AppProvider({ children }: AppProviderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showBackButton, setShowBackButton] = useState(location.pathname !== '/');

  const { token, setToken } = useStore();

  const { data: me, isLoading: isLoadingMe } = useQuery({
    queryKey: ['me'],
    queryFn: api.getCurrentUser,
    enabled: !!token, // only run when token exists
    retry: false,
    onError: (error: any) => {
      const status = error?.response?.status;

      if (status === 401) {
        setToken('');
        toast({
          title: 'Session expired',
          description: 'Please sign in again.'
        });

        const returnTo = encodeURIComponent(window.location.pathname + window.location.search + window.location.hash);

        navigate(`/login?returnTo=${returnTo}`, { replace: true });
      }
    }
  });

  const value: AppProviderState = {
    showBackButton,
    authenticated: !!token,
    user: me?.data ?? me // supports Axios or direct JSON
  };

  useEffect(() => {
    setShowBackButton(location.pathname !== '/');
  }, [location]);

  if (isLoadingMe && token) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return <AppProviderContext.Provider value={value}>{children}</AppProviderContext.Provider>;
}

export const useApp = () => {
  const context = useContext(AppProviderContext);
  if (!context) {
    throw new Error('useApp must be used inside <AppProvider>');
  }
  return context;
};
