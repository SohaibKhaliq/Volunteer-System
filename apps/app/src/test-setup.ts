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
  // @ts-ignore
  delete window.location;
  // @ts-ignore
  window.location = { href: '/', pathname: '/', search: '', hash: '' };
}

// Reset any persisted Zustand store before each test run
import { beforeEach } from 'vitest';
beforeEach(() => {
  try {
    localStorage.clear();
  } catch (e) {}
});
