import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export default function AdminUsers() {
  const { data: users, isLoading } = useQuery(['users'], api.listUsers);

  if (isLoading) return <div>Loading users...</div>;

  return (
    <div>
      <h2 className="text-xl mb-4">Users</h2>
      <div className="bg-white rounded shadow p-4">
        <table className="w-full table-auto">
          <thead>
            <tr className="text-left">
              <th className="p-2">ID</th>
              <th className="p-2">Email</th>
              <th className="p-2">Name</th>
              <th className="p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(users) &&
              users.map((u: any) => (
                <tr key={u.id} className="border-t">
                  <td className="p-2">{u.id}</td>
                  <td className="p-2">{u.email}</td>
                  <td className="p-2">
                    {u.firstName} {u.lastName}
                  </td>
                  <td className="p-2">{u.volunteerStatus}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
