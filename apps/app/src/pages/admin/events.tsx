import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export default function AdminEvents() {
  const { data: events, isLoading } = useQuery(['events'], api.listEvents);

  if (isLoading) return <div>Loading events…</div>;

  return (
    <div>
      <h2 className="text-xl mb-4">Events</h2>
      <div className="bg-white rounded shadow p-4">
        <ul className="divide-y">
          {Array.isArray(events) &&
            events.map((e: any) => (
              <li key={e.id} className="py-3 flex justify-between items-center">
                <div>
                  <div className="font-semibold">{e.title}</div>
                  <div className="text-sm text-slate-500">{e.description}</div>
                </div>
                <div className="text-sm text-slate-600">{new Date(e.startAt).toLocaleString()}</div>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}
