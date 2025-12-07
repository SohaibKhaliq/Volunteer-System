import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export default function useAdminSummary() {
  return useQuery(
    ['admin', 'summary'],
    async () => {
      const res: any = await api.getAdminSummary();
      // axios wrapper may return the response directly or the data nested under `data`.
      return (res && (res.data ?? res)) || res;
    },
    { staleTime: 30_000 }
  );
}
