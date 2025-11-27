import React from 'react';
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
    render(<Privacy />);
    expect(screen.getByText(/Privacy Policy/i)).toBeTruthy();

    render(<Terms />);
    expect(screen.getByText(/Terms of Service/i)).toBeTruthy();

    render(<Cookies />);
    expect(screen.getByText(/Cookies/i)).toBeTruthy();
  });
});
