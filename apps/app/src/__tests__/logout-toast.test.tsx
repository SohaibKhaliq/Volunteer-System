import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Header from '@/components/molecules/header';
import api from '@/lib/api';
import { useStore } from '@/lib/store';

vi.mock('@/lib/api');
vi.mock('socket.io-client', () => ({ io: () => ({ on: () => {}, close: () => {} }) }));

const mockedApi = api as any;

function TestApp() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, suspense: false } } });
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/']}>
        <Header />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('Header logout flow', () => {
  it('shows toast and navigates on logout', async () => {
    mockedApi.logout = vi.fn().mockResolvedValue({ message: 'Logout successful' });
    // Ensure notifications API calls used by the header are mocked during the test
    mockedApi.listNotifications = vi.fn().mockResolvedValue([]);
    mockedApi.markNotificationRead = vi.fn().mockResolvedValue({});
    mockedApi.markNotificationUnread = vi.fn().mockResolvedValue({});

    // Set token in store
    const setToken = useStore.getState().setToken;
    setToken('sometoken');

    render(<TestApp />);

    const btn = await screen.findByText(/Logout/i);
    fireEvent.click(btn);

    await waitFor(() => {
      expect(mockedApi.logout).toHaveBeenCalled();
    });
  });
});
