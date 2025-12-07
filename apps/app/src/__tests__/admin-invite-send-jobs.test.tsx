import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Providers from '@/providers';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/lib/api');
import api from '@/lib/api';

vi.mock('@/providers/app-provider', () => ({ useApp: () => ({ user: { isAdmin: true }, authenticated: true }) }));

import AdminInviteSendJobs from '@/pages/admin/invite-send-jobs';

describe('Admin Invite Send Jobs page', () => {
  it('lists jobs and supports retry and view details', async () => {
    const jobs = [
      {
        id: 1,
        organizationInviteId: 42,
        status: 'Failed',
        attempts: 2,
        lastError: 'boom',
        invite: { email: 'a@test' }
      },
      { id: 2, organizationInviteId: 43, status: 'pending', attempts: 0 }
    ];

    (api as any).listInviteSendJobs = vi.fn().mockResolvedValue(jobs);
    const mockRetry = ((api as any).retryInviteSendJob = vi.fn().mockResolvedValue({}));

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={client}>
        <Providers>
          <MemoryRouter>
            <AdminInviteSendJobs />
          </MemoryRouter>
        </Providers>
      </QueryClientProvider>
    );

    expect(await screen.findByText('Invite #42')).toBeInTheDocument();

    const retryBtn = await screen.findAllByText('Retry');
    fireEvent.click(retryBtn[0]);
    expect(mockRetry).toHaveBeenCalledWith(1);

    // view details
    const viewBtn = await screen.findAllByText('View');
    fireEvent.click(viewBtn[0]);
    expect(await screen.findByText('Invite ID: 42')).toBeInTheDocument();
    // check JSON invite email is visible in the dialog pre-render
    expect(await screen.findByText(/"email": "a@test"/)).toBeInTheDocument();
  });
});
