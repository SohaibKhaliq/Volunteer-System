import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Providers from '@/providers';

// Mock useApp to provide a simple user/context
vi.mock('@/providers/app-provider', () => ({
  useApp: () => ({
    user: { firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com' },
    authenticated: true
  })
}));

import AdminLayout from '@/components/templates/AdminLayout';

describe('AdminLayout sidebar', () => {
  it('renders nav with overflow and shows Sign out button', async () => {
    const { container } = render(
      <Providers>
        <MemoryRouter initialEntries={["/admin"]}>
          <AdminLayout />
        </MemoryRouter>
      </Providers>
    );

    const nav = container.querySelector('aside nav');
    expect(nav).toBeTruthy();
    // ensure our overflow class is present so the middle area scrolls independently
    expect(nav).toHaveClass('overflow-y-auto');

    // Sign out should be present in the sidebar bottom block
    const logoutBtn = await screen.findByText(/Sign out/i);
    expect(logoutBtn).toBeInTheDocument();
  });
});
