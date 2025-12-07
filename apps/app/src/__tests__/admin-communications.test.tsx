import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Providers from '@/providers';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/lib/api');
import api from '@/lib/api';

vi.mock('@/providers/app-provider', () => ({ useApp: () => ({ user: { isAdmin: true }, authenticated: true }) }));

import AdminCommunications from '@/pages/admin/communications';

describe('Admin Communications logs bulk retry', () => {
  it('allows selecting logs and retrying them in bulk', async () => {
    const comms = [{ id: 1, subject: 'Test', status: 'Sent' }];
    (api as any).listCommunications = vi.fn().mockResolvedValue(comms);

    const logs = [
      { id: 100, recipient: 'a@x.com', status: 'Failed', attempts: 1, error: 'boom' },
      { id: 101, recipient: 'b@x.com', status: 'Failed', attempts: 2, error: 'oops' }
    ];

    (api as any).listCommunicationLogs = vi.fn().mockResolvedValue(logs);
    (api as any).bulkRetryCommunicationLogs = vi.fn().mockResolvedValue({});

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={client}>
        <Providers>
          <MemoryRouter>
            <AdminCommunications />
          </MemoryRouter>
        </Providers>
      </QueryClientProvider>
    );

    expect(await screen.findByText('Test')).toBeInTheDocument();

    // open logs for the communication
    const logsBtn = await screen.findByLabelText('Logs 1');
    fireEvent.click(logsBtn);

    // wait for logs table
    expect(await screen.findByText('a@x.com')).toBeInTheDocument();

    const checkboxes = await screen.findAllByRole('checkbox');
    // check each log
    fireEvent.click(checkboxes[0]);
    fireEvent.click(checkboxes[1]);

    // click retry selected
    const retrySelected = await screen.findByText('Retry Selected');
    fireEvent.click(retrySelected);

    expect((api as any).bulkRetryCommunicationLogs).toHaveBeenCalledWith([100, 101]);
  });
});
