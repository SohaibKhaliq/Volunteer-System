import api from '@/lib/api';
import { useStore } from '@/lib/store';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { toast } from '@/components/atoms/use-toast';
import { useLocation, useNavigate } from 'react-router-dom';

type AppProviderProps = {
  children: ReactNode;
};

type AppProviderState = {
  showBackButton: boolean;
  authenticated: boolean;
  user?: any;
  settings?: any[];
};

const AppProviderContext = createContext<AppProviderState | undefined>(undefined);

export default function AppProvider({ children }: AppProviderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showBackButton, setShowBackButton] = useState(location.pathname !== '/');

  const { token, setToken } = useStore();

  const queryClient = useQueryClient();

  const { data: me, isLoading: isLoadingMe } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.getCurrentUser(),
    enabled: !!token, // only run when token exists
    retry: false,
    onSuccess: () => {
      // Refresh notification list after retrieving /me — this ensures
      // any achievements auto-awarded by the backend show up in the UI quickly.
      try {
        queryClient.invalidateQueries(['notifications']);
      } catch (e) { }
    },
    onError: (error: any) => {
      const status = error?.response?.status;

      if (status === 401) {
        setToken('');

        // List of public routes that don't require authentication
        const publicRoutes = [
          '/',
          '/map',
          '/organizations',
          '/about',
          '/help',
          '/contact',
          '/login',
          '/register',
          '/privacy',
          '/terms',
          '/cookies',
          '/carpooling',
          '/help-request',
          '/help-offer',
          '/transport-request',
          '/transport-offer'
        ];

        // Check if current route is public or starts with a public route
        const currentPath = window.location.pathname;
        const isPublicRoute = publicRoutes.some(
          (route) =>
            currentPath === route ||
            currentPath.startsWith('/organizations/') ||
            currentPath.startsWith('/events/') ||
            currentPath.startsWith('/detail/')
        );

        // Only redirect to login from protected routes
        if (!isPublicRoute) {
          toast({
            title: 'Session expired',
            description: 'Please sign in again.'
          });

          const returnTo = encodeURIComponent(window.location.pathname + window.location.search + window.location.hash);
          navigate(`/login?returnTo=${returnTo}`, { replace: true });
        } else {
          // For public routes, just clear the token silently or with a subtle notification
          // Don't redirect, let the user continue browsing
          // intentionally quiet in production
        }
      }
    }
  });

  const { data: settings } = useQuery({
    queryKey: ['system-settings'],
    queryFn: () => api.getSettings(),
    enabled: !!token,
  });

  const value: AppProviderState = {
    showBackButton,
    authenticated: !!token,
    user: me?.data ?? me, // supports Axios or direct JSON
    settings: (settings as any)?.data ?? settings
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
