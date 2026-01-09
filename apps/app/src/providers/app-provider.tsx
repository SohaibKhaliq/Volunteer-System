import api from '@/lib/api';
import { useStore } from '@/lib/store';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { toast } from '@/components/atoms/use-toast';
import { useLocation, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Shield, AlertTriangle, ArrowRight, FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import MaintenanceLock from '@/components/organisms/MaintenanceLock';
import OrganizationSelectorModal from '@/components/organisms/OrganizationSelectorModal';
import useSystemRoles from '@/hooks/useSystemRoles';

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

  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s,
    l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
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
  selectedOrganizationName?: string | null;
  openOrganizationSelector?: () => void;
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
      } catch (e) {}
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
    enabled: !!token
  });

  const [searchParams] = useSearchParams();
  const currentTab = searchParams.get('tab');

  const [showOrgSelector, setShowOrgSelector] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState<{ id: number; name: string } | null>(() => {
    try {
      const raw = localStorage.getItem('selectedOrganization') || localStorage.getItem('selectedOrganizationName');
      if (!raw) return null;
      try {
        return JSON.parse(raw);
      } catch (e) {
        // legacy string stored as name only
        return { id: 0, name: raw } as any;
      }
    } catch (e) {
      return null;
    }
  });
  const prevPathRef = useRef<string>(location.pathname);

  const { data: featuresData } = useQuery({
    queryKey: ['admin', 'features'],
    queryFn: () => api.getFeatures(),
    enabled: !!token
  });

  // Fetch system roles (including permissions) so the UI can determine admin-like roles from DB
  const { data: rolesData } = useQuery({
    queryKey: ['system-roles'],
    queryFn: () => api.getRoles(),
    enabled: !!token
  });

  const features = featuresData?.data ?? featuresData ?? {};
  const complianceEnforcement = features.complianceEnforcement === true;
  const user = me?.data ?? me;
  const isCompliant = user?.complianceStatus === 'compliant';
  // Determine admin-like roles dynamically using role permissions from the server
  const privilegedPermissions = new Set([
    'manage_permissions',
    'manage_user_roles',
    'manage_org_members',
    'manage_org_settings',
    'manage_compliance_docs'
  ]);

  const privilegedRoleSlugs = new Set<string>();
  try {
    const rolesList = (rolesData && (rolesData.data ?? rolesData)) || [];
    for (const r of rolesList) {
      const perms = r.permissions || [];
      for (const p of perms) {
        const pn = (p.name || p.slug || p) as string;
        if (privilegedPermissions.has(pn)) {
          privilegedRoleSlugs.add(String(r.slug || r.name).toLowerCase());
          break;
        }
      }
    }
  } catch (e) {}

  const isAdmin =
    user?.isAdmin === true ||
    user?.isAdmin === 1 ||
    Boolean(
      user?.roles?.some((r: any) => {
        const roleSlug = String(r.slug || r.name || r)
          .toLowerCase()
          .replace(/-/g, '_');
        return privilegedRoleSlugs.has(roleSlug);
      })
    );

  // Paths that are NEVER locked (essential for fixing compliance or basic navigation)
  const lockExemptPaths = [
    '/login',
    '/register',
    '/organization/compliance',
    '/profile',
    '/logout',
    '/support',
    '/contact'
  ];

  const { isPrivilegedUser, isOrganizationAdminUser } = useSystemRoles();

  const isAdmin = isPrivilegedUser(user) || user?.isAdmin === true || user?.isAdmin === 1;

  const isOrganization = isOrganizationAdminUser(user);

  const isVolunteer =
    user?.roles?.some((r: any) =>
      String(r.name || r)
        .toLowerCase()
        .includes('volunteer')
    ) &&
    !isAdmin &&
    !isOrganization;

  // Custom logic for /profile: only exempt if the compliance tab is active
  const isProfileLocked = location.pathname === '/profile' && currentTab !== 'compliance';

  // Exempt all /admin routes from the lock
  const isAdminRoute = location.pathname.startsWith('/admin');

  const isLocked =
    complianceEnforcement &&
    !isCompliant &&
    !isAdmin &&
    (!lockExemptPaths.includes(location.pathname) || isProfileLocked) &&
    !isAdminRoute;

  // Maintenance Mode Logic
  const maintenanceModeSetting = settings?.find((s: any) => s.key === 'maintenance_mode')?.value;
  const isMaintenanceMode =
    maintenanceModeSetting === 'true' || maintenanceModeSetting === true || maintenanceModeSetting === '1';
  const maintenanceMessage = settings?.find((s: any) => s.key === 'maintenance_message')?.value;
  const supportEmail = settings?.find((s: any) => s.key === 'support_email')?.value;
  const platformName = settings?.find((s: any) => s.key === 'platform_name')?.value;

  const isMaintenanceLocked =
    isMaintenanceMode && !isAdmin && !isAdminRoute && !['/login', '/logout', '/register'].includes(location.pathname);

  const value: AppProviderState = {
    showBackButton,
    authenticated: !!token,
    user: me?.data ?? me, // supports Axios or direct JSON
    settings: (settings as any)?.data ?? settings
  };

  // expose selected org name and a method to open selector
  value.selectedOrganizationName = selectedOrganization?.name ?? null;
  value.openOrganizationSelector = () => setShowOrgSelector(true);

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

  // Show organization selector when user belongs to multiple orgs and is in org panel route
  useEffect(() => {
    try {
      const selected = localStorage.getItem('selectedOrganizationName');
      const hasMultiple = (user?.organizations && user.organizations.length > 1) || false;

      const prevPath = prevPathRef.current || '';
      const enteringOrg = !prevPath.startsWith('/organization') && location.pathname.startsWith('/organization');

      // update previous path for next transition
      prevPathRef.current = location.pathname;

      // Only show selector when transitioning into the organization panel (not on other renders)
      if (hasMultiple && !selected && enteringOrg) {
        setShowOrgSelector(true);
      }
    } catch (e) {
      // ignore
    }
  }, [user, location.pathname]);

  useEffect(() => {
    setShowBackButton(location.pathname !== '/');
  }, [location]);

  if (isLoadingMe && token) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <AppProviderContext.Provider value={value}>
      <OrganizationSelectorModal
        open={showOrgSelector}
        organizations={user?.organizations ?? []}
        onClose={() => setShowOrgSelector(false)}
        onSelect={(org) => {
          try {
            localStorage.setItem('selectedOrganization', JSON.stringify(org));
          } catch (e) {}
          setSelectedOrganization(org);
          setShowOrgSelector(false);
          // Show a small confirmation toast
          try {
            toast({ title: 'Organization selected', description: `Using ${org.name} for organization panel` });
          } catch (e) {}
          // Refresh queries so organization panel picks up selected org
          try {
            queryClient.invalidateQueries();
          } catch (e) {}
        }}
      />
      {isMaintenanceLocked ? (
        <MaintenanceLock message={maintenanceMessage} supportEmail={supportEmail} platformName={platformName} />
      ) : null}
      {isLocked && !isMaintenanceLocked ? (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl border-primary/20">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Shield className="w-10 h-10 text-primary animate-pulse" />
              </div>
              <CardTitle className="text-2xl font-bold">Compliance Required</CardTitle>
              <CardDescription>
                System-wide compliance enforcement is currently active. You must submit your verification documents to
                unlock full access.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-3 text-sm text-amber-800">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <p>
                  Features like event joining, shift management, and resource access are disabled until your status is{' '}
                  <strong>Compliant</strong>.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Current Status:</span>
                  <span className="font-semibold text-amber-600 capitalize">{user?.complianceStatus || 'Pending'}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 w-1/3" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button asChild className="w-full py-6 text-lg font-semibold group">
                <Link to={isVolunteer ? '/profile?tab=compliance' : '/organization/compliance'}>
                  <FileCheck className="mr-2 h-5 w-5" />
                  Upload Documents
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button variant="ghost" className="w-full" asChild>
                <Link to="/logout">Sign Out</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      ) : null}
      {children}
    </AppProviderContext.Provider>
  );
}

export const useApp = () => {
  const context = useContext(AppProviderContext);
  if (!context) {
    throw new Error('useApp must be used inside <AppProvider>');
  }
  return context;
};
