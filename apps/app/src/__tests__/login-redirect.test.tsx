// vitest provides globals via tsconfig types — don't import describe/it/expect/vi here
// automatic JSX runtime — remove unused default React import
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render } from '@/test-utils';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
// queries are not necessary for this test file
import Login from '@/pages/login';
import api from '@/lib/api';

vi.mock('@/lib/api');

const mockedApi = api as any;

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

    render(
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
