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
import React, { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function AdminHours() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<number[]>([]);
  const [bulkMode, setBulkMode] = useState<'approve' | 'reject' | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkComment, setBulkComment] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Approved' | 'Pending' | 'Rejected'>('All');
  const [search, setSearch] = useState('');
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
    queryKey: ['hours'],
    queryFn: api.listHours
  });

  const hours = Array.isArray(data) ? data : [];

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

  const selectAll = () => setSelected(hours.map((h: any) => h.id));
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
    exportToCsv(
      'hours.csv',
      hours.map((h: any) => ({
        id: h.id,
        volunteer: `${h.user?.firstName || ''} ${h.user?.lastName || ''}`.trim(),
        event: h.event?.title || 'N/A',
        date: h.date,
        hours: h.hours,
        status: h.status
      }))
    );
  };

  const filtered = hours.filter((e: any) => {
    if (filterStatus !== 'All' && e.status !== filterStatus) return false;
    if (selectedVolunteer && e.user?.id !== selectedVolunteer.id) return false;
    const searchText = `${e.user?.firstName || ''} ${e.user?.lastName || ''} ${e.event?.title || ''}`.toLowerCase();
    if (search && !searchText.includes(search.toLowerCase())) return false;
    return true;
  });

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
                    onValueChange={(v) => React.startTransition(() => setVolunteerQuery(v))}
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
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <input
                    aria-label="Select all hours"
                    type="checkbox"
                    checked={selected.length === filtered.length && filtered.length > 0}
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
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No hours entries found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((h: any) => (
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
        </CardContent>
      </Card>

      {/* Bulk actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Bulk Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="flex space-x-4">
          <Button variant="outline" onClick={() => handleBulkAction('approve')} disabled={selected.length === 0}>
            Approve Selected ({selected.length})
          </Button>
          <Button variant="destructive" onClick={() => handleBulkAction('reject')} disabled={selected.length === 0}>
            <XCircle className="h-4 w-4 mr-2" />
            Reject Selected ({selected.length})
          </Button>
          <Button variant="outline" onClick={handleExport} className="ml-auto">
            Export CSV
          </Button>
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
