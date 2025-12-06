import { describe, it, expect, vi } from 'vitest';
// automatic JSX runtime — remove unused default React import
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import OrganizationLayout from '@/components/templates/OrganizationLayout';
import OrganizationDashboard from '@/pages/organization/dashboard';
import AppProvider from '@/providers/app-provider';
import api from '@/lib/api';
import { useStore } from '@/lib/store';

vi.mock('@/lib/api');
const mockedApi = api as any;

describe('Organization dashboard e2e flow (client)', () => {
  it('logs in as seeded organization user and shows dashboard numbers', async () => {
    // set token as if logged in
    const setToken = useStore.getState().setToken;
    setToken('sometoken');

    // mock getCurrentUser and dashboard stats
    mockedApi.getCurrentUser = vi
      .fn()
      .mockResolvedValue({ data: { id: 123, firstName: 'Org', lastName: 'User', email: 'organization@gmail.com' } });
    mockedApi.getOrganizationDashboardStats = vi
      .fn()
      .mockResolvedValue({ activeVolunteers: 3, upcomingEvents: 2, totalHours: 60, impactScore: 77 });

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/organization']}>
          <AppProvider>
            <Routes>
              <Route path="/organization" element={<OrganizationLayout />}>
                <Route index element={<OrganizationDashboard />} />
              </Route>
            </Routes>
          </AppProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Wait for the sideloaded numbers to appear
    await waitFor(() => expect(screen.getByText('3')).toBeDefined());
    expect(screen.getByText('2')).toBeDefined();
    expect(screen.getByText('60')).toBeDefined();
  });
});
