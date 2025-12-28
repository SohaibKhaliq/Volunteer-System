import { ReactNode } from 'react';
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

  const userData = user?.data ?? user;

  // No user data - redirect
  if (!userData) {
    navigate(redirectTo, { replace: true });
    return null;
  }

  // Check role
  const userRole = getUserRole(userData);
  if (!allowedRoles.includes(userRole)) {
    navigate(redirectTo, { replace: true });
    return null;
  }

  return <>{children}</>;
}
