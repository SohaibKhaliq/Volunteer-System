import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useStore } from '@/lib/store';
import { Loader2 } from 'lucide-react';
import { getUserRole, type UserRole } from '@/hooks/useRouteProtection';

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

  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.getCurrentUser(),
    enabled: !!token,
    retry: false
  });

  const userData = user?.data ?? user;
  const userRole = userData ? getUserRole(userData) : null;

  // Use effect to handle navigation - avoids state updates during render
  useEffect(() => {
    // No user data - redirect
    if (!isLoading && !userData) {
      navigate(redirectTo, { replace: true });
    }

    // Check role - redirect if not allowed
    if (!isLoading && userData && userRole && !allowedRoles.includes(userRole)) {
      navigate(redirectTo, { replace: true });
    }
  }, [userData, userRole, isLoading, allowedRoles, navigate, redirectTo]);

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
  if (!userData || !userRole || !allowedRoles.includes(userRole)) {
    return null;
  }

  return <>{children}</>;
}
