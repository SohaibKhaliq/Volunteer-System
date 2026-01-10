import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Check } from 'lucide-react';
import SkeletonCard from '@/components/atoms/skeleton-card';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useStore } from '@/lib/store';
import api from '@/lib/api';
import { NotificationFormatter } from '@/lib/notification-formatter';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const perPage = 20;
  const { t } = useTranslation();
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
    queryClient.invalidateQueries(['notifications']);
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
      const socketRef = { current: null as any };

      import('socket.io-client').then(({ io }) => {
        const SOCKET_URL =
          (import.meta.env.VITE_SOCKET_URL as string) ||
          `${window.location.protocol}//${window.location.hostname}:${(import.meta.env.VITE_SOCKET_PORT as string) || '4001'}`;

        // Check if unmounted
        if (!token) return;

        const socket = io(SOCKET_URL, { auth: { token } });
        socketRef.current = socket;

        socket.on('notification', (data: any) => {
          queryClient.setQueryData(['notifications-infinite'], (old: any) => {
            if (!old) return old;
            const newPages = [...old.pages];
            if (newPages[0]) {
              const pageData = Array.isArray(newPages[0]) ? newPages[0] : (newPages[0].data?.data ?? newPages[0].data ?? []);
              const updatedPage = [data, ...pageData];
              if (Array.isArray(newPages[0])) {
                newPages[0] = updatedPage;
              } else if (newPages[0].data) {
                newPages[0] = { ...newPages[0], data: { ...newPages[0].data, data: updatedPage } };
              }
            }
            return { ...old, pages: newPages };
          });
          queryClient.invalidateQueries(['notifications']);
        });
      });

      return () => {
        if (socketRef.current) socketRef.current.close();
      };
    } catch (e) {
      // ignore in test env
    }

  }, [token]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="relative overflow-hidden bg-primary pt-24 pb-32 mb-8">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:30px_30px]" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-primary/90" />
        <div className="container relative px-4 mx-auto text-center">
          <Badge className="bg-white/10 text-white border-white/20 hover:bg-white/20 mb-6 backdrop-blur-sm px-4 py-1.5 rounded-full">
            <Bell className="w-3.5 h-3.5 mr-2" />
            {t('Stay Informed')}
          </Badge>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-6">
            {t('Your Notifications')}
          </h1>
          <p className="text-primary-foreground/80 text-lg md:text-xl max-w-2xl mx-auto font-medium">
            {t('Keep track of your volunteer activities, messages, and important updates from our community.')}
          </p>
        </div>
      </div>

      <div className="container px-4 mx-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 sticky top-4 z-20 bg-background/80 backdrop-blur-md p-4 rounded-3xl border border-border/50 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl text-primary font-black text-xs px-3">
                {selected.length} {t('Selected')}
              </div>
              <div className="h-6 w-px bg-border/50" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelected([])}
                disabled={selected.length === 0}
                className="rounded-xl font-bold"
              >
                {t('Clear Selection')}
              </Button>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => markSelected(true)}
                disabled={selected.length === 0}
                className="flex-1 md:flex-none rounded-xl font-bold border-primary/20 hover:bg-primary/5 h-10 px-4"
              >
                {t('Mark Read')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => markSelected(false)}
                disabled={selected.length === 0}
                className="flex-1 md:flex-none rounded-xl font-bold border-border/50 h-10 px-4"
              >
                {t('Mark Unread')}
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {isLoading && itemsArr.length === 0 ? (
              [1, 2, 3].map((i) => <SkeletonCard key={i} className="rounded-[2rem] border-border/50" />)
            ) : itemsArr.length === 0 ? (
              <div className="py-24 text-center space-y-6">
                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto">
                  <Bell className="h-10 w-10 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black">{t('No notifications yet')}</h3>
                  <p className="text-muted-foreground text-lg max-w-sm mx-auto">
                    {t("We'll let you know when something important happens in your volunteer community.")}
                  </p>
                </div>
              </div>
            ) : (
              itemsArr.map((n: any) => {
                const isSelected = selected.includes(n.id);
                let payload: any = {};
                try {
                  payload = typeof n.payload === 'string' ? JSON.parse(n.payload) : n.payload || {};
                } catch (e) { }
                const summary = NotificationFormatter.getSummary(n.type, payload);
                const date = new Date(n.createdAt || n.created_at);

                return (
                  <Card
                    key={n.id}
                    className={cn(
                      "border-border/50 rounded-[2rem] transition-all duration-300 group overflow-hidden",
                      !n.read ? "border-primary/30 shadow-2xl shadow-primary/5 bg-card/60" : "opacity-80 hover:opacity-100 bg-card",
                      isSelected && "ring-2 ring-primary ring-offset-2 scale-[1.01]"
                    )}
                  >
                    <CardContent className="p-0">
                      <div className="flex flex-col md:flex-row items-stretch">
                        <div className="flex items-center p-6 md:p-8">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(n.id)}
                            className="w-5 h-5 rounded-lg border-2 border-primary/20 text-primary focus:ring-primary/20 accent-primary"
                          />
                        </div>

                        <div className="flex-1 p-6 md:p-8 md:pl-0 space-y-4">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="rounded-full bg-muted/50 font-bold uppercase tracking-wider text-[10px] px-3">
                                {t(NotificationFormatter.formatType(n.type))}
                              </Badge>
                              {!n.read && (
                                <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                              )}
                            </div>
                            <time className="text-xs font-bold text-muted-foreground whitespace-nowrap bg-muted/30 px-3 py-1 rounded-full">
                              {date.toLocaleDateString()} • {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </time>
                          </div>

                          <div className="flex items-start gap-4">
                            {payload.image && (
                              <div className="relative shrink-0 overflow-hidden rounded-2xl border border-border/50 h-20 w-20 shadow-lg group-hover:scale-105 transition-transform">
                                <img src={payload.image} className="h-full w-full object-cover" alt="" />
                              </div>
                            )}
                            <div className="space-y-1 flex-1">
                              <h4 className="text-lg font-black tracking-tight text-foreground leading-snug">
                                {summary || payload.title || t(NotificationFormatter.formatType(n.type))}
                              </h4>
                              {(payload.message || payload.description) && (summary !== payload.message && summary !== payload.description) && (
                                <p className="text-muted-foreground font-medium leading-relaxed">
                                  {payload.message ?? payload.description}
                                </p>
                              )}
                              {payload.url && (
                                <div className="mt-4">
                                  <Button
                                    className="rounded-xl font-bold h-9 shadow-md shadow-primary/10 hover:shadow-xl hover:translate-y-[-1px] transition-all"
                                    onClick={() => window.open(payload.url, '_blank')}
                                  >
                                    {t(payload.cta ?? 'View Details')}
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="p-6 md:p-8 flex items-center justify-center md:border-l border-border/50 bg-muted/20">
                          <Button
                            variant={n.read ? "ghost" : "outline"}
                            size="icon"
                            onClick={() => n.read ? markUnreadMutation.mutate(n.id) : markReadMutation.mutate(n.id)}
                            className={cn(
                              "h-12 w-12 rounded-2xl shadow-sm transition-all duration-300",
                              !n.read ? "bg-primary text-white hover:bg-primary/90" : "hover:bg-primary/10 hover:text-primary"
                            )}
                          >
                            {n.read ? (
                              <Check className="h-5 w-5" />
                            ) : (
                              <Bell className="h-5 w-5" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}

            <div ref={loadMoreRef} className="py-12 flex flex-col items-center justify-center gap-4">
              {isFetchingNextPage ? (
                <div className="flex items-center gap-3 bg-card px-6 py-3 rounded-full border border-border/50 shadow-lg">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm font-black text-muted-foreground">{t('Loading more...')}</span>
                </div>
              ) : hasNextPage ? (
                <p className="text-sm font-bold text-muted-foreground/60 uppercase tracking-widest">{t('Scroll to Load More')}</p>
              ) : itemsArr.length > 0 && (
                <div className="text-center space-y-2">
                  <div className="h-px w-24 bg-border/50 mx-auto" />
                  <p className="text-sm font-black text-muted-foreground/60 uppercase tracking-widest">{t('End of Stream')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
