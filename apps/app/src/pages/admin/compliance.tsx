import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export default function AdminCompliance() {
  const { data: docs, isLoading } = useQuery(['compliance'], () => api.list('compliance'));

  if (isLoading) return <div>Loading compliance…</div>;

  return (
    <div>
      <h2 className="text-xl mb-4">Compliance</h2>
      <div className="bg-white rounded shadow p-4">
        <ul className="divide-y">
          {Array.isArray(docs) &&
            docs.map((d: any) => (
              <li key={d.id} className="py-3 flex justify-between items-center">
                <div>
                  <div className="font-semibold">{d.docType}</div>
                  <div className="text-sm text-slate-500">Status: {d.status}</div>
                </div>
                <div className="text-sm text-slate-600">Expires: {d.expiresAt}</div>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}
