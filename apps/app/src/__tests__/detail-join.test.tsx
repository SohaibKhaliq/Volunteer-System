import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Detail from '@/pages/detail';
import { useStore } from '@/lib/store';

vi.mock('@/lib/axios', () => ({
  axios: {
    get: vi.fn().mockResolvedValue({
      id: 1,
      title: 'Test Event',
      description: 'desc',
      startAt: new Date().toISOString(),
      capacity: 10,
      spots: { filled: 0 }
    }),
    post: vi.fn().mockResolvedValue({ id: 1 })
  }
}));

describe('Event detail join behavior', () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  beforeEach(() => {
    // reset store between tests
    useStore.getState().setToken('');
    useStore.getState().setUser(null);
  });

  it('does NOT redirect to login when token present even if user profile not loaded', async () => {
    // Set token but leave user null
    useStore.getState().setToken('sometoken');
    useStore.getState().setUser(null);

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[`/detail/event/1`]}>
          <Routes>
            <Route path="/detail/event/:id" element={<Detail />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    // wait for the join button to appear
    const joinBtn = await screen.findByRole('button', { name: /Join Now/i });

    // click the button
    fireEvent.click(joinBtn);

    // ensure we didn't get redirected to /login
    await waitFor(() => {
      expect(window.location.pathname).not.toContain('/login');
    });
  });
});
