import { describe, it, expect, vi } from 'vitest';
// automatic JSX runtime — remove unused default React import
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
    mockedApi.login = vi.fn().mockResolvedValue({ token: { token: 'abc' } });

    // render login page in a memory router with returnTo
    const { container } = render(
      <MemoryRouter initialEntries={['/login?returnTo=/admin']}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<div>Admin page</div>} />
        </Routes>
      </MemoryRouter>
    );

    // fill credentials and submit
    const emailInput = container.querySelector('input[type="email"]') as HTMLInputElement;
    const pwInput = container.querySelector('input[type="password"]') as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: 'org@example.test' } });
    fireEvent.change(pwInput, { target: { value: 'password' } });

    const signInBtn = screen.getByText(/Sign In/i);
    fireEvent.click(signInBtn);

    await waitFor(() => {
      expect(screen.getByText(/Admin page/i)).toBeDefined();
    });
  });

  it('redirects away if token already present (user already authenticated)', async () => {
    // simulate persisted token in localStorage
    localStorage.setItem(
      'Local Aid-storage',
      JSON.stringify({ state: { token: 'abc', user: { id: 1, email: 'a@b' } } })
    );

    const { container } = render(
      <MemoryRouter initialEntries={['/login?returnTo=/dashboard']}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<div>Dashboard page</div>} />
        </Routes>
      </MemoryRouter>
    );

    // since token exists and Login has an effect to navigate, we should be redirected
    await waitFor(() => {
      expect(screen.getByText(/Dashboard page/i)).toBeDefined();
    });
  });
});
