import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useStore } from '@/lib/store';
import { Loader2 } from 'lucide-react';
import useSystemRoles from '@/hooks/useSystemRoles';
import { UserRole, getUserRole } from '@/hooks/useRouteProtection';

interface RouteGuardProps {
  children: ReactNode;
  allowedRoles: UserRole[];
  fallback?: ReactNode;
  redirectTo?: string;
}

/**
 * Route Guard Component - wraps routes to enforce role-based access
 */
export default function RouteGuard({ children, allowedRoles, fallback, redirectTo = '/' }: RouteGuardProps) {
  const navigate = useNavigate();
  const { token } = useStore();
  // We use getUserRole now, but let's keep useSystemRoles if we need granular checks for debugging or legacy reasons, 
  // though getUserRole encapsulates it. getUserRole uses raw data structure logic.
  // The system roles hook was: const { isPrivilegedUser, isOrganizationAdminUser } = useSystemRoles();
  // We can remove it if getUserRole is sufficient. getUserRole is sufficient.

  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.getCurrentUser(),
    enabled: !!token,
    retry: false
  });

  const rawData = user?.data ?? user;
  const userData = rawData?.user ?? rawData; // Unwrap { user: ... } if present

  // Determine effective role based on centralized logic
  const effectiveRole = getUserRole(userData);
  const isAuthorized = userData && allowedRoles.includes(effectiveRole);

  // Use effect to handle navigation - avoids state updates during render
  useEffect(() => {
    // No user data - redirect
    if (!isLoading && !userData) {
      navigate(redirectTo, { replace: true });
      return;
    }

    // Check role - redirect if not allowed
    if (!isLoading && userData && !isAuthorized) {
      navigate(redirectTo, { replace: true });
    }
  }, [userData, isAuthorized, isLoading, navigate, redirectTo]);

  // Loading state
  if (isLoading) {
    return (
      fallback || (
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )
    );
  }

  // Don't render children if user is not authorized
  if (!userData || !isAuthorized) {
    return null;
  }

  return <>{children}</>;
}
