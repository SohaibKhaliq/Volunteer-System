import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useStore } from '@/lib/store';

export default function useSystemRoles() {
  const { token } = useStore();

  const { data } = useQuery({
    queryKey: ['system-roles'],
    queryFn: () => api.getRoles(),
    enabled: !!token,
    retry: false
  });

  const rolesList = (data && (data.data ?? data)) || [];

  const privilegedPermissions = new Set([
    'manage_permissions',
    'manage_user_roles',
    'manage_org_members',
    'manage_org_settings',
    'manage_compliance_docs'
  ]);

  const privilegedRoleSlugs = new Set<string>();
  for (const r of rolesList) {
    const perms = r.permissions || [];
    for (const p of perms) {
      const pn = String(p.name || p.slug || p).toLowerCase();
      if (privilegedPermissions.has(pn)) {
        const slug = String(r.slug || r.name || '')
          .toLowerCase()
          .replace(/\s+/g, '_');
        privilegedRoleSlugs.add(slug);
        break;
      }
    }
  }

  function normalizeRoleSlug(r: any) {
    return String(r?.slug || r?.name || r)
      .toLowerCase()
      .replace(/\s+/g, '_');
  }

  function isPrivilegedUser(user: any) {
    if (!user) return false;
    if (user.isAdmin === true || user.is_admin === true || user.isAdmin === 1 || user.is_admin === 1) return true;
    const userRoles = user.roles || [];
    return userRoles.some((r: any) => privilegedRoleSlugs.has(normalizeRoleSlug(r)));
  }

  function isOrganizationAdminUser(user: any) {
    if (!user) return false;
    // check organization/team memberships first
    if (user.organizations && Array.isArray(user.organizations)) {
      for (const org of user.organizations) {
        const role = org.role || org.pivot?.role;
        if (role && /admin|owner|manager/i.test(String(role))) return true;
      }
    }
    if (user.teamMemberships && Array.isArray(user.teamMemberships)) {
      for (const m of user.teamMemberships) {
        const role = m.role || m.pivot?.role;
        if (role && /admin|owner|manager/i.test(String(role))) return true;
      }
    }

    // fallback to top-level roles matching privileged slugs or organization indicators
    const userRoles = user.roles || [];
    if (userRoles.some((r: any) => privilegedRoleSlugs.has(normalizeRoleSlug(r)))) return true;
    const roleNames = userRoles.map((r: any) => normalizeRoleSlug(r));
    if (roleNames.some((n: string) => n.includes('organization') || n.includes('org'))) return true;

    return false;
  }

  return {
    rolesList,
    privilegedRoleSlugs,
    isPrivilegedUser,
    isOrganizationAdminUser
  };
}
