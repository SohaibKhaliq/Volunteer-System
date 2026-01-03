import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Providers from '@/providers';

// mock user as admin and authenticated
vi.mock('@/providers/app-provider', () => ({
  useApp: () => ({
    user: { firstName: 'Admin', lastName: 'User', email: 'admin@example.com', isAdmin: true },
    authenticated: true
  })
}));

// mock admin summary counts so badges render predictably
vi.mock('@/hooks/useAdminSummary', () => ({
  default: () => ({ data: { backgroundChecksPending: 1, importsPending: 2, pendingHours: 3, unreadNotifications: 4 } })
}));

// default mock for features; tests will override implementation per-case
vi.mock('@/hooks/useFeatures', () => ({
  default: vi.fn(() => ({ data: { dataOps: true, analytics: false, monitoring: false, scheduling: false } }))
}));

import AdminLayout from '@/components/templates/AdminLayout';
import api from '@/lib/api';

vi.mock('@/lib/api');
const mockedApi = api as any;

describe('AdminLayout feature gating', () => {
  it('shows Imports link when dataOps feature is enabled by server', async () => {
    const mockedUseFeatures = require('@/hooks/useFeatures').default as any;
    mockedUseFeatures.mockImplementation(() => ({
      data: { dataOps: true, analytics: false, monitoring: false, scheduling: false }
    }));
    mockedApi.getAdminFeatures = vi.fn().mockResolvedValue({ dataOps: true, analytics: false, monitoring: false, scheduling: false });

    render(
      <Providers>
        <MemoryRouter initialEntries={['/admin']}>
          <AdminLayout />
        </MemoryRouter>
      </Providers>
    );

    expect(await screen.findByText('Imports')).toBeInTheDocument();
  });

  it('hides Imports link when dataOps feature is disabled', async () => {
    const mockedUseFeatures = require('@/hooks/useFeatures').default as any;
    mockedUseFeatures.mockImplementation(() => ({
      data: { dataOps: false, analytics: false, monitoring: false, scheduling: false }
    }));

    render(
      <Providers>
        <MemoryRouter initialEntries={['/admin']}>
          <AdminLayout />
        </MemoryRouter>
      </Providers>
    );

    const maybeImports = screen.queryByText('Imports');
    expect(maybeImports).toBeNull();
  });

  it('clicking the imports badge navigates to imports page', async () => {
    const mockedUseFeatures = require('@/hooks/useFeatures').default as any;
    mockedUseFeatures.mockImplementation(() => ({
      data: { dataOps: true, analytics: false, monitoring: false, scheduling: false }
    }));

    const rrd = await import('react-router-dom');
    const navMock = vi.fn();
    vi.spyOn(rrd, 'useNavigate').mockImplementation(() => navMock as any);

    render(
      <Providers>
        <MemoryRouter initialEntries={['/admin']}>
          <AdminLayout />
        </MemoryRouter>
      </Providers>
    );

    // imports badge shows '2' per useAdminSummary mock
    const badge = await screen.findByText('2');
    expect(badge).toBeTruthy();
    fireEvent.click(badge);

    expect(navMock).toHaveBeenCalled();
    // ensure it navigated to admin imports path
    expect(navMock.mock.calls[0][0]).toContain('/admin/imports');
  });

  it('clicking the pending-hours badge navigates to pending-hours page', async () => {
    const mockedUseFeatures = require('@/hooks/useFeatures').default as any;
    mockedUseFeatures.mockImplementation(() => ({
      data: { dataOps: true, analytics: false, monitoring: false, scheduling: false }
    }));

    const rrd = await import('react-router-dom');
    const navMock = vi.fn();
    vi.spyOn(rrd, 'useNavigate').mockImplementation(() => navMock as any);

    render(
      <Providers>
        <MemoryRouter initialEntries={['/admin']}>
          <AdminLayout />
        </MemoryRouter>
      </Providers>
    );

    const pendingBadge = await screen.findByText('3');
    expect(pendingBadge).toBeTruthy();
    fireEvent.click(pendingBadge);

    expect(navMock).toHaveBeenCalled();
    expect(navMock.mock.calls[0][0]).toContain('/admin/pending-hours');
  });
});
