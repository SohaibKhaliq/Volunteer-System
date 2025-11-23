import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

export default function AdminOrganizations() {
  const { data: orgs, isLoading } = useQuery(['organizations'], api.listOrganizations);

  if (isLoading) return <div>Loading organizations…</div>;

  return (
    <div>
      <h2 className="text-xl mb-4">Organizations</h2>
      <div className="bg-white rounded shadow p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.isArray(orgs) &&
              orgs.map((o: any) => (
                <TableRow key={o.id}>
                  <TableCell>{o.name}</TableCell>
                  <TableCell>{o.description}</TableCell>
                  <TableCell>{o.isApproved ? 'Approved' : 'Pending'}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
