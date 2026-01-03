// automatic JSX runtime — remove unused default React import
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Header from '@/components/molecules/header';
import Footer from '@/components/molecules/footer';
import Privacy from '@/pages/privacy';
import Terms from '@/pages/terms';
import Cookies from '@/pages/cookies';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import AppProvider from '@/providers/app-provider';

vi.mock('socket.io-client', () => ({ io: () => ({ on: () => { }, close: () => { } }) }));
vi.mock('@/lib/api', () => ({ default: { getCurrentUser: vi.fn().mockResolvedValue({ data: null }) } }));

describe('Policy & resource pages', () => {
  it('header shows privacy/terms/help links', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/']}>
          <AppProvider>
            <Header />
          </AppProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(await screen.findByText(/Privacy/i)).toBeTruthy();
    expect(await screen.findByText(/Terms/i)).toBeTruthy();
    expect(await screen.findByText(/Help/i)).toBeTruthy();
  });

  it('footer renders links to policies', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Footer />
      </MemoryRouter>
    );

    expect(screen.getAllByText(/Privacy Policy|Privacy/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Terms of Service|Terms/i)).toBeTruthy();
    expect(screen.getByText(/Cookies/i)).toBeTruthy();
  });

  it('privacy, terms and cookies pages render expected headings', () => {
    const { unmount: u1 } = render(
      <MemoryRouter>
        <Privacy />
      </MemoryRouter>
    );
    expect(screen.getByText(/Privacy Policy/i)).toBeTruthy();
    u1();

    const { unmount: u2 } = render(
      <MemoryRouter>
        <Terms />
      </MemoryRouter>
    );
    expect(screen.getByText(/Terms of Service/i)).toBeTruthy();
    u2();

    render(
      <MemoryRouter>
        <Cookies />
      </MemoryRouter>
    );
    expect(screen.getAllByText(/Cookies/i).length).toBeGreaterThan(0);
  });
});
