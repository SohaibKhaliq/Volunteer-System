import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MapPage from '@/pages/map';
import Detail from '@/pages/detail';

vi.mock('@/lib/api', () => ({
  default: {
    listEvents: vi.fn().mockResolvedValue([
      {
        id: 99,
        title: 'Mock Event',
        location: 'Mock Location',
        date: '2025-01-01',
        time: '10:00',
        type: 'Community',
        image: 'https://example.com/img.png',
        coordinates: [31.63, -8.0]
      }
    ]),
    getEvent: vi.fn().mockResolvedValue({
      id: 99,
      title: 'Mock Event',
      description: 'desc',
      startAt: new Date().toISOString(),
      capacity: 10,
      spots: { filled: 0 }
    })
  }
}));

describe('Public pages access', () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  it('allows unauthenticated users to view the map page', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[`/map`]}>
          <Routes>
            <Route path="/map" element={<MapPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    // page should render and show the available opportunities header
    expect(await screen.findByText(/Available Opportunities/i)).toBeTruthy();
  });

  it('allows unauthenticated users to view an event detail page without auto-redirect', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[`/detail/event/99`]}>
          <Routes>
            <Route path="/detail/event/:id" element={<Detail />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    // event title should be visible
    expect(await screen.findByText(/Mock Event/i)).toBeTruthy();
    // ensure we did not navigate away to /login
    expect(window.location.pathname).not.toContain('/login');
  });
});
