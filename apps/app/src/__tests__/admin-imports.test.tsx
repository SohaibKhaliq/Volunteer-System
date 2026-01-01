import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Providers from '@/providers';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/lib/api');
import api from '@/lib/api';

vi.mock('@/providers/app-provider', () => ({ useApp: () => ({ user: { isAdmin: true }, authenticated: true }) }));

import AdminImports from '@/pages/admin/imports';

describe('Admin Imports page', () => {
  it('renders import jobs and retries', async () => {
    const jobs = [
      {
        id: 1,
        name: 'Import Vols',
        type: 'import:volunteers',
        status: 'Scheduled',
        runAt: new Date().toISOString(),
        payload: '{}'
      },
      {
        id: 2,
        name: 'Import Opps',
        type: 'import:opportunities',
        status: 'Failed',
        runAt: new Date().toISOString(),
        payload: '{}'
      }
    ];

    (api as any).listScheduledJobs = vi.fn().mockResolvedValue(jobs);
    (api as any).retryScheduledJob = vi.fn().mockResolvedValue({});

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={client}>
        <Providers>
          <MemoryRouter>
            <AdminImports />
          </MemoryRouter>
        </Providers>
      </QueryClientProvider>
    );

    expect(await screen.findByText('Import Vols')).toBeInTheDocument();
    const retryBtns = await screen.findAllByText('Retry');
    expect(retryBtns.length).toBeGreaterThan(0);

    fireEvent.click(retryBtns[0]);
    await waitFor(() => {
      expect((api as any).retryScheduledJob).toHaveBeenCalledWith(1);
    });
  });
});
