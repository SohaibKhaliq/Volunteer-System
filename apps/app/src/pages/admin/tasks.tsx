import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

export default function AdminTasks() {
  const { data: tasks, isLoading } = useQuery(['tasks'], api.listTasks);

  if (isLoading) return <div>Loading tasks…</div>;

  return (
    <div>
      <h2 className="text-xl mb-4">Tasks</h2>
      <div className="bg-white rounded shadow p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Slots</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.isArray(tasks) &&
              tasks.map((t: any) => (
                <TableRow key={t.id}>
                  <TableCell>{t.title}</TableCell>
                  <TableCell>{t.description}</TableCell>
                  <TableCell>{t.slotCount}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
