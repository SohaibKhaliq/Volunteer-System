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
    (api as any).getInviteSendJobsStats = vi
      .fn()
      .mockResolvedValue({ data: { total: 2, byStatus: { sent: 1, failed: 1 }, successRate: 50 } });
    const mockRetry = ((api as any).retryInviteSendJob = vi.fn().mockResolvedValue({}));
    // make retryAll return a deferred promise so we can test the loading state
    let resolver: any;
    const deferred = new Promise((resolve) => {
      resolver = resolve;
    });
    (api as any).retryAllFailedInviteSendJobs = vi.fn().mockReturnValue(deferred);
    (api as any).getAdminActivity = vi.fn().mockResolvedValue({
      data: [
        {
          id: 1,
          action: 'invite_send_jobs_requeue_completed',
          created_at: new Date().toISOString(),
          metadata: { requeued: 2 }
        }
      ]
    });

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
    // metrics should be visible
    expect(await screen.findByText('Total Jobs')).toBeInTheDocument();
    expect(await screen.findByText('50%')).toBeInTheDocument();

    const retryBtn = await screen.findAllByText('Retry');
    fireEvent.click(retryBtn[0]);
    expect(mockRetry).toHaveBeenCalledWith(1);

    // view details
    const viewBtn = await screen.findAllByText('View');
    fireEvent.click(viewBtn[0]);
    expect(await screen.findByText('Invite ID: 42')).toBeInTheDocument();
    // check JSON invite email is visible in the dialog pre-render
    expect(await screen.findByText(/"email": "a@test"/)).toBeInTheDocument();

    // bulk retry - confirm true
    const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true as unknown as boolean);
    const bulkBtn = await screen.findByText('Retry all failed');
    fireEvent.click(bulkBtn);
    expect((api as any).retryAllFailedInviteSendJobs).toHaveBeenCalled();
    // while the promise is pending the button should show 'Requeueing...'
    expect(bulkBtn).toBeDisabled();
    expect(bulkBtn.textContent).toContain('Requeueing');
    // resolve the deferred to finish the mutation
    resolver({ data: { requeued: 2 } });
    confirmSpy.mockRestore();
  });

  it('allows filtering and pagination interactions', async () => {
    const jobsPage1 = {
      data: [{ id: 1, organizationInviteId: 101, status: 'failed', attempts: 1, invite: { email: 'a@test' } }],
      meta: { current_page: 1, last_page: 2, total: 2, per_page: 1 }
    };

    const jobsPage2 = {
      data: [{ id: 2, organizationInviteId: 102, status: 'failed', attempts: 2, invite: { email: 'b@test' } }],
      meta: { current_page: 2, last_page: 2, total: 2, per_page: 1 }
    };

    const mockList = vi.fn().mockResolvedValueOnce(jobsPage1).mockResolvedValueOnce(jobsPage2);
    (api as any).getInviteSendJobsStats = vi
      .fn()
      .mockResolvedValue({ data: { total: 2, byStatus: { sent: 1, failed: 1 }, successRate: 50 } });
    (api as any).listInviteSendJobs = mockList;
    (api as any).getAdminActivity = vi.fn().mockResolvedValue({ data: [] });

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

    // initial load should call API once
    expect(await screen.findByText('Invite #101')).toBeInTheDocument();
    expect(mockList).toHaveBeenCalledTimes(1);

    // type a search and apply filters
    const searchInput = await screen.findByPlaceholderText('Search by email or invite id');
    fireEvent.change(searchInput, { target: { value: 'a@test' } });
    const applyBtn = await screen.findByText('Apply Filters');
    fireEvent.click(applyBtn);

    // listInviteSendJobs should be called again for filtered data
    expect(mockList).toHaveBeenCalled();

    // click next page
    const nextBtn = await screen.findByText('Next');
    fireEvent.click(nextBtn);
    // second page call should have occurred
    expect(mockList).toHaveBeenCalledTimes(2);
  });
});
