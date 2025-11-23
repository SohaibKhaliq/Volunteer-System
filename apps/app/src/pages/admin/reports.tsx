import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export default function AdminReports() {
  const { data, isLoading } = useQuery(['reports'], () => api.list('reports'));

  if (isLoading) return <div>Loading reports…</div>;

  return (
    <div>
      <h2 className="text-xl mb-4">Reports</h2>
      <div className="bg-white rounded shadow p-4">
        <pre className="whitespace-pre-wrap text-sm text-slate-700">{JSON.stringify(data, null, 2)}</pre>
      </div>
    </div>
  );
}
