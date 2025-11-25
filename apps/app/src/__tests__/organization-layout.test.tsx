import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Providers from '@/providers';

// Mock useApp to provide a simple user/context
vi.mock('@/providers/app-provider', () => ({
  useApp: () => ({
    user: { firstName: 'John', lastName: 'Doe', email: 'org@example.com' },
    authenticated: true
  })
}));

import OrganizationLayout from '@/components/templates/OrganizationLayout';

describe('OrganizationLayout sidebar', () => {
  it('renders nav with overflow and shows Exit Portal button', async () => {
    const { container } = render(
      <Providers>
        <MemoryRouter initialEntries={["/organization"]}>
          <OrganizationLayout />
        </MemoryRouter>
      </Providers>
    );

    const nav = container.querySelector('aside nav');
    expect(nav).toBeTruthy();
    // ensure our overflow class is present so the middle area scrolls independently
    expect(nav).toHaveClass('overflow-y-auto');

    // Exit Portal should be present in the sidebar bottom block
    const exitBtn = await screen.findByText(/Exit Portal/i);
    expect(exitBtn).toBeInTheDocument();
  });
});
