import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Bell, Check, Eye, Link as LinkIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import SkeletonCard from '@/components/atoms/skeleton-card';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useStore } from '@/lib/store';

export default function AdminNotifications() {
  const queryClient = useQueryClient();
  const perPage = 40;
  const {
    data: pages,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery(
    ['admin-notifications'],
    ({ pageParam = 1 }) => api.listNotifications({ page: pageParam, perPage }),
    {
      getNextPageParam: (lastPage: any, _pages: any[]) => {
        if (!lastPage) return undefined;
        const pag = lastPage.data ?? lastPage;
        const meta = pag?.meta ?? lastPage?.meta;
        if (meta && meta.currentPage && meta.lastPage && meta.currentPage < meta.lastPage) return meta.currentPage + 1;
        if (Array.isArray(lastPage) && lastPage.length >= perPage) return (_pages.length || 1) + 1;
        return undefined;
      }
    }
  );
  const items: any[] = (pages?.pages || []).flatMap((p: any) =>
    Array.isArray(p) ? p : (p?.data?.data ?? p?.data ?? [])
  );

  const markReadMutation = useMutation({
    mutationFn: (id: number) => api.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-notifications']);
      queryClient.invalidateQueries(['notifications']);
    }
  });
  const markUnreadMutation = useMutation({
    mutationFn: (id: number) => api.markNotificationUnread(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-notifications']);
      queryClient.invalidateQueries(['notifications']);
    }
  });

  const token = useStore((s) => s.token);

  const navigate = useNavigate();

  const [viewOpen, setViewOpen] = useState(false);
  const [viewing, setViewing] = useState<any | null>(null);

  const [selected, setSelected] = useState<number[]>([]);

  const toggleSelect = (id: number) => {
    setSelected((prev: number[]) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev.concat([id])));
  };

  const renderPayload = (payload: any) => {
    if (!payload) return null;
    const p =
      typeof payload === 'string'
        ? (() => {
            try {
              return JSON.parse(payload);
            } catch (e) {
              return payload;
            }
          })()
        : payload;

    // If it's a plain object with primitive values, render key: value lines
    if (p && typeof p === 'object' && !Array.isArray(p)) {
      const keys = Object.keys(p);
      const simple = keys.every((k) => {
        const v = p[k];
        return v == null || ['string', 'number', 'boolean'].includes(typeof v);
      });
      if (simple && keys.length > 0) {
        return (
          <div className="space-y-1 text-sm">
            {keys.map((k) => (
              <div key={k} className="flex items-start gap-2">
                <div className="font-medium text-xs text-muted-foreground w-28">{k}</div>
                <div className="text-xs break-words">{String((p as any)[k] ?? '')}</div>
              </div>
            ))}
          </div>
        );
      }
    }

    // fallback: pretty JSON
    return <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-40">{JSON.stringify(p, null, 2)}</pre>;
  };

  const markSelected = async (markRead = true) => {
    const ids = selected.slice();
    await Promise.all(
      ids.map((id: number) => (markRead ? api.markNotificationRead(id) : api.markNotificationUnread(id)))
    );
    setSelected([]);
    queryClient.invalidateQueries(['notifications']);
    queryClient.invalidateQueries(['admin-notifications']);
  };

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
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No notifications
                  </TableCell>
                </TableRow>
              ) : (
                items.map((n: any) => (
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
                          // Prefer friendly rendering for communications payloads
                          const isComm = p.communicationId || p.subject || p.type === 'communication';
                          return (
                            <div className="flex items-start gap-3">
                              {p.image && <img src={p.image} className="h-12 w-12 rounded-md object-cover" alt="" />}
                              <div>
                                <div className="font-medium">{p.subject ?? p.title ?? n.type}</div>
                                <div className="text-xs text-muted-foreground">{renderPayload(p)}</div>
                                {isComm && (
                                  <div className="mt-1 flex items-center gap-2">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        // if communication id present, navigate to admin communication editor
                                        const cid = p.communicationId ?? p.communication_id ?? p.id;
                                        if (cid) navigate(`/admin/communications?edit=${cid}`);
                                      }}
                                    >
                                      <LinkIcon className="h-4 w-4 mr-1" />
                                      Open Communication
                                    </Button>
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
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={async () => {
                            setViewing(n);
                            setViewOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
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
          <div className="mt-4 text-center">
            {isFetchingNextPage ? (
              <div className="text-sm text-muted-foreground">Loading…</div>
            ) : hasNextPage ? (
              <Button variant="outline" size="sm" onClick={() => fetchNextPage()} disabled={isLoading}>
                Load more
              </Button>
            ) : (
              <div className="text-sm text-muted-foreground">End of notifications</div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notification</DialogTitle>
            <DialogDescription>Details for this notification</DialogDescription>
          </DialogHeader>
          <div className="p-4 space-y-3">
            <div className="text-sm text-muted-foreground">When</div>
            <div>{viewing ? new Date(viewing.createdAt || viewing.created_at).toLocaleString() : ''}</div>
            <div className="text-sm text-muted-foreground">Type</div>
            <div>{viewing?.type}</div>
            <div className="text-sm text-muted-foreground">Payload</div>
            <div>{viewing ? renderPayload(viewing.payload) : ''}</div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
