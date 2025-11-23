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

  listUsers: async (q?: string) => {
    const res = await axios.get('/users', { params: q ? { search: q } : undefined });
    // backend may return a paginated object { data: [...] } or a plain array
    if (Array.isArray(res)) return res;
    if (res && Array.isArray((res as any).data)) return (res as any).data;
    return [] as const;
  },
  listUsersPaged: async (q?: string, page = 1, perPage = 20, status?: string) =>
    axios.get('/users', { params: { ...(q ? { search: q } : {}), page, perPage, status } }),
  createUser: async (payload: any) => axios.post('/users', payload),
  updateUser: async (id: number, data: any) => axios.put(`/users/${id}`, data),
  deleteUser: async (id: number) => axios.delete(`/users/${id}`),
  sendReengagementEmail: async (id: number) => axios.post(`/users/${id}/remind`),
  addUserRole: async (userId: number, roleId: number) => axios.post(`/users/${userId}/roles`, { roleId }),
  removeUserRole: async (userId: number, roleId: number) => axios.delete(`/users/${userId}/roles/${roleId}`),
  activateUser: async (id: number) => axios.post(`/users/${id}/activate`),

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
  createCompliance: async (data: any) => axios.post('/compliance', data),
  deleteCompliance: async (id: number) => axios.delete(`/compliance/${id}`),

  /* Background checks endpoints */
  listBackgroundChecks: async () => axios.get('/background-checks'),
  createBackgroundCheck: async (data: any) => axios.post('/background-checks', data),
  updateBackgroundCheck: async (id: number, data: any) => axios.put(`/background-checks/${id}`, data),
  deleteBackgroundCheck: async (id: number) => axios.delete(`/background-checks/${id}`),

  // reports endpoint with optional query options
  getReports: async <T = unknown>(params?: Record<string, unknown>): Promise<T> =>
    (await axios.get('/reports', { params })) as Promise<T>,

  // generic list helper for simple collections
  list: async (resource: string) => axios.get(`/${resource}`),
  create: async (resource: string, data: any) => axios.post(`/${resource}`, data),
  update: async (resource: string, id: number, data: any) => axios.put(`/${resource}/${id}`, data),
  delete: async (resource: string, id: number) => axios.delete(`/${resource}/${id}`),

  /* Analytics & Reports */
  getUserAnalytics: async () => axios.get('/users/analytics'),
  bulkUpdateUsers: async (ids: number[], action: string) => axios.post('/users/bulk', { ids, action }),

  getReportsOverview: async (params?: Record<string, unknown>) => axios.get('/reports', { params }),
  getVolunteerStats: async (params?: Record<string, unknown>) => axios.get('/reports/volunteers', { params }),
  getEventStats: async (params?: Record<string, unknown>) => axios.get('/reports/events', { params }),
  getHoursStats: async (params?: Record<string, unknown>) => axios.get('/reports/hours', { params }),
  getOrganizationStats: async () => axios.get('/reports/organizations'),
  getComplianceStats: async () => axios.get('/reports/compliance'),
  exportReport: async (type: string, reportType: string) =>
    axios.get('/reports/export', { params: { type, reportType } }),

  /* Resources endpoints */
  listResources: async () => axios.get('/resources'),
  createResource: async (data: any) => axios.post('/resources', data),
  updateResource: async (id: number, data: any) => axios.put(`/resources/${id}`, data),
  deleteResource: async (id: number) => axios.delete(`/resources/${id}`),

  /* Audit Logs endpoints */
  listAuditLogs: async () => axios.get('/audit-logs'),
  getAuditLog: async (id: number) => axios.get(`/audit-logs/${id}`),

  /* Surveys endpoints */
  listSurveys: async () => axios.get('/surveys'),
  createSurvey: async (data: any) => axios.post('/surveys', data),
  getSurvey: async (id: number) => axios.get(`/surveys/${id}`),
  updateSurvey: async (id: number, data: any) => axios.put(`/surveys/${id}`, data),
  deleteSurvey: async (id: number) => axios.delete(`/surveys/${id}`),

  /* Communications endpoints */
  listCommunications: async () => axios.get('/communications'),
  createCommunication: async (data: any) => axios.post('/communications', data),
  getCommunication: async (id: number) => axios.get(`/communications/${id}`),
  updateCommunication: async (id: number, data: any) => axios.put(`/communications/${id}`, data),
  deleteCommunication: async (id: number) => axios.delete(`/communications/${id}`),

  /* System Settings endpoints */
  getSettings: async () => axios.get('/settings'),
  updateSettings: async (data: any) => axios.post('/settings', data),

  /* Notifications */
  listNotifications: async () => axios.get('/notifications'),
  markNotificationRead: async (id: number) => axios.put(`/notifications/${id}/read`),

  /* Volunteer Hours endpoints */
  listHours: async () => axios.get('/hours'),
  updateHour: async (id: number, data: any) => axios.put(`/hours/${id}`, data),
  bulkUpdateHours: async (ids: number[], status: string) => axios.post('/hours/bulk', { ids, status }),

  /* Courses endpoints */
  listCourses: async () => axios.get('/courses'),
  createCourse: async (data: any) => axios.post('/courses', data),
  getCourse: async (id: number) => axios.get(`/courses/${id}`),
  updateCourse: async (id: number, data: any) => axios.put(`/courses/${id}`, data),
  deleteCourse: async (id: number) => axios.delete(`/courses/${id}`),

  /* Task endpoints */
  createTask: async (data: any) => axios.post('/tasks', data),
  updateTask: async (id: number, data: any) => axios.put(`/tasks/${id}`, data),
  deleteTask: async (id: number) => axios.delete(`/tasks/${id}`),

  /* Assignment endpoints */
  listAssignments: async () => axios.get('/assignments'),
  createAssignment: async (data: any) => axios.post('/assignments', data),
  updateAssignment: async (id: number, data: any) => axios.put(`/assignments/${id}`, data),
  deleteAssignment: async (id: number) => axios.delete(`/assignments/${id}`),

  /* Compliance list endpoint */
  listCompliance: async () => axios.get('/compliance'),

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
