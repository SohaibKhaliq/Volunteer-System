import { QueryFunction, QueryKey, useQuery } from '@tanstack/react-query';
import { LoginDTO } from 'shared';
import { axios } from './axios';

const api = {
  /* User endpoints */
  /* User endpoints */
  login: async (credentials: any): Promise<LoginDTO | null> => {
    return axios.post('/login', credentials);
  },
  register: async (data: any): Promise<LoginDTO | null> => {
    return axios.post('/register', data);
  },
  logout: async () => {
    return axios.post('/logout');
  },

  /* Help Request endpoints */
  createHelpRequest: async (data: FormData) => {
    return axios.post('/help-requests', data);
  },

  createHelpOffer: async (data: FormData) => {
    return axios.post('/offers', data);
  },
  createCarpooling: async (data: FormData) => {
    return axios.post('/carpooling-ads', data);
  },
  /* Admin / management endpoints */
  listOrganizations: async () => axios.get('/organizations'),
  createOrganization: async (payload: any) => axios.post('/organizations', payload),
  updateOrganization: async (id: number, data: any) => axios.put(`/organizations/${id}`, data),
  deleteOrganization: async (id: number) => axios.delete(`/organizations/${id}`),

  listUsers: async () => axios.get('/users'),
  createUser: async (payload: any) => axios.post('/users', payload),
  updateUser: async (id: number, data: any) => axios.put(`/users/${id}`, data),
  deleteUser: async (id: number) => axios.delete(`/users/${id}`),
  sendReengagementEmail: async (id: number) => axios.post(`/users/${id}/remind`),

  listEvents: async () => axios.get('/events'),
  createEvent: async (data: any) => axios.post('/events', data),
  updateEvent: async (id: number, data: any) => axios.put(`/events/${id}`, data),
  deleteEvent: async (id: number) => axios.delete(`/events/${id}`),
  aiMatchVolunteers: async (id: number) => axios.post(`/events/${id}/ai-match`),
  listTasks: async () => axios.get('/tasks'),

  aiMatch: async (task_id: number) => axios.post('/ai/match', { task_id }),
  aiForecast: async (start: string, end: string) => axios.post('/ai/forecast', { start, end }),

  /* Compliance endpoints */
  updateComplianceDoc: async (id: number, data: any) => axios.put(`/compliance/${id}`, data),
  sendComplianceReminder: async (userId: number) => axios.post(`/compliance/remind/${userId}`),

  // reports endpoint with optional query options
  getReports: async <T = unknown>(params?: Record<string, unknown>): Promise<T> =>
    (await axios.get('/reports', { params })) as Promise<T>,

  // generic list helper for simple collections
  list: async (resource: string) => axios.get(`/${resource}`),
  create: async (resource: string, data: any) => axios.post(`/${resource}`, data),
  update: async (resource: string, id: number, data: any) => axios.put(`/${resource}/${id}`, data),
  delete: async (resource: string, id: number) => axios.delete(`/${resource}/${id}`),
  // return current authenticated user's profile (roles, flags)
  getCurrentUser: async () => axios.get('/me')
} as const;

export const useLazyQuery = (key: QueryKey, fn: QueryFunction, options = {}) => {
  const query = useQuery(key, fn, {
    ...options,
    enabled: false
  });

  return [query.refetch, query];
};

// export const useApi = <QueryName extends keyof typeof api>(
//   queryName: QueryName,
//   params?: Parameters<(typeof api)[QueryName]>[0]
// ) => {
//   const query = useQuery({
//     queryKey: [queryName],
//     // eslint-disable-next-line @typescript-eslint/ban-ts-comment
//     // @ts-ignore TODO: fix this
//     queryFn: async () => await api[queryName](...params)
//   });

//   return query;
// };

// export const useApiMutation = <QueryName extends keyof typeof api>(
//   queryName: QueryName,
//   params?: Parameters<(typeof api)[QueryName]>[0]
// ) => {
//   const mutation = useMutation({
//     mutationKey: [queryName],
//     mutationFn: async () => await api[queryName](...params)
//   });
// };

// export const useApiLazy = <QueryName extends keyof typeof api>(
//   queryName: QueryName,
//   params?: Parameters<(typeof api)[QueryName]>[0]
// ) => {
//   // eslint-disable-next-line @typescript-eslint/ban-ts-comment
//   // @ts-ignore TODO: fix this
//   const [refetch, query] = useLazyQuery([queryName], async () => await api[queryName](...params));
//   return [refetch, query];
// };

export default api;
