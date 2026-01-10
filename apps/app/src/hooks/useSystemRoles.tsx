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
  // Allow privileged permission names to be configured from the server settings.
  // Server may expose a setting `privileged_permissions` containing either a JSON
  // array (e.g. ["manage_permissions","manage_user_roles"]) or a comma-separated
  // string. If not present, no explicit privileged permission names are assumed
  // and privileged roles will be derived only from role definitions or the
  // `isAdmin` flag.
  const { data: settingsData } = useQuery({
    queryKey: ['system-settings'],
    queryFn: () => api.getSettings(),
    enabled: !!token,
    retry: false
  });

  const settingsList = (settingsData && (settingsData.data ?? settingsData)) || [];
  const rawPrivileged = settingsList?.find((s: any) => s.key === 'privileged_permissions')?.value;

  let privilegedPermissions = new Set<string>();
  try {
    if (rawPrivileged) {
      if (typeof rawPrivileged === 'string') {
        const trimmed = rawPrivileged.trim();
        if (trimmed.startsWith('[')) {
          // JSON array
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) privilegedPermissions = new Set(parsed.map((p: any) => String(p).toLowerCase()));
        } else {
          // comma-separated
          const parts = trimmed
            .split(',')
            .map((p) => p.trim())
            .filter(Boolean);
          if (parts.length) privilegedPermissions = new Set(parts.map((p) => String(p).toLowerCase()));
        }
      } else if (Array.isArray(rawPrivileged)) {
        privilegedPermissions = new Set(rawPrivileged.map((p: any) => String(p).toLowerCase()));
      }
    }
  } catch (e) {
    // If parsing settings fails, leave privilegedPermissions empty so we
    // only rely on explicit role slugs or the user's admin flag.
    privilegedPermissions = new Set();
  }

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
