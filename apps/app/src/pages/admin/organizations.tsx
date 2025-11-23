import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export default function AdminOrganizations() {
  const { data: orgs, isLoading } = useQuery(['organizations'], api.listOrganizations);

  if (isLoading) return <div>Loading organizations…</div>;

  return (
    <div>
      <h2 className="text-xl mb-4">Organizations</h2>
      <div className="bg-white rounded shadow p-4">
        <ul className="divide-y">
          {Array.isArray(orgs) &&
            orgs.map((o: any) => (
              <li key={o.id} className="py-3 flex justify-between items-center">
                <div>
                  <div className="font-semibold">{o.name}</div>
                  <div className="text-sm text-slate-500">{o.description}</div>
                </div>
                <div className="text-sm text-slate-600">{o.isApproved ? 'Approved' : 'Pending'}</div>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}
