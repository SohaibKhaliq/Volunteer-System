import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@/test-utils';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/lib/api');
import api from '@/lib/api';
import AppProvider from '@/providers/app-provider';

// mock admin user
vi.mock('@/providers/app-provider', () => ({
  __esModule: true,
  default: ({ children }: any) => <div>{children}</div>,
  useApp: () => ({
    user: { id: 1, name: 'Admin', role: 'admin' },
    isAuthenticated: true
  })
}));

import AdminSettings from '@/pages/admin/settings';

describe('AdminSettings features tab', () => {
  it('renders toggles and submits updates', async () => {
    const mockGet = ((api as any).getSystemSettings = vi
      .fn()
      .mockResolvedValue({ dataOps: false, analytics: true, monitoring: false, scheduling: true }));
    const mockUpdate = ((api as any).updateSystemSettings = vi.fn().mockResolvedValue({ message: 'ok' }));

    render(
      <MemoryRouter>
        <AdminSettings />
      </MemoryRouter>
    );

    // Wait for toggles to appear (find any switch element)
    const toggle = await screen.findByRole('switch', { name: /dataOps/i }, { timeout: 3000 });
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

    render(
      <MemoryRouter>
        <AdminSettings />
      </MemoryRouter>
    );

    // open the features tab
    const featuresTab = await screen.findByRole('tab', { name: /Features/i });
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

  it('saves branding settings via updateBranding', async () => {
    const mockGet = ((api as any).getSystemSettings = vi
      .fn()
      .mockResolvedValue({ platform_name: 'Old', primary_color: '#000000' }));
    const mockBrand = ((api as any).updateBranding = vi.fn().mockResolvedValue({ message: 'ok' }));

    const { user } = render(
      <AppProvider>
        <AdminSettings />
      </AppProvider>
    );

    // switch to Branding tab
    const brandingTab = await screen.findByRole('tab', { name: /Branding/i });
    await user.click(brandingTab);

    // Wait for tab content to render
    const nameInput = await screen.findByLabelText(/Platform Name/i, {}, { timeout: 4000 });
    fireEvent.change(nameInput, { target: { value: 'Branded Platform' } });

    const saveBtn = await screen.findByText('Save Branding');
    fireEvent.click(saveBtn);

    expect((api as any).updateBranding).toHaveBeenCalled();
  });
});
