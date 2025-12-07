import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Providers from '@/providers';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('@/lib/api');
import api from '@/lib/api';

vi.mock('@/providers/app-provider', () => ({ useApp: () => ({ user: { isAdmin: true }, authenticated: true }) }));

import AdminOrganizationInvites from '@/pages/admin/organization-invites';

describe('Admin Organization Invites page', () => {
  it('lists invites and supports create/resend/cancel', async () => {
    const invites = [
      { id: 1, email: 'a@example.com', created_at: new Date().toISOString() },
      { id: 2, email: 'b@example.com', created_at: new Date().toISOString() }
    ];

    (api as any).getOrganizationInvites = vi.fn().mockResolvedValue(invites);
    (api as any).sendOrganizationInvite = vi.fn().mockResolvedValue({});
    (api as any).resendOrganizationInvite = vi.fn().mockResolvedValue({});
    (api as any).cancelOrganizationInvite = vi.fn().mockResolvedValue({});

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={client}>
        <Providers>
          <MemoryRouter initialEntries={['/admin/organizations/42/invites']}>
            <Routes>
              <Route path="/admin/organizations/:id/invites" element={<AdminOrganizationInvites />} />
            </Routes>
          </MemoryRouter>
        </Providers>
      </QueryClientProvider>
    );

    expect(await screen.findByText('a@example.com')).toBeInTheDocument();

    // create invite
    const emailInput = await screen.findByPlaceholderText('Email');
    fireEvent.change(emailInput, { target: { value: 'new@example.com' } });
    const sendBtn = await screen.findByText('Send Invite');
    fireEvent.click(sendBtn);
    expect((api as any).sendOrganizationInvite).toHaveBeenCalled();

    // resend first invite
    const resendBtns = await screen.findAllByText('Resend');
    fireEvent.click(resendBtns[0]);
    expect((api as any).resendOrganizationInvite).toHaveBeenCalledWith(42, 1);

    // cancel second invite
    const cancelBtns = await screen.findAllByText('Cancel');
    fireEvent.click(cancelBtns[1]);
    expect((api as any).cancelOrganizationInvite).toHaveBeenCalledWith(42, 2);
  });
});
