import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Login from '@/pages/login';
import api from '@/lib/api';

vi.mock('@/lib/api');

const mockedApi = api as any;

function renderWithProviders(ui: React.ReactElement, { route = '/login?returnTo=/admin' } = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, suspense: false } } });
  window.history.pushState({}, 'Test page', route);
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>, { wrapper: MemoryRouter });
}

describe('Login page redirect behavior', () => {
  it('navigates back to returnTo after successful login', async () => {
    mockedApi.authenticate = vi.fn().mockResolvedValue({ token: { token: 'abc' } });

    // render login page in a memory router with returnTo
    const { container } = render(
      <MemoryRouter initialEntries={['/login?returnTo=/admin']}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<div>Admin page</div>} />
        </Routes>
      </MemoryRouter>
    );

    // click Use Dev Fingerprint to populate
    const useDevBtn = screen.getByText(/Use Dev Fingerprint/i);
    fireEvent.click(useDevBtn);

    const authBtn = screen.getByText(/Authenticate/i);
    fireEvent.click(authBtn);

    await waitFor(() => {
      expect(screen.getByText(/Admin page/i)).toBeDefined();
    });
  });
});
