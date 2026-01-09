// Test setup hooks — provide minimal DOM shims and helpers used by tests

// Add jest-dom matchers for better DOM assertions
import '@testing-library/jest-dom';

// localStorage mock for tests
class LocalStorageMock {
  private store: Record<string, string> = {};
  clear() {
    this.store = {};
  }
  getItem(key: string) {
    return this.store[key] ?? null;
  }
  setItem(key: string, value: string) {
    this.store[key] = String(value);
  }
  removeItem(key: string) {
    delete this.store[key];
  }
}
Object.defineProperty(window, 'localStorage', { value: new LocalStorageMock() });

// simple matchMedia mock
Object.defineProperty(window, 'matchMedia', {
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false
  })
});

// Ensure location is writable in tests
if (!Object.getOwnPropertyDescriptor(window, 'location')?.writable) {
  // @ts-expect-error Allow replacing location for tests
  delete window.location;
  // @ts-expect-error Allow replacing location for tests
  window.location = { href: 'http://localhost/', pathname: '/', search: '', hash: '' };
}

// Reset any persisted Zustand store before each test run
import { beforeEach } from 'vitest';
beforeEach(() => {
  try {
    localStorage.clear();
  } catch (e) {}
});

// Mock socket.io-client globally so tests don't attempt real connections
vi.mock('socket.io-client', () => ({ io: () => ({ on: () => {}, close: () => {} }) }));

// Provide a simple global mock for the system roles hook used throughout the app.
// Tests frequently mock `useApp` to provide a `user` object; this mock ensures
// components that import `useSystemRoles` have a predictable, minimal implementation
// that respects the `user.isAdmin` / `user.is_admin` flag and basic organization/team roles.
vi.mock('@/hooks/useSystemRoles', () => ({
  default: () => ({
    rolesList: [],
    privilegedRoleSlugs: new Set(),
    isPrivilegedUser: (user: any) => {
      if (!user) return false;
      return user?.isAdmin === true || user?.is_admin === true || user?.isAdmin === 1 || user?.is_admin === 1;
    },
    isOrganizationAdminUser: (user: any) => {
      if (!user) return false;
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
      return false;
    }
  })
}));
