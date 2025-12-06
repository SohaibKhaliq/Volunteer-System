import { describe, it, expect, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppProvider from '@/providers/app-provider';
import api from '@/lib/api';
import { useStore } from '@/lib/store';

vi.mock('@/lib/api');
const mockedApi = api as any;

describe('AppProvider session expiry flow', () => {
  it('clears token and redirects to login when /me returns 401', async () => {
    // simulate authenticated token present
    const setToken = useStore.getState().setToken;
    setToken('sometoken');

    // fingerprint feature removed — no fingerprint setup

    // mock getCurrentUser to reject with 401
    const err = new Error('unauthorized') as any;
    err.response = { status: 401, data: { message: 'Unauthorized' } };
    mockedApi.getCurrentUser = vi.fn().mockRejectedValue(err);

    // spy on location.href
    const originalLocation = window.location;
    // @ts-ignore
    delete window.location;
    // @ts-ignore
    window.location = { href: '/', pathname: '/admin', search: '', hash: '' };

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, suspense: false } } });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/admin']}>
          <AppProvider>
            <Routes>
              <Route path="/admin" element={<div>Admin</div>} />
            </Routes>
          </AppProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(window.location.href).toContain('/login');
    });

    // restore
    window.location = originalLocation;
  });
});
