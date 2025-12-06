import { useEffect, useRef, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Bell, Check } from 'lucide-react';
import SkeletonCard from '@/components/atoms/skeleton-card';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useStore } from '@/lib/store';
import api from '@/lib/api';

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const perPage = 20;
  const {
    data: pages,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery(
    ['notifications-infinite'],
    ({ pageParam = 1 }) => api.listNotifications({ page: pageParam, perPage }),
    {
      getNextPageParam: (lastPage: any, _pages: any[]) => {
        if (!lastPage) return undefined;
        const pag = lastPage.data ?? lastPage;
        const meta = pag?.meta ?? lastPage?.meta;
        if (meta && meta.currentPage && meta.lastPage && meta.currentPage < meta.lastPage) {
          return meta.currentPage + 1;
        }
        if (Array.isArray(lastPage) && lastPage.length >= perPage) return (_pages.length || 1) + 1;
        return undefined;
      }
    }
  );

  const itemsArr: any[] = (pages?.pages || []).flatMap((p: any) =>
    Array.isArray(p) ? p : (p?.data?.data ?? p?.data ?? [])
  );

  const [selected, setSelected] = useState<number[]>([]);

  const toggleSelect = (id: number) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev.concat([id])));
  };

  const markSelected = async (markRead = true) => {
    const ids = selected.slice();
    await Promise.all(ids.map((id) => (markRead ? api.markNotificationRead(id) : api.markNotificationUnread(id))));
    setSelected([]);
    queryClient.invalidateQueries(['notifications-infinite']);
  };

  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, [loadMoreRef.current, hasNextPage, isFetchingNextPage]);

  const markReadMutation = useMutation({
    mutationFn: (id: number) => api.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications-infinite']);
      queryClient.invalidateQueries(['notifications']);
    }
  });

  const markUnreadMutation = useMutation({
    mutationFn: (id: number) => api.markNotificationUnread(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications-infinite']);
      queryClient.invalidateQueries(['notifications']);
    }
  });

  const token = useStore((s) => s.token);

  useEffect(() => {
    if (!token) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { io } = require('socket.io-client');
      const SOCKET_URL =
        (import.meta.env.VITE_SOCKET_URL as string) ||
        `${window.location.protocol}//${window.location.hostname}:${(import.meta.env.VITE_SOCKET_PORT as string) || '4001'}`;
      const socket = io(SOCKET_URL, { auth: { token } });
      socket.on('notification', (data: any) => {
        queryClient.setQueryData(['notifications'], (old: any) => {
          const arr = Array.isArray(old) ? old : (old?.data ?? []);
          return [data].concat(arr || []).slice(0, 200);
        });
      });

      return () => socket.close();
    } catch (e) {
      // ignore in test env
    }
  }, [token]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => markSelected(true)} disabled={selected.length === 0}>
                Mark selected read
              </Button>
              <Button size="sm" variant="ghost" onClick={() => markSelected(false)} disabled={selected.length === 0}>
                Mark selected unread
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">{selected.length} selected</div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead />
                <TableHead>When</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <SkeletonCard />
                  </TableCell>
                </TableRow>
              ) : itemsArr.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No notifications
                  </TableCell>
                </TableRow>
              ) : (
                itemsArr.map((n: any) => (
                  <TableRow key={n.id}>
                    <TableCell>
                      <input type="checkbox" checked={selected.includes(n.id)} onChange={() => toggleSelect(n.id)} />
                    </TableCell>
                    <TableCell>{new Date(n.createdAt || n.created_at).toLocaleString()}</TableCell>
                    <TableCell>{n.type}</TableCell>
                    <TableCell>
                      {(() => {
                        try {
                          const p = typeof n.payload === 'string' ? JSON.parse(n.payload) : n.payload || {};
                          return (
                            <div className="flex items-start gap-3">
                              {p.image && <img src={p.image} className="h-12 w-12 rounded-md object-cover" alt="" />}
                              <div>
                                <div className="font-medium">{p.title ?? n.type}</div>
                                <div className="text-xs text-muted-foreground">
                                  {p.message ??
                                    p.description ??
                                    (typeof n.payload === 'string' ? n.payload : JSON.stringify(n.payload))}
                                </div>
                                {p.url && (
                                  <div className="mt-1">
                                    <a href={p.url} target="_blank" rel="noreferrer" className="text-primary text-sm">
                                      {p.cta ?? 'Open'}
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        } catch (e) {
                          return String(n.payload);
                        }
                      })()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {!n.read ? (
                          <Button
                            size="sm"
                            onClick={() => markReadMutation.mutate(n.id)}
                            aria-label={`Mark ${n.id} read`}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => markUnreadMutation.mutate(n.id)}>
                            Unread
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <div ref={loadMoreRef} className="mt-4 text-center">
            {isFetchingNextPage ? (
              <div className="text-sm text-muted-foreground">Loading…</div>
            ) : hasNextPage ? (
              <div className="text-sm text-muted-foreground">Scroll to load more</div>
            ) : (
              <div className="text-sm text-muted-foreground">End of notifications</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
