import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Providers from '@/providers';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/lib/api');
import api from '@/lib/api';

// mock admin user
vi.mock('@/providers/app-provider', () => ({
  useApp: () => ({
    user: { firstName: 'Admin', lastName: 'User', email: 'admin@example.com', isAdmin: true },
    authenticated: true
  })
}));

import AdminSettings from '@/pages/admin/settings';

describe('AdminSettings features tab', () => {
  it('renders toggles and submits updates', async () => {
    const mockGet = ((api as any).getSystemSettings = vi
      .fn()
      .mockResolvedValue({ dataOps: false, analytics: true, monitoring: false, scheduling: true }));
    const mockUpdate = ((api as any).updateSystemSettings = vi.fn().mockResolvedValue({ message: 'ok' }));

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <Providers>
          <MemoryRouter>
            <AdminSettings />
          </MemoryRouter>
        </Providers>
      </QueryClientProvider>
    );

    // Wait for toggles to appear (find any switch element)
    const switches = await screen.findAllByRole('switch');
    expect(switches.length).toBeGreaterThan(0);
    const toggle = switches[0];
    expect(toggle).toBeTruthy();

    // Toggle dataOps on
    fireEvent.click(toggle);

    // Click save
    const saveBtn = screen.getByRole('button', { name: /Save Changes/i });
    fireEvent.click(saveBtn);

    // ensure updateSystemSettings called with features key
    expect(mockUpdate).toHaveBeenCalled();
    const calledWith = mockUpdate.mock.calls[0][0];
    expect(calledWith.features).toBeTruthy();
    expect(calledWith.features.dataOps === true || calledWith.features.dataOps === 'true').toBeTruthy();
  });

  it('allows editing features as raw JSON and saves', async () => {
    const mockGetRaw = ((api as any).getSystemSettings = vi
      .fn()
      .mockResolvedValue({ features: { dataOps: false, analytics: true, monitoring: false, scheduling: true } }));
    const mockUpdate = ((api as any).updateSystemSettings = vi.fn().mockResolvedValue({ message: 'ok' }));

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <Providers>
          <MemoryRouter>
            <AdminSettings />
          </MemoryRouter>
        </Providers>
      </QueryClientProvider>
    );

    // open the features tab
    const featuresTab = await screen.findByText('Features');
    fireEvent.click(featuresTab);

    // open raw JSON editor
    const rawBtn = await screen.findByRole('button', { name: /Raw JSON/i });
    fireEvent.click(rawBtn);

    const ta = await screen.findByRole('textbox');
    // replace JSON text: set dataOps true
    fireEvent.change(ta, { target: { value: JSON.stringify({ dataOps: true, analytics: true }, null, 2) } });

    // click Save Changes
    const saveBtn = screen.getByRole('button', { name: /Save Changes/i });
    fireEvent.click(saveBtn);

    // update was called
    expect(mockUpdate).toHaveBeenCalled();
    const updateArg = mockUpdate.mock.calls[0][0];
    expect(updateArg.features).toBeTruthy();
    expect(updateArg.features.dataOps === true || updateArg.features.dataOps === 'true').toBeTruthy();
  });
});
