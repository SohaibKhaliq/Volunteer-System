// automatic JSX runtime — remove unused default React import
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import OrganizationDetail from '@/pages/organization-detail';
import { useStore } from '@/lib/store';

vi.mock('@/lib/axios', () => ({
  axios: {
    get: vi.fn().mockResolvedValue({ id: 1, name: 'Org', description: 'desc' }),
    post: vi.fn().mockResolvedValue({ id: 1 })
  }
}));

describe('Organization detail join behavior', () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  beforeEach(() => {
    useStore.getState().setToken('');
    useStore.getState().setUser(null);
  });

  it('does NOT redirect to login when token present even if user profile not loaded', async () => {
    // Set token but leave user null
    useStore.getState().setToken('sometoken');
    useStore.getState().setUser(null);

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[`/organizations/1`]}>
          <Routes>
            <Route path="/organizations/:id" element={<OrganizationDetail />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    const joinBtn = await screen.findByRole('button', { name: /Join Organization/i });
    fireEvent.click(joinBtn);

    await waitFor(() => {
      expect(window.location.pathname).not.toContain('/login');
    });
  });
});
