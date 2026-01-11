import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import useSystemRoles from '@/hooks/useSystemRoles';
import { useStore } from '@/lib/store';

export type UserRole = 'admin' | 'organization_admin' | 'organization_coordinator' | 'volunteer';

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

  const { isPrivilegedUser, isOrganizationAdminUser } = useSystemRoles();

  useEffect(() => {
    if (isLoading || !token) return;

    const userData = user?.data ?? user;
    if (!userData) {
      navigate(redirectTo, { replace: true });
      return;
    }

    // Map user to simplified role and check via dynamic helpers
    const isAdmin = isPrivilegedUser(userData);
    const isOrgAdmin = isOrganizationAdminUser(userData);

    const mappedRole = isAdmin ? 'admin' : isOrgAdmin ? 'organization_admin' : 'volunteer';
    if (!allowedRoles.includes(mappedRole as any)) {
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
  // Check for explicit admin flag first
  if (user.isAdmin === true || user.is_admin === true || user.isAdmin === 1 || user.is_admin === 1) {
    return 'admin';
  }
  // Prefer DB-driven role names and organization/team roles.
  if (user.roles && Array.isArray(user.roles)) {
    const roleNames = user.roles.map((r: any) => String(r.name || r.slug || r).toLowerCase());
    if (roleNames.some((n: string) => n.includes('admin') || n.includes('owner') || n.includes('super')))
      return 'admin';
  }
  if (user.organizations && Array.isArray(user.organizations)) {
    for (const org of user.organizations) {
      const orgRole = org.role || org.pivot?.role;
      if (orgRole) {
        if (/admin|owner|manager/i.test(String(orgRole))) return 'organization_admin';
        if (/coordinator/i.test(String(orgRole))) return 'organization_coordinator';
      }
    }
  }
  if (user.teamMemberships && Array.isArray(user.teamMemberships)) {
    const hasAdmin = user.teamMemberships.some((m: any) => {
      const role = m.role || m.pivot?.role;
      return role && /admin|owner|manager/i.test(String(role));
    });
    if (hasAdmin) return 'organization_admin';
  }
  if (user.roles && Array.isArray(user.roles)) {
    const roleNames = user.roles.map((r: any) => String(r.name || r).toLowerCase());
    if (
      roleNames.includes('organization_admin') ||
      roleNames.includes('org_admin') ||
      roleNames.some((n: string) => n.includes('organization') || n.includes('org'))
    )
      return 'organization_admin';
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
  if (!user) return false;
  if (user.roles && Array.isArray(user.roles)) {
    return user.roles.some((r: any) => {
      const name = String(r?.slug || r?.name || r).toLowerCase();
      return name.includes('admin') || name.includes('owner') || name.includes('super');
    });
  }
  return false;
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
