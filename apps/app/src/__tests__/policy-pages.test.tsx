// automatic JSX runtime — remove unused default React import
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Header from '@/components/molecules/header';
import Footer from '@/components/molecules/footer';
import Privacy from '@/pages/privacy';
import Terms from '@/pages/terms';
import Cookies from '@/pages/cookies';

describe('Policy & resource pages', () => {
  it('header shows privacy/terms/help links', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Header />
      </MemoryRouter>
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

    expect(screen.getByText(/Privacy Policy|Privacy/i)).toBeTruthy();
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
