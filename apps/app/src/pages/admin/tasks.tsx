import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export default function AdminTasks() {
  const { data: tasks, isLoading } = useQuery(['tasks'], api.listTasks);

  if (isLoading) return <div>Loading tasks…</div>;

  return (
    <div>
      <h2 className="text-xl mb-4">Tasks</h2>
      <div className="bg-white rounded shadow p-4">
        <ul className="divide-y">
          {Array.isArray(tasks) &&
            tasks.map((t: any) => (
              <li key={t.id} className="py-3 flex justify-between items-center">
                <div>
                  <div className="font-semibold">{t.title}</div>
                  <div className="text-sm text-slate-500">{t.description}</div>
                </div>
                <div className="text-sm text-slate-600">Slots: {t.slotCount}</div>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}
