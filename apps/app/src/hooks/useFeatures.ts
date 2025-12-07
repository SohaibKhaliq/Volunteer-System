import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export default function useFeatures() {
  return useQuery(
    ['admin', 'features'],
    async () => {
      const res: any = await api.getAdminFeatures();
      return (res && (res.data ?? res)) || res;
    },
    { staleTime: 60_000 }
  );
}
