import api from '@/lib/api';
import { useStore } from '@/lib/store';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { toast } from '@/components/atoms/use-toast';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Converts a hex color to an HSL string compatible with Tailwind space-separated HSL variables.
 * Format: "220 14% 96%"
 */
function hexToHsl(hex: string): string {
  if (!hex || !hex.startsWith('#')) return hex;

  // Remove #
  hex = hex.replace('#', '');

  // Parse r, g, b
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

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
    if (!settings) return;

    // 1. Inject Theme Colors
    const primaryHex = settings.find((s: any) => s.key === 'primary_color')?.value;
    const secondaryHex = settings.find((s: any) => s.key === 'secondary_color')?.value;

    if (primaryHex) {
      document.documentElement.style.setProperty('--primary', hexToHsl(primaryHex));
    }
    if (secondaryHex) {
      document.documentElement.style.setProperty('--secondary', hexToHsl(secondaryHex));
    }

    // 2. Update Favicon
    const faviconUrl = settings.find((s: any) => s.key === 'favicon_url')?.value;
    if (faviconUrl) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = faviconUrl;
    }

    // 3. Update Document Title
    const platformName = settings.find((s: any) => s.key === 'platform_name')?.value;
    if (platformName && !document.title.includes(platformName)) {
      // Small delay to allow page-specific titles to settle if needed, or just append
      document.title = `${platformName} - Let's help each other`;
    }
  }, [settings]);

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
