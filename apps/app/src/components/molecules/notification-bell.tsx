import { useEffect, useRef } from 'react';
import { Bell, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useStore } from '@/lib/store';
import api from '@/lib/api';
import { toast } from '@/components/atoms/use-toast';
import { useNavigate } from 'react-router-dom';
import { NotificationFormatter } from '@/lib/notification-formatter';

export default function NotificationBell() {
  const queryClient = useQueryClient();
  const token = useStore((s) => s.token);
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.listNotifications(),
    // poll for new notifications occasionally so users see them without manual refresh
    refetchInterval: 15000
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => api.markNotificationRead(id),
    onSuccess: () => queryClient.invalidateQueries(['notifications'])
  });

  const markUnreadMutation = useMutation({
    mutationFn: (id: number) => api.markNotificationUnread(id),
    onSuccess: () => queryClient.invalidateQueries(['notifications'])
  });

  const itemsArr: any[] = Array.isArray(items)
    ? (items as any[])
    : items?.data && Array.isArray(items.data)
      ? (items.data as any[])
      : [];
  const unread = (itemsArr || []).filter((n: any) => !n.read);
  const unreadCount = unread.length;

  const prevIdsRef = useRef<number[]>([]);
  const initial = useRef(true);
  const navigate = useNavigate();

  useEffect(() => {
    // notify about newly fetched unread notifications (but not on initial load)
    const currentUnreadIds = itemsArr.filter((n: any) => !n.read).map((n: any) => n.id);
    if (!initial.current) {
      const newIds = currentUnreadIds.filter((id) => !prevIdsRef.current.includes(id));
      if (newIds.length > 0) {
        // show a summarized toast for new notifications
        const newNotes = itemsArr.filter((n: any) => newIds.includes(n.id));
        // ONLY show 1 toast for the latest notification to prevent stacking
        const latestInfo = newNotes[0];
        if (latestInfo) {
          const type = latestInfo.type || 'Notification';
          const p = latestInfo.payload ? (typeof latestInfo.payload === 'string' ? JSON.parse(latestInfo.payload) : latestInfo.payload) : {};

          const title = NotificationFormatter.formatType(type);
          const description = NotificationFormatter.getSummary(type, p) || 'You have a new notification';

          toast({
            title: title,
            description: description,
          }, {
            id: 'latest-notification' // Enforce singleton
          });
        }
      }
    }

    prevIdsRef.current = currentUnreadIds;
    initial.current = false;
  }, [items]);

  // Attempt WebSocket connection using socket.io for realtime notifications
  useEffect(() => {
    if (!token) return;

    let socket: any = null;
    try {
      // Build socket URL from environment: VITE_SOCKET_URL or default to same host on port 4001
      const SOCKET_URL =
        (import.meta.env.VITE_SOCKET_URL as string) ||
        `${window.location.protocol}//${window.location.hostname}:${(import.meta.env.VITE_SOCKET_PORT as string) || '4001'}`;
      // Dynamically import socket.io-client so tests can mock it
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      import('socket.io-client').then(({ io }) => {
        socket = io(SOCKET_URL, { auth: { token }, transports: ['websocket'], reconnection: true });

        socket.on('connect', () => {
          // console.debug('Socket connected');
        });

        socket.on('notification', (data: any) => {
          try {
            queryClient.setQueryData(['notifications'], (old: any) => {
              const arr = Array.isArray(old) ? old : (old?.data ?? []);
              const updated = [data].concat(arr || []);
              return updated.slice(0, 100);
            });
          } catch (e) {
            // ignore
          }
        });

        socket.on('disconnect', () => {
          // fallback to polling handled by react-query
        });
      });
    } catch (e) {
      // dynamic import failed (e.g. tests), allow polling fallback
    }

    return () => {
      try {
        socket?.close();
      } catch (e) { }
    };
  }, [token]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 rounded-full bg-red-600 text-white h-5 w-5 grid place-items-center text-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="px-4 py-2 border-b">
          <div className="flex items-center justify-between">
            <div className="font-medium">Notifications</div>
            <div className="text-sm text-muted-foreground">{unreadCount} unread</div>
          </div>
        </div>
        {isLoading ? (
          <div className="p-4 text-sm">Loading…</div>
        ) : itemsArr.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">No notifications</div>
        ) : (
          <div className="flex flex-col max-h-64 overflow-auto">
            {itemsArr.slice(0, 20).map((n: any) => {
              let title = '';
              let description = '';
              try {
                const p = n.payload ? (typeof n.payload === 'string' ? JSON.parse(n.payload) : n.payload) : {};
                title = NotificationFormatter.formatType(n.type);
                description = NotificationFormatter.getSummary(n.type, p) || p.message || p.description || n.type;
              } catch (e) {
                title = n.type;
                description = String(n.payload || '');
              }

              return (
                <DropdownMenuItem
                  key={n.id}
                  className="flex items-start gap-2 py-2 hover:bg-surface"
                  onClick={() => {
                    // Mark read then navigate (if related)
                    if (!n.read) markReadMutation.mutate(n.id);
                    if (n.type === 'achievement_awarded') navigate('/profile');
                    else if (n.type === 'assignment_cancelled') navigate('/profile');
                  }}
                >
                  <div className="flex-1 text-sm">
                    <div className="font-medium">
                      {title}
                    </div>
                    <div className="text-xs text-muted-foreground line-clamp-2">{description}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(n.createdAt || n.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  {n.read ? (
                    <div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          markUnreadMutation.mutate(n.id);
                        }}
                        aria-label={`Mark ${n.id} unread`}
                      >
                        Unread
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          markReadMutation.mutate(n.id);
                        }}
                        aria-label={`Mark ${n.id} read`}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </DropdownMenuItem>
              );
            })}
          </div>
        )}
        <div className="p-2 border-t text-center">
          <Button variant="ghost" size="sm" onClick={() => navigate('/notifications')}>
            View all
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
