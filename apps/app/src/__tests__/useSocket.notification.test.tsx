import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, vi, expect, beforeEach } from 'vitest';

// create a place to store handlers registered by the mock socket
const handlers: Record<string, Function> = {};

vi.mock('socket.io-client', () => ({
  io: (_url: string, _opts: any) => ({
    on: (event: string, fn: Function) => {
      handlers[event] = fn;
    },
    disconnect: vi.fn(),
    close: vi.fn(),
    id: 'mock-socket-id'
  })
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn()
  }
}));

vi.mock('canvas-confetti', () => ({
  default: vi.fn()
}));

// Use a lightweight component that uses the hook
import useSocket from '@/hooks/useSocket';

function TestHookUser() {
  // call the hook so it registers socket handlers
  useSocket();
  return null;
}

describe('useSocket notification integration', () => {
  let qc: QueryClient;
  beforeEach(() => {
    // clear handlers between tests
    for (const k of Object.keys(handlers)) delete handlers[k];
    qc = new QueryClient();
    // ensure token exists so hook attempts connection
    localStorage.setItem('token', 'abc');
  });

  it('registers notification handler and triggers query invalidation for hours approved', async () => {
    const spy = vi.spyOn(qc, 'invalidateQueries');

    render(
      <QueryClientProvider client={qc}>
        <TestHookUser />
      </QueryClientProvider>
    );

    expect(typeof handlers.notification).toBe('function');

    // simulate a hours_approved notification posted by server
    const payload = { type: 'hours_approved', payload: JSON.stringify({ hours: 3 }) };
    await handlers.notification(payload);

    // the hook should invalidate volunteer hours and hours queries
    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ['volunteer', 'hours'] }));
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ['hours'] }));
  });

  it('handles new_application notification and invalidates organization applications', async () => {
    const spy = vi.spyOn(qc, 'invalidateQueries');

    render(
      <QueryClientProvider client={qc}>
        <TestHookUser />
      </QueryClientProvider>
    );

    const payload = {
      type: 'new_application',
      payload: JSON.stringify({ volunteerName: 'Alice', opportunityTitle: 'Park Cleanup' })
    };

    await handlers.notification(payload);

    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ['organization', 'applications'] }));
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ['admin', 'summary'] }));
  });
});
