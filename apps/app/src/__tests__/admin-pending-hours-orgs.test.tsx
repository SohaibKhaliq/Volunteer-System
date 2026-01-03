import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Providers from '@/providers';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/lib/api');
import api from '@/lib/api';

vi.mock('@/providers/app-provider', () => ({ useApp: () => ({ user: { isAdmin: true }, authenticated: true }) }));

import AdminPendingHoursByOrg from '@/pages/admin/pending-hours-orgs';

describe('Admin Pending Hours by Org page', () => {
  it('renders grouped organizations and expands items', async () => {
    const groups = [
      {
        organizationId: 1,
        organizationName: 'Org A',
        pendingCount: 2,
        items: [{ id: 11, userId: 101, firstName: 'Alice', lastName: 'A', hours: 5, date: new Date().toISOString(), status: 'pending' }]
      },
      {
        organizationId: 2,
        organizationName: 'Org B',
        pendingCount: 1,
        items: [{ id: 21, userId: 102, firstName: 'Bob', lastName: 'B', hours: 3, date: new Date().toISOString(), status: 'pending' }]
      }
    ];

    (api as any).getAdminPendingHoursByOrg = vi.fn().mockResolvedValue(groups);
    (api as any).listAuditLogs = vi.fn().mockResolvedValue([
      {
        id: 101,
        action: 'volunteer_hours_update',
        details: JSON.stringify({ hourId: 11, organizationId: 1 }),
        createdAt: new Date().toISOString(),
        user: { firstName: 'Sys', lastName: 'Admin' }
      }
    ]);

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={client}>
        <Providers>
          <MemoryRouter>
            <AdminPendingHoursByOrg />
          </MemoryRouter>
        </Providers>
      </QueryClientProvider>
    );

    expect(await screen.findByText('Org A')).toBeInTheDocument();
    const showBtn = await screen.findAllByText('Show sample entries');
    fireEvent.click(showBtn[0]);
    expect(await screen.findByText(/Alice.*A/)).toBeInTheDocument();

    // mock update and bulk APIs
    const mockUpdate = ((api as any).updateHour = vi.fn().mockResolvedValue({}));
    const mockBulk = ((api as any).bulkUpdateHours = vi.fn().mockResolvedValue({}));

    // click Approve for first item
    const approveBtn = await screen.findByText('Approve');
    fireEvent.click(approveBtn);
    expect(mockUpdate).toHaveBeenCalledWith(11, { status: 'Approved' });

    // click Approve All in Org
    const approveAllBtn = await screen.findByText('Approve All in Org');
    fireEvent.click(approveAllBtn);
    expect(mockBulk).toHaveBeenCalledWith([11], 'Approved');

    // audit details should be visible: click Details button
    const detailsBtns = await screen.findAllByText('Details');
    fireEvent.click(detailsBtns[0]);
    expect(await screen.findByText('volunteer_hours_update')).toBeInTheDocument();
  });
});
