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
