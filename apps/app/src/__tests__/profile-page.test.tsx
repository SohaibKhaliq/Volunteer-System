import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Profile from '@/pages/profile';
import { useStore } from '@/lib/store';

vi.mock('@/lib/api', () => ({
  default: {
    getCurrentUser: vi.fn().mockResolvedValue({
      data: {
        id: 10,
        firstName: 'Alice',
        lastName: 'Jones',
        email: 'a@test',
        impactScore: 850,
        impactPercentile: 10,
        hours: 24,
        hoursChangePercent: 12
      }
    }),
    getMyAssignments: vi.fn().mockResolvedValue([
      {
        id: 1,
        userId: 10,
        task: {
          id: 100,
          title: 'Park Cleanup',
          startAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
          location: 'Central Park'
        }
      }
    ]),
    getMyVolunteerHours: vi.fn().mockResolvedValue([
      {
        id: 201,
        user: { id: 10 },
        event: { id: 99, title: 'Beach Cleanup' },
        date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        hours: 4,
        status: 'Verified'
      }
    ])
  }
}));

describe('Profile (dynamic) page', () => {
  it('shows upcoming assignments and history for logged-in user', async () => {
    // ensure token stored so profile doesn't force-redirect
    useStore.getState().setToken('sometoken');

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[`/profile`]}>
          <Routes>
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    // upcoming assignment title should appear
    expect(await screen.findByText(/Park Cleanup/i)).toBeTruthy();

    // history row should show past event
    expect(await screen.findByText(/Beach Cleanup/i)).toBeTruthy();
  });
});
