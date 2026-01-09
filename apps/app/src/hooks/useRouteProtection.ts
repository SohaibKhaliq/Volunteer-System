import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useStore } from '@/lib/store';

export type UserRole = 'admin' | 'organization_admin' | 'volunteer';

/**
 * Hook to protect routes based on user role
 * @param allowedRoles - Array of roles that are allowed to access this route
 * @param redirectTo - Path to redirect to if unauthorized (default: '/')
 */
export function useRouteProtection(allowedRoles: UserRole[], redirectTo: string = '/') {
  const navigate = useNavigate();
  const { token } = useStore();

  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.getCurrentUser(),
    enabled: !!token,
    retry: false
  });

  useEffect(() => {
    if (isLoading || !token) return;

    const userData = user?.data ?? user;
    if (!userData) {
      navigate(redirectTo, { replace: true });
      return;
    }

    const userRole = getUserRole(userData);

    if (!allowedRoles.includes(userRole)) {
      navigate(redirectTo, { replace: true });
      return;
    }
  }, [user, isLoading, token, allowedRoles, navigate, redirectTo]);

  return { isLoading, isAuthorized: isAuthorized(user?.data ?? user, allowedRoles) };
}

/**
 * Determine user role from user data
 * Checks:
 * 1. Global admin flag (is_admin)
 * 2. Organization admin/owner/manager role in organizations array
 * 3. Falls back to volunteer
 */
export function getUserRole(user: any): UserRole {
  if (!user) return 'volunteer';

  // Check if user is a global admin
  if (user.isAdmin === true || user.is_admin === true || user.is_admin === 1 || user.isAdmin === 1) {
    return 'admin';
  }

  // Check if user is an organization admin/team member
  // Look in organizations array (with multiple relationship possibilities)
  if (user.organizations && Array.isArray(user.organizations)) {
    for (const org of user.organizations) {
      const orgRole = org.role || org.pivot?.role;
      if (
        orgRole === 'Admin' ||
        orgRole === 'admin' ||
        orgRole === 'owner' ||
        orgRole === 'Owner' ||
        orgRole === 'manager' ||
        orgRole === 'Manager'
      ) {
        return 'organization_admin';
      }
    }
  }

  // Also check top-level roles array for organization-scoped roles
  // Backend may return roles like `organization_admin`, `org_admin`, or similar
  if (user.roles && Array.isArray(user.roles)) {
    const roleNames = user.roles.map((r: any) => String(r.name || r).toLowerCase());
    if (
      roleNames.includes('organization_admin') ||
      roleNames.includes('org_admin') ||
      roleNames.includes('organization') ||
      roleNames.some((n: string) => n.includes('organization')) ||
      roleNames.some((n: string) => n.includes('org'))
    ) {
      return 'organization_admin';
    }
  }

  // Check team memberships if present (organization_team_members)
  if (user.teamMemberships && Array.isArray(user.teamMemberships)) {
    const hasAdminTeamRole = user.teamMemberships.some((member: any) => {
      const role = member.role || member.pivot?.role;
      return (
        role === 'Admin' ||
        role === 'admin' ||
        role === 'owner' ||
        role === 'Owner' ||
        role === 'manager' ||
        role === 'Manager'
      );
    });

    if (hasAdminTeamRole) {
      return 'organization_admin';
    }
  }

  return 'volunteer';
}

/**
 * Check if user is authorized for given roles
 */
export function isAuthorized(user: any, allowedRoles: UserRole[]): boolean {
  if (!user) return false;
  const userRole = getUserRole(user);
  return allowedRoles.includes(userRole);
}

/**
 * Check if user is global admin
 */
export function isGlobalAdmin(user: any): boolean {
  return user?.isAdmin === true || user?.is_admin === true || user?.is_admin === 1 || user?.isAdmin === 1;
}

/**
 * Check if user is organization admin
 */
export function isOrganizationAdmin(user: any): boolean {
  if (!user?.organizations || !Array.isArray(user.organizations)) return false;

  const orgAdmin = user.organizations.some((org: any) => {
    const role = org.role || org.pivot?.role;
    return (
      role === 'Admin' ||
      role === 'admin' ||
      role === 'owner' ||
      role === 'Owner' ||
      role === 'manager' ||
      role === 'Manager'
    );
  });

  if (orgAdmin) return true;

  if (user.teamMemberships && Array.isArray(user.teamMemberships)) {
    return user.teamMemberships.some((member: any) => {
      const role = member.role || member.pivot?.role;
      return (
        role === 'Admin' ||
        role === 'admin' ||
        role === 'owner' ||
        role === 'Owner' ||
        role === 'manager' ||
        role === 'Manager'
      );
    });
  }

  // Fallback: check top-level roles for organization role indicators
  if (user.roles && Array.isArray(user.roles)) {
    const roleNames = user.roles.map((r: any) => String(r.name || r).toLowerCase());
    if (
      roleNames.includes('organization_admin') ||
      roleNames.includes('org_admin') ||
      roleNames.some((n: string) => n.includes('organization')) ||
      roleNames.some((n: string) => n.includes('org'))
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Get first organization ID where user is admin
 */
export function getAdminOrganizationId(user: any): number | null {
  if (!user?.organizations || !Array.isArray(user.organizations)) return null;

  for (const org of user.organizations) {
    const role = org.role || org.pivot?.role;
    if (role === 'admin' || role === 'owner' || role === 'manager') {
      return org.id || org.organization_id;
    }
  }

  return null;
}
