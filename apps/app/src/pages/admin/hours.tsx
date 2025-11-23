// src/pages/admin/hours.tsx
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarClock, CheckCircle, XCircle } from 'lucide-react';
import { hourEntries as mockHours } from '@/lib/mock/adminMock';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import SkeletonCard from '@/components/atoms/skeleton-card';
import exportToCsv from '@/lib/exportCsv';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Edit, Trash2, Plus } from 'lucide-react';
import { useState } from 'react';

export default function AdminHours() {
  // Local state mirrors the shared mock so UI updates are reactive
  const [entries, setEntries] = useState(() => mockHours.slice());
  const [selected, setSelected] = useState<number[]>([]);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkComment, setBulkComment] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Approved' | 'Pending' | 'Rejected'>('All');
  const [search, setSearch] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toDelete, setToDelete] = useState<number | null>(null);

  const toggleSelect = (id: number) => {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  const selectAll = () => setSelected(entries.map((h) => h.id));
  const clearSelection = () => setSelected([]);

  const handleApproveSelected = () => {
    const next = entries.map((entry) => (selected.includes(entry.id) ? { ...entry, status: 'Approved' } : entry));
    setEntries(next);
    // sync to mock array
    mockHours.forEach((m) => {
      const updated = next.find((n) => n.id === m.id);
      if (updated) m.status = updated.status;
    });
    alert(`Approved ${selected.length} entries. Comment: ${bulkComment}`);
    clearSelection();
    setBulkComment('');
    setBulkOpen(false);
  };

  const handleRejectSelected = () => {
    const next = entries.map((entry) => (selected.includes(entry.id) ? { ...entry, status: 'Rejected' } : entry));
    setEntries(next);
    mockHours.forEach((m) => {
      const updated = next.find((n) => n.id === m.id);
      if (updated) m.status = updated.status;
    });
    alert(`Rejected ${selected.length} entries. Comment: ${bulkComment}`);
    clearSelection();
    setBulkComment('');
    setBulkOpen(false);
  };

  const handleExport = () => {
    exportToCsv(
      'hours.csv',
      entries.map(({ id, volunteer, event, date, hours, status }) => ({ id, volunteer, event, date, hours, status }))
    );
  };

  const filtered = entries.filter((e) => {
    if (filterStatus !== 'All' && e.status !== filterStatus) return false;
    if (search && !`${e.volunteer} ${e.event}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const saveEntry = (payload: any) => {
    if (payload.id) {
      const next = entries.map((e) => (e.id === payload.id ? { ...e, ...payload } : e));
      setEntries(next);
      mockHours.forEach((m) => {
        const u = next.find((n) => n.id === m.id);
        if (u) Object.assign(m, u);
      });
    } else {
      const id = Math.max(0, ...entries.map((e) => e.id)) + 1;
      const newEntry = { ...payload, id };
      const next = [newEntry, ...entries];
      setEntries(next);
      mockHours.unshift(newEntry);
    }
    setEditOpen(false);
    setEditing(null);
  };

  const confirmDelete = (id: number) => {
    setToDelete(id);
    setDeleteOpen(true);
  };

  const doDelete = () => {
    if (toDelete == null) return;
    const next = entries.filter((e) => e.id !== toDelete);
    setEntries(next);
    const idx = mockHours.findIndex((m) => m.id === toDelete);
    if (idx !== -1) mockHours.splice(idx, 1);
    setToDelete(null);
    setDeleteOpen(false);
  };

  useEffect(() => {
    if (mockHours.length !== entries.length) setEntries(mockHours.slice());
  }, [mockHours.length]);

  return (
    <div className="space-y-6" aria-busy={false}>
      {/* Header */}
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
            <div className="ml-auto">
              <Button
                onClick={() => {
                  setEditing(null);
                  setEditOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Entry
              </Button>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <input
                    aria-label="Select all hours"
                    type="checkbox"
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
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <SkeletonCard />
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell>
                      <input
                        aria-label={`Select hours ${h.id}`}
                        type="checkbox"
                        checked={selected.includes(h.id)}
                        onChange={() => toggleSelect(h.id)}
                      />
                    </TableCell>
                    <TableCell>{h.volunteer}</TableCell>
                    <TableCell>{h.event}</TableCell>
                    <TableCell>{h.date}</TableCell>
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
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setEditing(h);
                            setEditOpen(true);
                          }}
                          aria-label={`Edit ${h.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" onClick={() => confirmDelete(h.id)} aria-label={`Delete ${h.id}`}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Bulk actions (mock) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Bulk Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="flex space-x-4">
          <Button
            variant="outline"
            onClick={() => setBulkOpen(true)}
            disabled={selected.length === 0}
            aria-disabled={selected.length === 0}
          >
            Approve Selected ({selected.length})
          </Button>
          <Button
            variant="destructive"
            onClick={() => setBulkOpen(true)}
            disabled={selected.length === 0}
            aria-disabled={selected.length === 0}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Reject Selected ({selected.length})
          </Button>
          <Button variant="outline" onClick={handleExport} className="ml-auto">
            Export CSV
          </Button>
        </CardContent>
      </Card>

      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent aria-labelledby="bulk-action-title">
          <DialogHeader>
            <DialogTitle id="bulk-action-title">Bulk Action</DialogTitle>
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
              <Button onClick={handleApproveSelected} aria-label="Approve selected hours">
                Approve
              </Button>
              <Button variant="destructive" onClick={handleRejectSelected} aria-label="Reject selected hours">
                Reject
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add / Edit Entry Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent aria-labelledby="edit-entry-title">
          <DialogHeader>
            <DialogTitle id="edit-entry-title">{editing ? 'Edit Entry' : 'Add Entry'}</DialogTitle>
          </DialogHeader>
          <div className="p-4 space-y-3">
            <div>
              <label className="text-sm block mb-1">Volunteer</label>
              <Input
                value={editing?.volunteer || ''}
                onChange={(e) => setEditing((s: any) => ({ ...(s || {}), volunteer: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm block mb-1">Event</label>
              <Input
                value={editing?.event || ''}
                onChange={(e) => setEditing((s: any) => ({ ...(s || {}), event: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm block mb-1">Date</label>
                <Input
                  type="date"
                  value={editing?.date || ''}
                  onChange={(e) => setEditing((s: any) => ({ ...(s || {}), date: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm block mb-1">Hours</label>
                <Input
                  type="number"
                  value={editing?.hours || ''}
                  onChange={(e) => setEditing((s: any) => ({ ...(s || {}), hours: Number(e.target.value) }))}
                />
              </div>
            </div>
            <div>
              <label className="text-sm block mb-1">Status</label>
              <Select
                value={editing?.status || 'Pending'}
                onValueChange={(v) => setEditing((s: any) => ({ ...(s || {}), status: v }))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setEditOpen(false);
                  setEditing(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  // validate minimal
                  if (!editing?.volunteer || !editing?.event) {
                    alert('Volunteer and event are required');
                    return;
                  }
                  saveEntry(editing || {});
                }}
              >
                {editing ? 'Save' : 'Create'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent aria-labelledby="delete-entry-title">
          <DialogHeader>
            <DialogTitle id="delete-entry-title">Confirm Delete</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <div>Are you sure you want to delete this hours entry?</div>
          </div>
          <DialogFooter>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={doDelete}>
                Delete
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
