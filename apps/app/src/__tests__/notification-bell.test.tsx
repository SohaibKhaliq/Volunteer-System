import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import NotificationBell from '@/components/molecules/notification-bell';
import api from '@/lib/api';

vi.mock('@/lib/api');
vi.mock('socket.io-client', () => ({ io: () => ({ on: () => {}, close: () => {} }) }));

const mockedApi = api as any;

function TestApp() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <NotificationBell />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('NotificationBell', () => {
  it('shows unread count and allows marking read', async () => {
    mockedApi.listNotifications = vi.fn().mockResolvedValue([
      {
        id: 1,
        userId: 5,
        type: 'achievement_awarded',
        payload: JSON.stringify({ key: 'x', title: 'X' }),
        read: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        userId: 5,
        type: 'assignment_cancelled',
        payload: JSON.stringify({ assignmentId: 33 }),
        read: true,
        createdAt: new Date().toISOString()
      }
    ]);
    mockedApi.markNotificationRead = vi.fn().mockResolvedValue({});
    mockedApi.markNotificationUnread = vi.fn().mockResolvedValue({});

    render(<TestApp />);

    // expect unread badge to appear
    expect(await screen.findByText('1')).toBeTruthy();

    // open dropdown
    const btn = screen.getByRole('button');
    fireEvent.click(btn);

    // should show 'Earned:' message
    expect(await screen.findByText(/Earned:/i)).toBeTruthy();

    // click the mark read button
    const markButtons = screen.getAllByRole('button', { name: /Mark .* read|Unread/ });
    // Click the first mark-read button for the unread item
    fireEvent.click(markButtons[0]);

    await waitFor(() => {
      expect(mockedApi.markNotificationRead).toHaveBeenCalled();
    });
  });
});
