import React, { useEffect, useState } from 'react';
import adminApi from '@/lib/api';

export default function AdminFeatureFlags() {
  const [flags, setFlags] = useState<any[]>([]);

  useEffect(() => {
    adminApi.listFeatureFlags().then((res: any) => setFlags(res.data ?? res));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Feature Flags</h1>
      <ul>
        {flags.map((f) => (
          <li key={f.id} className="py-2 border-b flex items-center justify-between">
            <div>
              <strong>{f.key}</strong>
              <div className="text-sm text-gray-600">{f.description}</div>
            </div>
            <div>{f.enabled ? 'Enabled' : 'Disabled'}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
