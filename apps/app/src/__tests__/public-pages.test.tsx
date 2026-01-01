// automatic JSX runtime — remove unused default React import
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MapPage from '@/pages/map';
import Home from '@/pages/home';
import Detail from '@/pages/detail';
import AppProvider from '@/providers/app-provider';

vi.mock('@/lib/axios', () => ({
  axios: {
    get: vi.fn((url) => {
      if (url === '/events') return Promise.resolve({
        data: [{
          id: 99,
          title: 'Mock Event',
          location: 'Mock Location',
          date: '2025-01-01',
          time: '10:00',
          type: 'Community',
          image: 'https://example.com/img.png',
          coordinates: [31.63, -8.0]
        }]
      });
      if (url === '/events/99') return Promise.resolve({
        id: 99,
        title: 'Mock Event',
        description: 'desc',
        startAt: new Date().toISOString(),
        capacity: 10,
        spots: { filled: 0 }
      });

      return Promise.resolve({ data: [] });
    }),
    post: vi.fn(),
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } }
  }
}));

describe('Public pages access', () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  it('allows unauthenticated users to view the map page', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[`/map`]}>
          <AppProvider>
            <Routes>
              <Route path="/map" element={<MapPage />} />
            </Routes>
          </AppProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );

    // page should render and show the available opportunities header
    expect(await screen.findByText(/Available Opportunities/i)).toBeTruthy();
  });

  it('allows unauthenticated users to view the home page without redirecting to login', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[`/`]}>
          <AppProvider>
            <Routes>
              <Route path="/" element={<Home />} />
            </Routes>
          </AppProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Expect hero copy visible and that we didn't navigate to /login
    expect(await screen.findByText(/Make a Difference in Your Community Today/i)).toBeTruthy();
    expect(window.location.pathname).not.toContain('/login');
  });

  it('allows unauthenticated users to view an event detail page without auto-redirect', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[`/detail/event/99`]}>
          <AppProvider>
            <Routes>
              <Route path="/detail/event/:id" element={<Detail />} />
            </Routes>
          </AppProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );

    // event title should be visible
    expect(await screen.findByText(/Mock Event/i)).toBeTruthy();
    // ensure we did not navigate away to /login
    expect(window.location.pathname).not.toContain('/login');
  });
});
