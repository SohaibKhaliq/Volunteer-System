import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

export default function AdminCompliance() {
  const { data: docs, isLoading } = useQuery(['compliance'], () => api.list('compliance'));

  if (isLoading) return <div>Loading compliance…</div>;

  return (
    <div>
      <h2 className="text-xl mb-4">Compliance</h2>
      <div className="bg-white rounded shadow p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Expires</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.isArray(docs) &&
              docs.map((d: any) => (
                <TableRow key={d.id}>
                  <TableCell>{d.docType}</TableCell>
                  <TableCell>{d.status}</TableCell>
                  <TableCell>{d.expiresAt}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
