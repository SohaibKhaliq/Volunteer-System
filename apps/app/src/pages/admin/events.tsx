import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

export default function AdminEvents() {
  const { data: events, isLoading } = useQuery(['events'], api.listEvents);

  if (isLoading) return <div>Loading events…</div>;

  return (
    <div>
      <h2 className="text-xl mb-4">Events</h2>
      <div className="bg-white rounded shadow p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Starts</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.isArray(events) &&
              events.map((e: any) => (
                <TableRow key={e.id}>
                  <TableCell>{e.title}</TableCell>
                  <TableCell>{e.description}</TableCell>
                  <TableCell>{new Date(e.startAt).toLocaleString()}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
