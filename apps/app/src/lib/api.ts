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
  contact: async (data: any) => axios.post('/contact', data),

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

  /* Organization Volunteer Management */
  getOrganizationVolunteers: async (orgId: number, filters?: any) =>
    axios.get(`/organizations/${orgId}/volunteers`, { params: filters }),
  addOrganizationVolunteer: async (orgId: number, data: any) => axios.post(`/organizations/${orgId}/volunteers`, data),
  joinOrganization: async (orgId: number) => axios.post(`/organizations/${orgId}/volunteers`, {}),
  updateOrganizationVolunteer: async (orgId: number, userId: number, data: any) =>
    axios.put(`/organizations/${orgId}/volunteers/${userId}`, data),
  removeOrganizationVolunteer: async (orgId: number, userId: number) =>
    axios.delete(`/organizations/${orgId}/volunteers/${userId}`),

  /* Organization Events & Tasks */
  getOrganizationEvents: async (orgId: number) => axios.get(`/organizations/${orgId}/events`),
  getOrganizationTasks: async (orgId: number) => axios.get(`/organizations/${orgId}/tasks`),

  /* Organization Hours */
  getOrganizationHours: async (orgId: number, filters?: any) =>
    axios.get(`/organizations/${orgId}/hours`, { params: filters }),
  approveOrganizationHours: async (orgId: number, hourIds: number[], status?: string, notes?: string) =>
    axios.post(`/organizations/${orgId}/hours/approve`, { hour_ids: hourIds, status, notes }),

  /* Organization Analytics & Compliance */
  getOrganizationAnalytics: async (orgId: number, dateRange?: { startDate?: string; endDate?: string }) =>
    axios.get(`/organizations/${orgId}/analytics`, { params: dateRange }),
  getOrganizationCompliance: async (orgId: number) => axios.get(`/organizations/${orgId}/compliance`),

  /* Organization Invitations */
  getOrganizationInvites: async (orgId: number, status?: string) =>
    axios.get(`/organizations/${orgId}/invites`, { params: status ? { status } : undefined }),
  sendOrganizationInvite: async (orgId: number, data: any) => axios.post(`/organizations/${orgId}/invites`, data),
  resendOrganizationInvite: async (orgId: number, inviteId: number) =>
    axios.post(`/organizations/${orgId}/invites/${inviteId}/resend`),
  cancelOrganizationInvite: async (orgId: number, inviteId: number) =>
    axios.delete(`/organizations/${orgId}/invites/${inviteId}`),
  acceptInvite: async (token: string) => axios.post(`/invites/${token}/accept`),
  rejectInvite: async (token: string) => axios.post(`/invites/${token}/reject`),

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

  listEvents: async (params?: any) => axios.get('/events', { params }),
  joinEvent: async (id: number) => axios.post(`/events/${id}/join`),
  listRoles: async () => axios.get('/roles'),
  createEvent: async (data: any) => axios.post('/events', data),
  updateEvent: async (id: number, data: any) => axios.put(`/events/${id}`, data),
  deleteEvent: async (id: number) => axios.delete(`/events/${id}`),
  aiMatchVolunteers: async (id: number) => axios.post(`/events/${id}/ai-match`),
  listTasks: async (params?: any) => axios.get('/tasks', { params }),

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
  list: async (resource: string, params?: any) => axios.get(`/${resource}`, { params }),
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
  getChartData: async () => {
    // Try to build chart data from reports overview; fallback to a small static dataset
    try {
      const overview: any = await axios.get('/reports', { params: { range: '6months' } });
      if (overview && overview.volunteerHours && Array.isArray(overview.volunteerHours.trend)) {
        return overview.volunteerHours.trend.map((t: any) => ({
          month: t?.month != null ? String(t.month) : String(t.name ?? ''),
          volunteers: Number(t?.volunteers ?? t?.volunteer_count ?? t?.total ?? 0) || 0,
          hours: Number(t?.hours ?? t?.totalHours ?? t?.total ?? 0) || 0
        }));
      }
    } catch (e) {
      // ignore and fallthrough to fallback
    }
    return [];
  },
  exportReport: async (type: string, reportType: string) =>
    axios.get('/reports/export', { params: { type, reportType } }),
  downloadReport: async (reportType: string, format = 'csv') =>
    axios.get('/reports/export', { params: { reportType, type: format }, responseType: 'blob' }),

  /* Resources endpoints */
  listResources: async () => {
    const res = await axios.get('/resources');
    // backend may return a plain array or a wrapper object { data: [...] } or { resources: [...] }
    if (Array.isArray(res)) return res;
    if (res && Array.isArray((res as any).data)) return (res as any).data;
    if (res && Array.isArray((res as any).resources)) return (res as any).resources;
    return [] as const;
  },
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
  submitSurveyResponse: async (id: number, data: any) => axios.post(`/surveys/${id}/submit`, data),
  listSurveyResponses: async (id: number) => axios.get(`/surveys/${id}/responses`),
  exportSurveyResponses: async (id: number, format = 'csv') =>
    axios.get(`/surveys/${id}/responses/export`, {
      params: { type: format },
      responseType: format === 'csv' ? 'blob' : undefined
    }),

  /* Communications endpoints */
  listCommunications: async () => axios.get('/communications'),
  createCommunication: async (data: any) => axios.post('/communications', data),
  getCommunication: async (id: number) => axios.get(`/communications/${id}`),
  updateCommunication: async (id: number, data: any) => axios.put(`/communications/${id}`, data),
  deleteCommunication: async (id: number) => axios.delete(`/communications/${id}`),
  listCommunicationLogs: async (communicationId: number) => axios.get(`/communications/${communicationId}/logs`),
  retryCommunicationLog: async (logId: number) => axios.post(`/communications/logs/${logId}/retry`),
  bulkRetryCommunicationLogs: async (ids: number[]) => axios.post(`/communications/logs/bulk-retry`, { ids }),
  listScheduledJobs: async () => axios.get('/scheduled-jobs'),
  createScheduledJob: async (data: any) => axios.post('/scheduled-jobs', data),
  retryScheduledJob: async (id: number) => axios.post(`/scheduled-jobs/${id}/retry`),

  /* Monitoring */
  getMonitoringStats: async () => axios.get('/monitoring/stats'),
  getMonitoringRecent: async () => axios.get('/monitoring/recent'),

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
  getCurrentUser: async () => axios.get('/me'),
  getUser: async (id: number) => axios.get(`/users/${id}`),

  updateOrganizationProfile: async (data: any) => {
    // If FormData, let axios/browser set the Content-Type (with boundary) so server can parse multipart
    return axios.put('/organization/profile', data);
  },
  getOrganizationProfile: async () => axios.get('/organization/profile'),

  // Team
  listOrganizationTeam: async () => axios.get('/organization/team'),
  inviteTeamMember: async (data: any) => axios.post('/organization/team/invite', data),
  updateTeamMember: async (id: number, data: any) => axios.put(`/organization/team/${id}`, data),
  deleteTeamMember: async (id: number) => axios.delete(`/organization/team/${id}`),

  // Events
  listOrganizationEvents: async () => axios.get('/organization/events'),
  createOrganizationEvent: async (data: any) => axios.post('/organization/events', data),
  updateOrganizationEvent: async (id: number, data: any) => axios.put(`/organization/events/${id}`, data),
  deleteOrganizationEvent: async (id: number) => axios.delete(`/organization/events/${id}`),

  // Volunteers
  // listOrganizationVolunteers and addOrganizationVolunteer are already defined above

  // Compliance
  listOrganizationDocuments: async () => axios.get('/organization/documents'),
  uploadOrganizationDocument: async (data: any) => axios.post('/organization/documents', data),
  deleteOrganizationDocument: async (id: number) => axios.delete(`/organization/documents/${id}`),
  getOrganizationComplianceStats: async () => axios.get('/organization/compliance/stats'),

  // Dashboard
  getOrganizationDashboardStats: async () => axios.get('/organization/dashboard-stats'),

  // Volunteer Hours Management
  getOrganizationPendingHours: async (filters?: any) => axios.get('/organization/hours/pending', { params: filters }),
  approveVolunteerHour: async (id: number, notes?: string) =>
    axios.post(`/organization/hours/${id}/approve`, { notes }),
  rejectVolunteerHour: async (id: number, reason?: string) =>
    axios.post(`/organization/hours/${id}/reject`, { reason }),
  bulkApproveHours: async (ids: number[]) => axios.post('/organization/hours/bulk-approve', { ids }),
  getVolunteerHours: async (volunteerId: number, filters?: any) =>
    axios.get(`/organization/volunteers/${volunteerId}/hours`, { params: filters }),

  // Volunteer Analytics
  getVolunteerAnalytics: async (dateRange?: any) =>
    axios.get('/organization/analytics/volunteers', { params: dateRange }),
  getVolunteerLeaderboard: async (params?: any) => axios.get('/organization/analytics/leaderboard', { params }),
  getVolunteerTrends: async (dateRange?: any) => axios.get('/organization/analytics/trends', { params: dateRange }),

  // Communications
  getOrganizationCommunications: async (filters?: any) =>
    axios.get('/organization/communications', { params: filters }),
  sendOrganizationMessage: async (data: any) => axios.post('/organization/communications/send', data),
  getOrganizationCommunication: async (id: number) => axios.get(`/organization/communications/${id}`),
  broadcastOrganizationMessage: async (data: any) => axios.post('/organization/communications/broadcast', data)
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
