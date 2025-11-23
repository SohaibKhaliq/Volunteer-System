// src/pages/admin/hours.tsx
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarClock, CheckCircle, XCircle } from 'lucide-react';
import { hourEntries as mockHours } from '@/lib/mock/adminMock';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import exportToCsv from '@/lib/exportCsv';
import { useState } from 'react';

export default function AdminHours() {
  const [selected, setSelected] = useState<number[]>([]);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkComment, setBulkComment] = useState('');

  const toggleSelect = (id: number) => {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  const selectAll = () => {
    setSelected(mockHours.map((h) => h.id));
  };

  const clearSelection = () => setSelected([]);

  const handleApproveSelected = () => {
    // Mock action: show a message and clear selection
    alert(`Approved ${selected.length} entries. Comment: ${bulkComment}`);
    clearSelection();
    setBulkOpen(false);
  };

  const handleRejectSelected = () => {
    alert(`Rejected ${selected.length} entries. Comment: ${bulkComment}`);
    clearSelection();
    setBulkOpen(false);
  };

  const handleExport = () => {
    exportToCsv(
      'hours.csv',
      mockHours.map(({ id, volunteer, event, date, hours, status }) => ({ id, volunteer, event, date, hours, status }))
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5" />
            Volunteer Hours
          </CardTitle>
        </CardHeader>
        <CardContent>
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
              {mockHours.map((h) => (
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
                </TableRow>
              ))}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Action</DialogTitle>
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
              <Button onClick={handleApproveSelected}>Approve</Button>
              <Button variant="destructive" onClick={handleRejectSelected}>
                Reject
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
