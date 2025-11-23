import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import CreateUserDialog from '@/components/molecules/CreateUserDialog';

export default function AdminUsers() {
  const { data: users, isLoading, refetch } = useQuery(['users'], api.listUsers);

  if (isLoading) return <div>Loading users...</div>;

  return (
    <div>
      <h2 className="text-xl mb-4">Users</h2>
      <div className="bg-white rounded shadow p-4">
        <div className="mb-4 flex justify-end">
          <CreateUserDialog onCreated={() => refetch()} />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.isArray(users) &&
              users.map((u: any) => (
                <TableRow key={u.id}>
                  <TableCell>{u.id}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    {u.firstName} {u.lastName}
                  </TableCell>
                  <TableCell>{u.volunteerStatus}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
