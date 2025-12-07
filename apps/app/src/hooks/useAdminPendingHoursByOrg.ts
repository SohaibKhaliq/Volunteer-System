import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export default function useAdminPendingHoursByOrg(opts = {}) {
  return useQuery(
    ['admin', 'pending-hours', 'orgs'],
    async () => {
      const res: any = await api.getAdminPendingHoursByOrg();
      return (res && (res.data ?? res)) || res;
    },
    { staleTime: 30_000, ...opts }
  );
}
