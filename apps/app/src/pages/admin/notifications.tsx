import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useStore } from '@/lib/store';
import { NotificationFormatter } from '@/lib/notification-formatter';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';

import {
  Bell,
  Check,
  Eye,
  Link as LinkIcon,
  MoreVertical,
  MailOpen,
  Mail,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/atoms/use-toast';

export default function AdminNotifications() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const token = useStore((s) => s.token);

  // State
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(20);

  // Selection
  const [selected, setSelected] = useState<number[]>([]);

  // View Dialog
  const [viewOpen, setViewOpen] = useState(false);
  const [viewing, setViewing] = useState<any | null>(null);

  // Notifications Query
  const { data: res, isLoading, isPreviousData } = useQuery(
    ['admin-notifications', page, perPage],
    () => api.listNotifications({ page, perPage }),
    { keepPreviousData: true }
  );

  const notifications = Array.isArray(res?.data) ? res.data : [];
  const meta = res?.meta || {};

  // Mutations
  const markReadMutation = useMutation({
    mutationFn: (id: number) => api.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-notifications']);
      queryClient.invalidateQueries(['notifications']);
      toast({ title: 'Marked as read' });
    }
  });

  const markUnreadMutation = useMutation({
    mutationFn: (id: number) => api.markNotificationUnread(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-notifications']);
      queryClient.invalidateQueries(['notifications']);
      toast({ title: 'Marked as unread' });
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.markAllNotificationsRead(), // Assuming this exists or we iterate
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-notifications']);
      queryClient.invalidateQueries(['notifications']);
      toast({ title: 'All marked as read' });
    }
  });

  // Socket listener for real-time updates
  useEffect(() => {
    if (!token) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { io } = require('socket.io-client');
      const SOCKET_URL =
        (import.meta.env.VITE_SOCKET_URL as string) ||
        `${window.location.protocol}//${window.location.hostname}:${(import.meta.env.VITE_SOCKET_PORT as string) || '4001'}`;
      const socket = io(SOCKET_URL, { auth: { token } });

      socket.on('notification', () => {
        // Just invalidate to refresh list
        queryClient.invalidateQueries(['admin-notifications']);
      });

      return () => socket.close();
    } catch (e) {
      // ignore
    }
  }, [token, queryClient]);


  // Helpers
  const toggleSelect = (id: number) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const markSelected = async (read: boolean) => {
    if (selected.length === 0) return;

    // Process in batches or parallel
    await Promise.all(
      selected.map(id => read ? api.markNotificationRead(id) : api.markNotificationUnread(id))
    );

    setSelected([]);
    queryClient.invalidateQueries(['admin-notifications']);
    queryClient.invalidateQueries(['notifications']);
    toast({ title: `Marked ${selected.length} notifications as ${read ? 'read' : 'unread'}` });
  };

  const renderPayloadSummary = (n: any) => {
    try {
      const payload = typeof n.payload === 'string' ? JSON.parse(n.payload) : n.payload || {};

      // Use formatter for summary
      const summary = NotificationFormatter.getSummary(n.type, payload);
      if (summary) return <span className="font-medium text-foreground">{summary}</span>;

      // Fallback logic from original
      const isComm = payload.communicationId || payload.subject || payload.type === 'communication';
      return (
        <span className="text-muted-foreground">
          {payload.subject ?? payload.title ?? payload.message ?? 'No details'}
        </span>
      );
    } catch (e) {
      return <span className="text-muted-foreground italic">Invalid payload data</span>;
    }
  };

  const renderPayloadDetails = (payload: any) => {
    if (!payload) return null;
    const p = typeof payload === 'string' ? JSON.parse(payload) : payload;

    if (p && typeof p === 'object' && !Array.isArray(p)) {
      return (
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          {Object.entries(p).map(([key, value]) => {
            if (key === 'image' || typeof value === 'object') return null; // Skip complex/image for list
            return (
              <div key={key} className="flex flex-col">
                <span className="text-xs font-semibold text-muted-foreground">
                  {NotificationFormatter.formatKey(key)}
                </span>
                <span className="break-all">{String(value)}</span>
              </div>
            );
          })}
        </div>
      );
    }
    return <pre className="text-xs bg-muted p-2 rounded max-h-40 overflow-auto">{JSON.stringify(p, null, 2)}</pre>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">System Notifications</h2>
          <p className="text-muted-foreground">Monitor and manage system-wide alerts and messages.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries(['admin-notifications'])}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border">
        <div className="flex items-center gap-2">
          {selected.length > 0 ? (
            <>
              <span className="text-sm font-medium mr-2">{selected.length} selected</span>
              <Button size="sm" variant="outline" onClick={() => markSelected(true)}>
                <MailOpen className="h-4 w-4 mr-2" /> Mark Read
              </Button>
              <Button size="sm" variant="outline" onClick={() => markSelected(false)}>
                <Mail className="h-4 w-4 mr-2" /> Mark Unread
              </Button>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">Select items to perform bulk actions</span>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <input
                  type="checkbox"
                  checked={notifications.length > 0 && selected.length === notifications.length}
                  onChange={(e) => {
                    if (e.target.checked) setSelected(notifications.map((n: any) => n.id));
                    else setSelected([]);
                  }}
                />
              </TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Content</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">Loading notifications...</TableCell>
              </TableRow>
            ) : notifications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  No notifications found.
                </TableCell>
              </TableRow>
            ) : (
              notifications.map((n: any) => (
                <TableRow key={n.id} className={n.read ? 'bg-muted/30' : ''}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selected.includes(n.id)}
                      onChange={() => toggleSelect(n.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium text-sm">
                    {NotificationFormatter.formatType(n.type)}
                  </TableCell>
                  <TableCell>
                    {renderPayloadSummary(n)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {new Date(n.createdAt || n.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {n.read ? (
                      <Badge variant="outline" className="text-muted-foreground">Read</Badge>
                    ) : (
                      <Badge className="bg-blue-500">New</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => { setViewing(n); setViewOpen(true); }}>
                          <Eye className="mr-2 h-4 w-4" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {n.read ? (
                          <DropdownMenuItem onClick={() => markUnreadMutation.mutate(n.id)}>
                            <Mail className="mr-2 h-4 w-4" /> Mark Unread
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => markReadMutation.mutate(n.id)}>
                            <MailOpen className="mr-2 h-4 w-4" /> Mark Read
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border">
        <div className="text-sm text-muted-foreground">
          Page {meta.current_page || page} of {meta.last_page || 1}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm">Rows per page</span>
            <Select value={String(perPage)} onValueChange={(v) => { setPerPage(Number(v)); setPage(1); }}>
              <SelectTrigger className="w-[70px]">
                <SelectValue placeholder={String(perPage)} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="40">40</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p + 1)}
              disabled={meta.current_page >= meta.last_page}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Details Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Notification Details</DialogTitle>
            <DialogDescription>
              {viewing ? new Date(viewing.createdAt || viewing.created_at).toLocaleString() : ''}
            </DialogDescription>
          </DialogHeader>

          {viewing && (
            <div className="space-y-4 py-2">
              <div>
                <h4 className="text-sm font-semibold mb-1">Type</h4>
                <p className="text-sm">{NotificationFormatter.formatType(viewing.type)}</p>
                <p className="text-xs text-muted-foreground font-mono">{viewing.type}</p>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-1">Content</h4>
                {renderPayloadDetails(viewing.payload)}
              </div>

              {/* Action Helper */}
              {/* Action Helper */}
              {(() => {
                const p = typeof viewing.payload === 'string' ? JSON.parse(viewing.payload) : viewing.payload || {};
                return (
                  <div className="flex flex-col gap-2 pt-2">
                    {p.resourceId && (
                      <Button size="sm" className="w-full" variant="secondary" onClick={() => {
                        navigate('/admin/resources');
                        setViewOpen(false);
                      }}>
                        View Resource
                      </Button>
                    )}
                    {p.eventId && (
                      <Button size="sm" className="w-full" variant="secondary" onClick={() => {
                        navigate('/admin/events');
                        setViewOpen(false);
                      }}>
                        View Event
                      </Button>
                    )}
                    {p.userId && (
                      <Button size="sm" className="w-full" variant="secondary" onClick={() => {
                        navigate('/admin/users');
                        setViewOpen(false);
                      }}>
                        View User
                      </Button>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
