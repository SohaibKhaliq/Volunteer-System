import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Providers from '@/providers';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/lib/api');
import api from '@/lib/api';

vi.mock('@/providers/app-provider', () => ({ useApp: () => ({ user: { isAdmin: true }, authenticated: true }) }));

import AdminScheduledJobs from '@/pages/admin/scheduled-jobs';

describe('Admin Scheduled Jobs page', () => {
  it('lists jobs and supports retry/create', async () => {
    const jobs = [
      {
        id: 1,
        name: 'Job A',
        type: 'email',
        status: 'Failed',
        runAt: new Date().toISOString(),
        payload: { sample: 'payload' },
        attempts: 2,
        lastError: 'boom'
      },
      { id: 2, name: 'Job B', type: 'sync', status: 'Scheduled', runAt: new Date().toISOString(), attempts: 0 }
    ];

    (api as any).listScheduledJobs = vi.fn().mockResolvedValue(jobs);

    const mockRetry = ((api as any).retryScheduledJob = vi.fn().mockResolvedValue({}));
    const mockCreate = ((api as any).createScheduledJob = vi.fn().mockResolvedValue({}));

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={client}>
        <Providers>
          <MemoryRouter>
            <AdminScheduledJobs />
          </MemoryRouter>
        </Providers>
      </QueryClientProvider>
    );

    expect(await screen.findByText('Job A')).toBeInTheDocument();

    // click retry on first job
    const retryBtn = await screen.findAllByText('Retry');
    fireEvent.click(retryBtn[0]);
    await waitFor(() => {
      expect(mockRetry).toHaveBeenCalledWith(1);
    });

    // view details for first job
    const viewBtn = await screen.findAllByText('View');
    fireEvent.click(viewBtn[0]);
    // JSON payload should be visible
    expect(await screen.findByText('"sample": "payload"')).toBeInTheDocument();

    // retry from details dialog
    const dialogRetryBtn = await screen.findAllByText('Retry');
    // second retry button will be the dialog retry after popping the dialog
    fireEvent.click(dialogRetryBtn[1]);
    expect(mockRetry).toHaveBeenCalledWith(1);

    // create a job
    const nameInput = await screen.findByPlaceholderText('Name');
    const typeInput = await screen.findByPlaceholderText('Type');
    const runAtInput = await screen.findByPlaceholderText('Run At (ISO datetime)');
    fireEvent.change(nameInput, { target: { value: 'X' } });
    fireEvent.change(typeInput, { target: { value: 't' } });
    fireEvent.change(runAtInput, { target: { value: new Date().toISOString() } });
    const createBtn = await screen.findByText('Create');
    fireEvent.click(createBtn);
    expect(mockCreate).toHaveBeenCalled();
  });
});
