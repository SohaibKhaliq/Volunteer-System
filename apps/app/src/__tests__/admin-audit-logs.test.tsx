import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Providers from '@/providers';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/lib/api');
import api from '@/lib/api';

vi.mock('@/providers/app-provider', () => ({ useApp: () => ({ user: { isAdmin: true }, authenticated: true }) }));

import AdminAuditLogs from '@/pages/admin/audit-logs';

describe('Admin Audit Logs details', () => {
  it('loads and shows details', async () => {
    const rows = [
      {
        id: 55,
        action: 'volunteer_hours_update',
        user: { firstName: 'A', lastName: 'B' },
        createdAt: new Date().toISOString()
      }
    ];
    (api as any).listAuditLogs = vi.fn().mockResolvedValue(rows);
    (api as any).getAuditLog = vi
      .fn()
      .mockResolvedValue({ id: 55, action: 'volunteer_hours_update', details: '{"hourId":11}' });

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <Providers>
          <MemoryRouter>
            <AdminAuditLogs />
          </MemoryRouter>
        </Providers>
      </QueryClientProvider>
    );

    expect(await screen.findByText('volunteer_hours_update')).toBeInTheDocument();

    const detailsBtn = await screen.findByText('Details');
    fireEvent.click(detailsBtn);

    await waitFor(() => {
      expect((api as any).getAuditLog).toHaveBeenCalledWith(55);
    });
    expect(await screen.findByText('"hourId":11')).toBeInTheDocument();
  });
});
