import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// We'll mock useApp provider so layout sees not-authenticated
vi.mock('@/providers/app-provider', () => ({
  useApp: () => ({
    user: undefined,
    authenticated: false
  })
}));

import AdminLayout from '@/components/templates/AdminLayout';
import OrganizationLayout from '@/components/templates/OrganizationLayout';

describe('Layout auth guards', () => {
  it('redirects AdminLayout to login when not authenticated', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route path="/admin" element={<AdminLayout />} />
            <Route path="/login" element={<div>Login page</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    // AdminLayout will navigate to /login synchronously; confirm login stub exists
    expect(screen.getByText(/Login page/i)).toBeDefined();
  });

  it('redirects OrganizationLayout to login when not authenticated', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/organization']}>
          <Routes>
            <Route path="/organization" element={<OrganizationLayout />} />
            <Route path="/login" element={<div>Login page</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText(/Login page/i)).toBeDefined();
  });
});
