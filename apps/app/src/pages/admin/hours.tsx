// src/pages/admin/hours.tsx
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarClock, CheckCircle, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import SkeletonCard from '@/components/atoms/skeleton-card';
import exportToCsv from '@/lib/exportCsv';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/atoms/popover';
import { Command, CommandGroup, CommandInput, CommandItem } from '@/components/atoms/command';
import { useEffect, useMemo, startTransition } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from '@/components/atoms/use-toast';

export default function AdminHours() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<number[]>([]);
  const [bulkMode, setBulkMode] = useState<'approve' | 'reject' | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkComment, setBulkComment] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Approved' | 'Pending' | 'Rejected'>('All');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [volunteerQuery, setVolunteerQuery] = useState('');
  const [debouncedVolunteerQuery, setDebouncedVolunteerQuery] = useState('');
  const [selectedVolunteer, setSelectedVolunteer] = useState<any | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedVolunteerQuery(volunteerQuery), 300);
    return () => clearTimeout(t);
  }, [volunteerQuery]);

  const { data: volunteerResults = [], isLoading: volunteersLoading } = useQuery(
    ['users', debouncedVolunteerQuery],
    () => api.listUsers(debouncedVolunteerQuery)
  );

  const { data, isLoading } = useQuery({
    queryKey: ['hours', page, perPage, filterStatus, debouncedVolunteerQuery, search],
    queryFn: () =>
      api.list('hours', {
        page,
        per_page: perPage,
        status: filterStatus !== 'All' ? filterStatus : undefined,
        user_id: selectedVolunteer?.id ?? undefined,
        search: search || undefined
      })
  });

  // normalize response: support plain array or paginated { data, meta }
  const normalized = useMemo(() => {
    if (!data) return { data: [], total: 0 };
    if (Array.isArray(data)) return { data, total: data.length };
    // common shapes: { data: [], meta: { total } } or { data: [], total }
    const list = data.data ?? data.items ?? [];
    const total = data.total ?? data.meta?.total ?? list.length;
    return { data: list, total };
  }, [data]);

  const hours = normalized.data || [];
  const totalFromServer = normalized.total || 0;

  const bulkUpdateMutation = useMutation({
    mutationFn: ({ ids, status }: { ids: number[]; status: string }) => api.bulkUpdateHours(ids, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hours'] });
      toast.success(`Hours ${bulkMode === 'approve' ? 'approved' : 'rejected'} successfully`);
      clearSelection();
      setBulkComment('');
      setBulkOpen(false);
    },
    onError: () => toast.error('Failed to update hours')
  });

  const toggleSelect = (id: number) => {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  // selectAll should select currently visible page items
  const selectAll = () => setSelected(paged.map((h: any) => h.id));
  const clearSelection = () => setSelected([]);

  const handleBulkAction = (mode: 'approve' | 'reject') => {
    setBulkMode(mode);
    setBulkOpen(true);
  };

  const confirmBulkAction = () => {
    if (bulkMode) {
      const status = bulkMode === 'approve' ? 'Approved' : 'Rejected';
      bulkUpdateMutation.mutate({ ids: selected, status });
    }
  };

  const handleExport = () => {
    (async () => {
      try {
        // If server supports pagination, request all filtered rows from server
        if (serverPaginated) {
          const params: any = {
            page: 1,
            per_page: total || 0,
            status: filterStatus !== 'All' ? filterStatus : undefined,
            user_id: selectedVolunteer?.id ?? undefined,
            search: search || undefined
          };
          const allResp: any = await api.list('hours', params);
          const list = Array.isArray(allResp) ? allResp : (allResp.data ?? allResp.items ?? []);
          exportToCsv(
            'hours.csv',
            list.map((h: any) => ({
              id: h.id,
              volunteer: `${h.user?.firstName || ''} ${h.user?.lastName || ''}`.trim(),
              event: h.event?.title || 'N/A',
              date: h.date,
              hours: h.hours,
              status: h.status
            }))
          );
        } else {
          // client-side: export all filtered results
          exportToCsv(
            'hours.csv',
            allFiltered.map((h: any) => ({
              id: h.id,
              volunteer: `${h.user?.firstName || ''} ${h.user?.lastName || ''}`.trim(),
              event: h.event?.title || 'N/A',
              date: h.date,
              hours: h.hours,
              status: h.status
            }))
          );
        }
        toast.success('Export started');
      } catch (err) {
        toast.error('Failed to export');
      }
    })();
  };

  // Determine whether the server returned a paginated response or a full array
  const serverPaginated = !Array.isArray(data) && data && (data.total || data.meta || data.items);

  // Apply client-side filtering only if the server returned a full array
  const allFiltered = !serverPaginated
    ? hours.filter((e: any) => {
        if (filterStatus !== 'All' && e.status !== filterStatus) return false;
        if (selectedVolunteer && e.user?.id !== selectedVolunteer.id) return false;
        if (search) {
          const searchText =
            `${e.user?.firstName || ''} ${e.user?.lastName || ''} ${e.event?.title || ''}`.toLowerCase();
          if (!searchText.includes(search.toLowerCase())) return false;
        }
        return true;
      })
    : hours;

  // If server returned paginated data, `hours` represents the current page and `totalFromServer` is authoritative.
  // Otherwise, paginate client-side from `allFiltered`.
  const total = serverPaginated ? totalFromServer : allFiltered.length;
  const paged = serverPaginated ? allFiltered : allFiltered.slice((page - 1) * perPage, page * perPage);

  // Reset to first page when filters change
  useEffect(() => {
    setPage(1);
  }, [filterStatus, selectedVolunteer?.id, search]);

  return (
    <div className="space-y-6" aria-busy={isLoading}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5" />
            Volunteer Hours
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 mb-4">
            <Input
              placeholder="Search volunteer or event"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64"
            />
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-56 justify-start">
                  {selectedVolunteer
                    ? `${selectedVolunteer.firstName || selectedVolunteer.name} ${selectedVolunteer.lastName || ''}`
                    : 'Filter by volunteer'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0">
                <Command>
                  <CommandInput
                    placeholder="Search volunteers..."
                    value={volunteerQuery}
                    onValueChange={(v) => startTransition(() => setVolunteerQuery(v))}
                  />
                  <CommandGroup>
                    {volunteerResults.map((u: any) => (
                      <CommandItem key={u.id} onSelect={() => setSelectedVolunteer(u)}>
                        {u.firstName || u.name} {u.lastName || ''} {u.email ? `(${u.email})` : ''}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <div className="ml-auto flex items-center gap-2">
              <div className="text-sm text-muted-foreground">Per page</div>
              <Select
                value={String(perPage)}
                onValueChange={(v) => {
                  setPerPage(Number(v));
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bulk actions moved to top for easier access */}
          <Card className="mb-4">
            <div className="p-4 flex items-center gap-4">
              <Button variant="outline" onClick={() => handleBulkAction('approve')} disabled={selected.length === 0}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve Selected ({selected.length})
              </Button>
              <Button variant="destructive" onClick={() => handleBulkAction('reject')} disabled={selected.length === 0}>
                <XCircle className="h-4 w-4 mr-2" />
                Reject Selected ({selected.length})
              </Button>
              <Button variant="outline" onClick={handleExport} className="ml-auto">
                Export CSV
              </Button>
            </div>
          </Card>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <input
                    aria-label="Select all hours"
                    type="checkbox"
                    checked={selected.length === paged.length && paged.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) selectAll();
                      else clearSelection();
                    }}
                  />
                </TableHead>
                <TableHead>Volunteer</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <SkeletonCard />
                  </TableCell>
                </TableRow>
              ) : paged.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No hours entries found
                  </TableCell>
                </TableRow>
              ) : (
                paged.map((h: any) => (
                  <TableRow key={h.id}>
                    <TableCell>
                      <input
                        aria-label={`Select hours ${h.id}`}
                        type="checkbox"
                        checked={selected.includes(h.id)}
                        onChange={() => toggleSelect(h.id)}
                      />
                    </TableCell>
                    <TableCell>
                      {h.user?.firstName} {h.user?.lastName}
                    </TableCell>
                    <TableCell>{h.event?.title || 'N/A'}</TableCell>
                    <TableCell>{new Date(h.date).toLocaleDateString()}</TableCell>
                    <TableCell>{h.hours}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          h.status === 'Approved' ? 'default' : h.status === 'Pending' ? 'secondary' : 'destructive'
                        }
                      >
                        {h.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination controls */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              {total === 0
                ? 'No entries'
                : `Showing ${(page - 1) * perPage + 1} - ${(page - 1) * perPage + paged.length} of ${total}`}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Prev
              </Button>
              <div className="text-sm">
                Page {page} / {Math.max(1, Math.ceil(total / perPage))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(Math.max(1, Math.ceil(total / perPage)), p + 1))}
                disabled={page >= Math.max(1, Math.ceil(total / perPage))}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Action Dialog */}
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent aria-labelledby="bulk-action-title">
          <DialogHeader>
            <DialogTitle id="bulk-action-title">{bulkMode === 'approve' ? 'Approve' : 'Reject'} Hours</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <div className="text-sm mb-2">Selected entries: {selected.length}</div>
            <label className="text-sm block mb-1">Admin comment (optional)</label>
            <textarea
              className="w-full border rounded p-2"
              value={bulkComment}
              onChange={(e) => setBulkComment(e.target.value)}
            />
          </div>
          <DialogFooter>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setBulkOpen(false)}>
                Cancel
              </Button>
              <Button
                variant={bulkMode === 'approve' ? 'default' : 'destructive'}
                onClick={confirmBulkAction}
                disabled={bulkUpdateMutation.isPending}
              >
                {bulkUpdateMutation.isPending ? 'Processing...' : bulkMode === 'approve' ? 'Approve' : 'Reject'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
