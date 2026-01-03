import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Providers from '@/providers';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/lib/api');
import api from '@/lib/api';

vi.mock('@/providers/app-provider', () => ({ useApp: () => ({ user: { isAdmin: true }, authenticated: true }) }));

import AdminPendingHours from '@/pages/admin/pending-hours';

describe('Admin Pending Hours page', () => {
  it('lists pending hours and allows approving single item', async () => {
    const items = [
      {
        id: 101,
        first_name: 'Alice',
        last_name: 'Smith',
        event_title: 'Food Drive',
        date: new Date().toISOString(),
        hours: 3,
        notes: 'Test',
        status: 'pending'
      }
    ];

    (api as any).getAdminPendingHours = vi.fn().mockResolvedValue({ data: items });
    (api as any).updateHour = vi.fn().mockResolvedValue({});

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={client}>
        <Providers>
          <MemoryRouter>
            <AdminPendingHours />
          </MemoryRouter>
        </Providers>
      </QueryClientProvider>
    );

    expect(await screen.findByText('Alice Smith')).toBeInTheDocument();
    const approveBtn = await screen.findByText('Approve');
    fireEvent.click(approveBtn);
    expect((api as any).updateHour).toHaveBeenCalledWith(101, { status: 'Approved' });
  });

  it('bulk approve all items on page', async () => {
    const items = [
      {
        id: 201,
        first_name: 'Bob',
        last_name: 'Jones',
        event_title: 'Clean Up',
        date: new Date().toISOString(),
        hours: 2,
        notes: '',
        status: 'pending'
      },
      {
        id: 202,
        first_name: 'Clara',
        last_name: 'Lee',
        event_title: 'Tutoring',
        date: new Date().toISOString(),
        hours: 2,
        notes: '',
        status: 'pending'
      }
    ];

    (api as any).getAdminPendingHours = vi.fn().mockResolvedValue({ data: items });
    (api as any).bulkUpdateHours = vi.fn().mockResolvedValue({ approved_count: 2 });

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={client}>
        <Providers>
          <MemoryRouter>
            <AdminPendingHours />
          </MemoryRouter>
        </Providers>
      </QueryClientProvider>
    );

    const approveAll = await screen.findByText('Approve All on Page');
    fireEvent.click(approveAll);

    // ensure bulk endpoint was called with both ids
    expect((api as any).bulkUpdateHours).toHaveBeenCalledWith([201, 202], 'Approved');
  });
});
