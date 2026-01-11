import { QueryFunction, QueryKey, useQuery } from '@tanstack/react-query';
import { LoginDTO } from 'shared';
import { axios } from './axios';
import organizationApi from './api/organizationApi';

const api = {
  /* User endpoints */
  /* User endpoints */
  login: async (credentials: any): Promise<LoginDTO | null> => {
    return axios.post('/login', credentials, { _suppressError: true });
  },
  register: async (data: any): Promise<LoginDTO | null> => {
    return axios.post('/register', data);
  },
  logout: async () => {
    return axios.post('/logout');
  },
  contact: async (data: any) => axios.post('/contact', data),
  getContactSubmissions: async (params?: any) => axios.get('/admin/contact-submissions', { params }),
  getHealth: async () => axios.get('/health'),

  /* Help Request endpoints */
  createHelpRequest: async (data: FormData) => {
    return axios.post('/help-requests', data);
  },
  listHelpRequests: async (params?: any) => axios.get('/help-requests', { params }),
  assignVolunteer: async (requestId: number, volunteerId: number) =>
    axios.post(`/help-requests/${requestId}/assign`, { volunteerId }),

  createHelpOffer: async (data: FormData) => {
    return axios.post('/offers', data);
  },
  createCarpooling: async (data: FormData) => {
    return axios.post('/carpooling-ads', data);
  },
  /* Admin / management endpoints */
  listOrganizations: async (params?: Record<string, unknown>) => axios.get('/organizations', { params }),
  createOrganization: async (payload: any) => axios.post('/organizations', payload),
  updateOrganization: async (id: number, data: any) => axios.put(`/organizations/${id}`, data),
  deleteOrganization: async (id: number) => axios.delete(`/organizations/${id}`),

  /* Organization Volunteer Management */
  getOrganizationVolunteers: async (orgId: number, filters?: any) =>
    axios.get(`/organizations/${orgId}/volunteers`, { params: filters }),
  /* New Membership Controller Methods */
  getOrganizationMembers: async (orgId: number, filters?: any) =>
    axios.get(`/organizations/${orgId}/members`, { params: filters }),
  updateOrganizationMemberStatus: async (orgId: number, memberId: number, status: string, notes?: string) =>
    axios.put(`/organizations/${orgId}/members/${memberId}`, { status, notes }),
  removeOrganizationMember: async (orgId: number, memberId: number) =>
    axios.delete(`/organizations/${orgId}/members/${memberId}`),

  addOrganizationVolunteerForOrg: async (orgId: number, data: any) =>
    axios.post(`/organizations/${orgId}/volunteers`, data),
  joinOrganization: async (orgId: number) => axios.post(`/organizations/${orgId}/volunteers`, {}),
  updateOrganizationVolunteerForOrg: async (orgId: number, userId: number, data: any) =>
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
  // Admin: accept an invite on behalf of a user
  adminAcceptOrganizationInvite: async (orgId: number, inviteId: number, userId: number) =>
    axios.post(`/admin/organizations/${orgId}/invites/${inviteId}/accept`, { userId }),
  acceptInvite: async (token: string) => axios.post(`/invites/${token}/accept`),
  rejectInvite: async (token: string) => axios.post(`/invites/${token}/reject`),

  listUsers: async (params?: string | any) => {
    const query = typeof params === 'string' ? { search: params } : params;
    const res = await axios.get('/users', { params: query });
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
  getComplianceFile: async (id: number) => axios.get(`/compliance/${id}/file`, { responseType: 'blob' }),
  // Helpers for uploading files with FormData when required by the UI
  createComplianceWithFile: async (data: FormData) =>
    axios.post('/compliance', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateComplianceDocWithFile: async (id: number, data: FormData) =>
    axios.put(`/compliance/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  sendComplianceReminder: async (userId: number) => axios.post(`/compliance/remind/${userId}`),
  createCompliance: async (data: any) => axios.post('/compliance', data),
  deleteCompliance: async (id: number) => axios.delete(`/compliance/${id}`),

  /* Background checks endpoints */
  listBackgroundChecks: async () => axios.get('/background-checks'),
  createBackgroundCheck: async (data: any) => axios.post('/background-checks', data),
  updateBackgroundCheck: async (id: number, data: any) => {
    if (data instanceof FormData) {
      return axios.put(`/background-checks/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
    }
    return axios.put(`/background-checks/${id}`, data);
  },
  getBackgroundCheckFile: async (id: number) => axios.get(`/background-checks/${id}/file`, { responseType: 'blob' }),
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

  getReportsOverview: async (params?: Record<string, unknown>) => {
    try {
      // Skip automatic auth redirect for this public-facing request so anonymous users
      // won't be forced to the /login page if the endpoint requires auth in some deployments.
      return await axios.get('/reports', { params, _skipAuthRedirect: true });
    } catch (e) {
      // If the endpoint requires auth (401) or another error occurs, return null so
      // public pages can render graceful fallbacks instead of navigating to /login.
      return null as unknown as any;
    }
  },
  getHomeStats: async () => axios.get('/home/stats'),

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
  getResource: async (id: number) => axios.get(`/resources/${id}`),
  getEvent: async (id: number) => {
    const res = await axios.get(`/events/${id}`);
    return (res && (res.data ?? res)) || res;
  },
  getUser: async (id: number) => {
    const res = await axios.get(`/users/${id}`);
    return (res && (res.data ?? res)) || res;
  },
  getResourcesDashboard: async () => axios.get('/resources/dashboard'),
  getLowStockResources: async () => axios.get('/resources/low-stock'),
  getMaintenanceDueResources: async () => axios.get('/resources/maintenance'),
  listResourceAssignments: async (resourceId: number) => axios.get(`/resources/${resourceId}/assignments`),
  assignResource: async (resourceId: number, data: any) => axios.post(`/resources/${resourceId}/assign`, data),
  returnAssignment: async (assignmentId: number, data: any) => axios.post(`/assignments/${assignmentId}/return`, data),
  patchResourceStatus: async (resourceId: number, data: any) => axios.patch(`/resources/${resourceId}/status`, data),
  createMaintenance: async (resourceId: number, data: any) => axios.post(`/resources/${resourceId}/maintenance`, data),
  retireResource: async (resourceId: number) => axios.post(`/resources/${resourceId}/retire`),
  reactivateResource: async (resourceId: number) => axios.post(`/resources/${resourceId}/reactivate`),
  // Organization-scoped resources
  listOrganizationResources: async (orgId: number, params?: any) =>
    axios.get(`/organizations/${orgId}/resources`, { params }),
  listMyOrganizationResources: async (params?: any) => axios.get('/organization/resources', { params }),

  /* Audit Logs endpoints */
  listAuditLogs: async (params?: { page?: number; limit?: number; q?: string }) => axios.get('/audit-logs', { params }),
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
  // Invite send jobs (admin)
  listInviteSendJobs: async (params?: any) => axios.get('/admin/invite-send-jobs', { params }),
  getInviteSendJob: async (id: number) => axios.get(`/admin/invite-send-jobs/${id}`),
  retryInviteSendJob: async (id: number) => axios.post(`/admin/invite-send-jobs/${id}/retry`),
  getInviteSendJobsStats: async () => axios.get('/admin/invite-send-jobs/stats'),
  retryAllFailedInviteSendJobs: async () => axios.post('/admin/invite-send-jobs/retry-failed'),

  /* Monitoring */
  getMonitoringStats: async () => axios.get('/monitoring/stats'),
  getMonitoringRecent: async () => axios.get('/monitoring/recent'),

  /* Admin summary for dashboard badges and counts */
  getAdminSummary: async () => axios.get('/admin/summary'),
  /* Admin server-driven feature flags */
  getAdminFeatures: async () => axios.get('/admin/features'),
  // Backwards-compatible alias used by older consumers
  getFeatures: async () => axios.get('/admin/features'),
  /* Admin: pending hours grouped by organization */
  getAdminPendingHoursByOrg: async (params?: any) => axios.get('/admin/pending-hours/organizations', { params }),

  /* System Settings endpoints */
  getSettings: async () => axios.get('/settings'),
  updateSettings: async (data: any) => axios.post('/settings', data),

  /* Notifications */
  listNotifications: async (params?: any) => axios.get('/notifications', { params }),
  getUnreadNotificationCount: async () => axios.get('/notifications/unread-count'),
  markNotificationRead: async (id: number) => axios.put(`/notifications/${id}/read`),
  markNotificationUnread: async (id: number) => axios.put(`/notifications/${id}/unread`),
  markAllNotificationsRead: async () => axios.post('/notifications/mark-all-read'),
  bulkMarkNotificationsRead: async (ids: number[]) => axios.post('/notifications/bulk-mark-read', { ids }),
  deleteNotification: async (id: number) => axios.delete(`/notifications/${id}`),
  // NOTE: SSE-based notifications stream was removed on the server and now returns 501.
  // Realtime notifications are delivered via Socket.IO — components should connect
  // with socket.io-client and update React Query caches instead of calling this
  // endpoint. Keep this helper here for backwards-compatibility but return a
  // clear error to avoid accidental calls.
  getNotificationsStream: async () => {
    return Promise.reject(
      new Error('Notifications SSE stream removed on server — use Socket.IO for realtime notifications')
    );
  },

  /* Notification Preferences */
  getNotificationPreferences: async () => axios.get('/notification-preferences'),
  updateNotificationPreferences: async (preferences: any[]) => axios.put('/notification-preferences', { preferences }),
  resetNotificationPreferences: async () => axios.post('/notification-preferences/reset'),

  /* User Preferences */
  getPreferences: async () => axios.get('/preferences'),
  updatePreferences: async (data: any) => axios.put('/preferences', data),
  resetPreferences: async () => axios.post('/preferences/reset'),

  /* Broadcasts (Admin) */
  listBroadcasts: async (params?: any) => axios.get('/admin/broadcasts', { params }),
  createBroadcast: async (data: any) => axios.post('/admin/broadcasts', data),
  getBroadcast: async (id: number) => axios.get(`/admin/broadcasts/${id}`),
  updateBroadcast: async (id: number, data: any) => axios.put(`/admin/broadcasts/${id}`, data),
  sendBroadcast: async (id: number) => axios.post(`/admin/broadcasts/${id}/send`),
  scheduleBroadcast: async (id: number, scheduledAt: string) =>
    axios.post(`/admin/broadcasts/${id}/schedule`, { scheduledAt }),
  cancelBroadcast: async (id: number) => axios.post(`/admin/broadcasts/${id}/cancel`),
  getBroadcastStats: async (id: number) => axios.get(`/admin/broadcasts/${id}/stats`),

  /* Volunteer Hours endpoints */
  listHours: async () => axios.get('/hours'),
  // Return volunteer hours — frontend may pass params (e.g. user_id) to filter on server
  getMyVolunteerHours: async (params?: any) => axios.get('/hours', { params }),
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
  // Convenience: fetch assignments (frontend can request and filter by user/task)
  getMyAssignments: async (params?: any) => axios.get('/assignments', { params }),
  createAssignment: async (data: any) => axios.post('/assignments', data),
  updateAssignment: async (id: number, data: any) => axios.put(`/assignments/${id}`, data),
  deleteAssignment: async (id: number) => axios.delete(`/assignments/${id}`),

  /* Compliance list endpoint */
  getComplianceTypes: async () => axios.get('/compliance/types'),
  // Compliance
  listCompliance: async () => axios.get('/compliance'),
  // return current authenticated user's profile (roles, flags)
  // _skipAuthRedirect true prevents axios interceptor from forcing a navigation
  // to /login if the token is invalid; AppProvider should decide whether to
  // redirect based on the current route. Cast to any to allow our custom flag.
  getCurrentUser: async () => axios.get('/me', { _skipAuthRedirect: true } as any),

  // Roles + Permissions
  getRoles: async () => axios.get('/roles'),

  updateOrganizationProfile: async (data: any, organizationId?: number) =>
    organizationApi.updateProfile(data, organizationId),
  getOrganizationProfile: async (organizationId?: number) => organizationApi.getProfile(organizationId),
  getOrganizationSettings: async (organizationId?: number) => organizationApi.getSettings(organizationId),
  updateOrganizationSettings: async (data: any, organizationId?: number) =>
    organizationApi.updateSettings(data, organizationId),

  // Team
  listOrganizationTeam: async (organizationId?: number) => organizationApi.listTeam(organizationId),
  inviteTeamMember: async (data: any, organizationId?: number) =>
    organizationApi.inviteTeamMember(data, organizationId),
  updateTeamMember: async (id: number, data: any, organizationId?: number) =>
    organizationApi.updateTeamMember(id, data, organizationId),
  deleteTeamMember: async (id: number, organizationId?: number) => organizationApi.deleteTeamMember(id, organizationId),

  // Teams/Departments
  listOrganizationTeams: async (params?: any) => organizationApi.listTeams(params),
  createOrganizationTeam: async (data: any) => organizationApi.createTeam(data),
  getOrganizationTeam: async (id: number) => organizationApi.getTeam(id),
  updateOrganizationTeam: async (id: number, data: any) => organizationApi.updateTeam(id, data),
  deleteOrganizationTeam: async (id: number) => organizationApi.deleteTeam(id),

  // Team Details
  getTeamMembers: async (teamId: number) => axios.get(`/organization/teams/${teamId}/members`),
  addTeamMember: async (teamId: number, data: any) => axios.post(`/organization/teams/${teamId}/members`, data),
  removeTeamMember: async (teamId: number, userId: number) =>
    axios.delete(`/organization/teams/${teamId}/members/${userId}`),

  getTeamResources: async (teamId: number) => axios.get(`/organization/teams/${teamId}/resources`),
  assignTeamResource: async (teamId: number, data: any) => axios.post(`/organization/teams/${teamId}/resources`, data),

  getTeamRequirements: async (teamId: number) => axios.get(`/organization/teams/${teamId}/requirements`),
  addTeamRequirement: async (teamId: number, data: any) =>
    axios.post(`/organization/teams/${teamId}/requirements`, data),
  deleteTeamRequirement: async (teamId: number, reqId: number) =>
    axios.delete(`/organization/teams/${teamId}/requirements/${reqId}`),

  // Events
  listOrganizationEvents: async () => axios.get('/organization/events'),
  createOrganizationEvent: async (data: any) => axios.post('/organization/events', data),
  updateOrganizationEvent: async (id: number, data: any) => axios.put(`/organization/events/${id}`, data),
  deleteOrganizationEvent: async (id: number) => axios.delete(`/organization/events/${id}`),

  // Opportunities (enhanced events/shifts)
  listOrganizationOpportunities: async (params?: any) => axios.get('/organization/opportunities', { params }),
  createOrganizationOpportunity: async (data: any) => axios.post('/organization/opportunities', data),
  getOpportunity: async (id: number) => axios.get(`/opportunities/${id}`),
  updateOrganizationOpportunity: async (id: number, data: any) => axios.put(`/organization/opportunities/${id}`, data),
  deleteOrganizationOpportunity: async (id: number) => axios.delete(`/organization/opportunities/${id}`),
  publishOpportunity: async (id: number, publish = true) =>
    axios.post(`/organization/opportunities/${id}/publish`, { publish }),

  // Applications for opportunities
  listOrganizationApplications: async (params?: any) => axios.get('/organization/applications', { params }),
  getOpportunityApplications: async (opportunityId: number, params?: any) =>
    axios.get(`/organization/opportunities/${opportunityId}/applications`, { params }),
  updateApplication: async (id: number, data: any) => axios.patch(`/organization/applications/${id}`, data),
  bulkUpdateApplications: async (ids: number[], status: string, notes?: string) =>
    axios.post('/organization/applications/bulk', { ids, status, notes }),
  applyToOpportunity: async (opportunityId: number, notes?: string) =>
    axios.post(`/opportunities/${opportunityId}/apply`, { notes }),
  withdrawApplication: async (id: number) => axios.delete(`/applications/${id}`),

  // Attendances
  listOrganizationAttendances: async (params?: any) => axios.get('/organization/attendances', { params }),
  getOpportunityAttendances: async (opportunityId: number, params?: any) =>
    axios.get(`/organization/opportunities/${opportunityId}/attendances`, { params }),
  manualCheckIn: async (opportunityId: number, data: any) =>
    axios.post(`/organization/opportunities/${opportunityId}/manual-checkin`, data),
  getAttendanceSummary: async (opportunityId: number) =>
    axios.get(`/organization/opportunities/${opportunityId}/attendance-summary`),
  updateAttendance: async (id: number, data: any) => axios.put(`/organization/attendances/${id}`, data),
  deleteAttendance: async (id: number) => axios.delete(`/organization/attendances/${id}`),
  checkInToOpportunity: async (opportunityId: number, method?: string, metadata?: any) =>
    axios.post(`/opportunities/${opportunityId}/checkin`, { method, metadata }),
  checkOutFromOpportunity: async (opportunityId: number) => axios.post(`/opportunities/${opportunityId}/checkout`),
  // QR Code check-in
  qrCheckIn: async (code: string) => axios.post('/checkin/qr', { code }),
  getOpportunityCheckinCode: async (opportunityId: number) =>
    axios.get(`/organization/opportunities/${opportunityId}/checkin-code`),
  regenerateOpportunityCheckinCode: async (opportunityId: number) =>
    axios.post(`/organization/opportunities/${opportunityId}/generate-checkin-code`),

  // CSV Import
  importVolunteers: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return axios.post('/organization/import/volunteers', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  importOpportunities: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return axios.post('/organization/import/opportunities', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  getVolunteersTemplate: async () => axios.get('/organization/import/volunteers/template'),
  getOpportunitiesTemplate: async () => axios.get('/organization/import/opportunities/template'),

  // Generic Import Helpers
  getImportTemplate: async (type: string) => axios.get('/imports/template', { params: { type }, responseType: 'blob' }),
  processGenericImport: async (file: File, type: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    return axios.post('/imports/process', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // CSV Export endpoints
  downloadGenericExport: async (type: string, format: 'csv' | 'json', params?: any) =>
    axios.get('/exports/download', { params: { type, format, ...params }, responseType: 'blob' }),

  // System Backup
  downloadDatabaseBackup: async () => axios.get('/admin/backup/database', { responseType: 'blob' }),
  downloadMediaBackup: async () => axios.get('/admin/backup/media', { responseType: 'blob' }),

  exportVolunteers: async (params?: any) =>
    axios.get('/organization/export/volunteers', { params, responseType: 'blob' }),
  exportOpportunities: async (params?: any) =>
    axios.get('/organization/export/opportunities', { params, responseType: 'blob' }),
  exportApplications: async (params?: any) =>
    axios.get('/organization/export/applications', { params, responseType: 'blob' }),
  exportAttendances: async (params?: any) =>
    axios.get('/organization/export/attendances', { params, responseType: 'blob' }),
  exportHours: async (params?: any) => axios.get('/organization/export/hours', { params, responseType: 'blob' }),

  // Organization Reports & Analytics
  getReportsSummary: async (params?: any) => axios.get('/organization/reports/summary', { params }),
  getVolunteerHoursReport: async (params?: any) => axios.get('/organization/reports/volunteer-hours', { params }),
  getOpportunityPerformanceReport: async (params?: any) =>
    axios.get('/organization/reports/opportunity-performance', { params }),
  getVolunteerRetentionReport: async () => axios.get('/organization/reports/volunteer-retention'),

  // Public Organization Pages
  getPublicOrganizations: async (params?: any) => axios.get('/public/organizations', { params }),
  getPublicOrganization: async (slug: string) => axios.get(`/public/organizations/${slug}`),
  getPublicOrganizationOpportunities: async (slug: string, params?: any) =>
    axios.get(`/public/organizations/${slug}/opportunities`, { params }),
  getPublicOrganizationOpportunity: async (slug: string, opportunityId: number) =>
    axios.get(`/public/organizations/${slug}/opportunities/${opportunityId}`),
  getPublicOrganizationCities: async () => axios.get('/public/organizations/cities'),
  getPublicOrganizationCountries: async () => axios.get('/public/organizations/countries'),
  getPublicOrganizationTypes: async () => axios.get('/public/organizations/types'),

  // Volunteers (organization panel)
  listOrganizationVolunteers: async (params?: any) => axios.get('/organization/volunteers', { params }),
  addOrganizationVolunteer: async (data: any) => axios.post('/organization/volunteers', data),
  updateOrganizationVolunteer: async (id: number, data: any) => axios.put(`/organization/volunteers/${id}`, data),
  deleteOrganizationVolunteer: async (id: number) => axios.delete(`/organization/volunteers/${id}`),
  approveOrganizationVolunteer: async (id: number) => axios.post(`/organization/volunteers/${id}/approve`),
  rejectOrganizationVolunteer: async (id: number, reason?: string) =>
    axios.post(`/organization/volunteers/${id}/reject`, { reason }),

  // Compliance
  listOrganizationDocuments: async () => axios.get('/organization/documents'),
  uploadOrganizationDocument: async (data: any) => axios.post('/organization/documents', data),
  deleteOrganizationDocument: async (id: number) => axios.delete(`/organization/documents/${id}`),
  getOrganizationComplianceStats: async () => axios.get('/organization/compliance/stats'),

  /* Compliance Requirements Management */
  getComplianceRequirements: async () => axios.get('/organization/compliance-requirements'),
  createComplianceRequirement: async (data: any) => axios.post('/organization/compliance-requirements', data),
  updateComplianceRequirement: async (id: number, data: any) =>
    axios.put(`/organization/compliance-requirements/${id}`, data),
  deleteComplianceRequirement: async (id: number) => axios.delete(`/organization/compliance-requirements/${id}`),

  // Dashboard
  getOrganizationDashboardStats: async () => axios.get('/organization/dashboard-stats'),

  /* Shift scheduling endpoints */
  listShifts: async (params?: any) => axios.get('/shifts', { params }),
  getShift: async (id: number) => axios.get(`/shifts/${id}`),
  getShiftSuggestions: async (id: number, limit = 10) => axios.get(`/shifts/${id}/suggestions`, { params: { limit } }),
  createShift: async (data: any) => axios.post('/shifts', data),
  updateShift: async (id: number, data: any) => axios.put(`/shifts/${id}`, data),
  deleteShift: async (id: number) => axios.delete(`/shifts/${id}`),
  listShiftAssignments: async (params?: any) => axios.get('/shift-assignments', { params }),
  assignToShift: async (data: any) => axios.post('/shift-assignments', data),
  bulkAssignToShift: async (data: any) => axios.post('/shift-assignments/bulk', data),
  updateShiftAssignment: async (id: number, data: any) => axios.put(`/shift-assignments/${id}`, data),
  deleteShiftAssignment: async (id: number) => axios.delete(`/shift-assignments/${id}`),

  /* Achievements */
  listAchievements: async (params?: any) => axios.get('/achievements', { params }),
  createAchievement: async (data: any) => axios.post('/achievements', data),
  updateAchievement: async (id: number, data: any) => axios.put(`/achievements/${id}`, data),
  deleteAchievement: async (id: number) => axios.delete(`/achievements/${id}`),
  // Organization-scoped achievement endpoints (organization panel)
  listOrganizationAchievements: async (params?: any) => axios.get('/organization/achievements', { params }),
  createOrganizationAchievement: async (data: any) => axios.post('/organization/achievements', data),
  updateOrganizationAchievement: async (id: number, data: any) => axios.put(`/organization/achievements/${id}`, data),
  deleteOrganizationAchievement: async (id: number) => axios.delete(`/organization/achievements/${id}`),

  // Volunteer Hours Management
  getOrganizationPendingHours: async (filters?: any) => axios.get('/organization/hours/pending', { params: filters }),
  approveVolunteerHour: async (id: number, notes?: string) =>
    axios.post(`/organization/hours/${id}/approve`, { notes }),
  rejectVolunteerHour: async (id: number, reason?: string) =>
    axios.post(`/organization/hours/${id}/reject`, { reason }),
  bulkApproveHours: async (ids: number[]) => axios.post('/organization/hours/bulk-approve', { ids }),
  getVolunteerHoursForOrganization: async (volunteerId: number, filters?: any) =>
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
  broadcastOrganizationMessage: async (data: any) => axios.post('/organization/communications/broadcast', data),

  // ==========================================
  // ADMIN PANEL API ENDPOINTS
  // ==========================================
  getAdminDashboard: async () => axios.get('/admin/dashboard'),
  getAdminAnalytics: async (params?: any) => axios.get('/admin/analytics', { params }),
  getAdminActivity: async (params?: any) => axios.get('/admin/activity', { params }),
  exportAdminSummary: async (format?: string) => axios.get('/admin/export', { params: { format } }),

  // Admin Organization Management
  getAdminOrganizations: async (params?: any) => axios.get('/admin/organizations', { params }),
  approveOrganization: async (id: number) => axios.post(`/admin/organizations/${id}/approve`),
  suspendOrganization: async (id: number, reason?: string) =>
    axios.post(`/admin/organizations/${id}/suspend`, { reason }),
  reactivateOrganization: async (id: number) => axios.post(`/admin/organizations/${id}/reactivate`),
  archiveOrganization: async (id: number) => axios.post(`/admin/organizations/${id}/archive`),

  // Admin User Management
  getAdminUsers: async (params?: any) => axios.get('/admin/users', { params }),
  disableUser: async (id: number, reason?: string) => axios.post(`/admin/users/${id}/disable`, { reason }),
  enableUser: async (id: number) => axios.post(`/admin/users/${id}/enable`),

  // ==========================================
  // VOLUNTEER PANEL API ENDPOINTS
  // ==========================================
  getVolunteerDashboard: async () => axios.get('/volunteer/dashboard'),
  getVolunteerProfile: async () => axios.get('/volunteer/profile'),
  updateVolunteerProfile: async (data: any) => axios.put('/volunteer/profile', data),
  updateVolunteerAvatar: async (data: FormData) => axios.put('/volunteer/profile/avatar', data),
  browseOrganizations: async (params?: any) => axios.get('/volunteer/organizations/browse', { params }),

  // Volunteer Opportunities
  browseOpportunities: async (params?: any) => axios.get('/volunteer/opportunities', { params }),
  getVolunteerOpportunityDetail: async (id: number) => axios.get(`/volunteer/opportunities/${id}`),
  bookmarkOpportunity: async (id: number) => axios.post(`/volunteer/opportunities/${id}/bookmark`),
  unbookmarkOpportunity: async (id: number) => axios.delete(`/volunteer/opportunities/${id}/bookmark`),
  getBookmarkedOpportunities: async () => axios.get('/volunteer/bookmarks'),

  // Volunteer Applications
  getVolunteerApplications: async (params?: any) => axios.get('/volunteer/applications', { params }),

  // Volunteer Attendance & Hours
  getVolunteerAttendance: async (params?: any) => axios.get('/volunteer/attendance', { params }),
  getVolunteerHours: async (params?: any) => axios.get('/volunteer/hours', { params }),

  // Volunteer Organizations
  getVolunteerOrganizations: async () => axios.get('/volunteer/organizations'),
  joinVolunteerOrganization: async (id: number, data?: { notes?: string }) =>
    axios.post(`/volunteer/organizations/${id}/join`, data),
  leaveVolunteerOrganization: async (id: number) => axios.delete(`/volunteer/organizations/${id}/leave`),

  // Volunteer Achievements
  getVolunteerAchievements: async () => axios.get('/volunteer/achievements'),

  // Volunteer Teams
  getMyTeams: async () => axios.get('/volunteer/teams'),

  // ==========================================
  // ROLES & TYPES MANAGEMENT
  // ==========================================
  // Roles
  createRole: async (data: any) => axios.post('/roles', data),
  updateRole: async (id: number, data: any) => axios.put(`/roles/${id}`, data),
  deleteRole: async (id: number) => axios.delete(`/roles/${id}`),

  // Permissions
  listPermissions: async () => axios.get('/permissions'),

  // Types
  listTypes: async () => axios.get('/types'),
  createType: async (data: any) => axios.post('/types', data),
  updateType: async (id: number, data: any) => axios.put(`/types/${id}`, data),
  deleteType: async (id: number) => axios.delete(`/types/${id}`),

  // ==========================================
  // CALENDAR / ICAL ROUTES
  // ==========================================
  getPublicOpportunitiesCalendar: async (params?: { organizationSlug?: string; from?: string; to?: string }) =>
    axios.get('/calendar/public-opportunities', { params, responseType: 'blob' }),
  getMyScheduleCalendar: async (params?: { from?: string; to?: string }) =>
    axios.get('/calendar/my-schedule', { params, responseType: 'blob' }),
  getOrganizationOpportunitiesCalendar: async (params?: { from?: string; to?: string; status?: string }) =>
    axios.get('/calendar/organization-opportunities', { params, responseType: 'blob' }),
  getEventsCalendar: async (params?: { from?: string; to?: string; organizationId?: number }) =>
    axios.get('/calendar/events', { params, responseType: 'blob' }),
  getCalendarSubscriptionUrls: async () => axios.get('/calendar/subscription-urls'),

  // ==========================================
  // ADMIN NOTIFICATION TEMPLATES
  // ==========================================
  getNotificationTemplates: async () => axios.get('/admin/templates'),
  createNotificationTemplate: async (data: { key: string; subject: string; body: string }) =>
    axios.post('/admin/templates', data),
  getNotificationTemplate: async (key: string) => axios.get(`/admin/templates/${key}`),
  updateNotificationTemplate: async (key: string, data: { subject: string; body: string }) =>
    axios.put(`/admin/templates/${key}`, data),
  resetNotificationTemplate: async (key: string) => axios.post(`/admin/templates/${key}/reset`),
  deleteNotificationTemplate: async (key: string) => axios.delete(`/admin/templates/${key}`),
  previewNotificationTemplate: async (data: {
    key?: string;
    subject: string;
    body: string;
    sampleData?: Record<string, string>;
  }) => axios.post('/admin/templates/preview', data),

  // ==========================================
  // ADMIN SYSTEM SETTINGS
  // ==========================================
  getSystemSettings: async () => axios.get('/admin/system-settings'),
  updateSystemSettings: async (settings: Record<string, any>) => axios.put('/admin/system-settings', settings),
  updateBranding: async (branding: {
    platform_name?: string;
    platform_tagline?: string;
    primary_color?: string;
    secondary_color?: string;
    logo_url?: string;
    favicon_url?: string;
  }) => axios.post('/admin/system-settings/branding', branding),
  createBackup: async () => axios.get('/admin/backup'),
  getBackupStatus: async () => axios.get('/admin/backup/status'),

  /* Chat */
  listChats: async () => axios.get('/chat'),
  getChat: async (id: number) => axios.get(`/chat/${id}`),
  sendMessage: async (data: any) => axios.post('/chat', data),
  startChat: async (data: any) => axios.post('/chat/start', data),
  /* Certificate Templates (Admin) */
  listCertificateTemplates: async (params?: any) => axios.get('/admin/certificate-templates', { params }),
  createCertificateTemplate: async (data: any) => axios.post('/admin/certificate-templates', data),
  getCertificateTemplate: async (id: number) => axios.get(`/admin/certificate-templates/${id}`),
  updateCertificateTemplate: async (id: number, data: any) => axios.put(`/admin/certificate-templates/${id}`, data),
  deleteCertificateTemplate: async (id: number) => axios.delete(`/admin/certificate-templates/${id}`),

  /* Training Modules (Organization) */
  listTrainingModules: async (params?: any) => axios.get('/organization/training-modules', { params }),
  createTrainingModule: async (data: any) => axios.post('/organization/training-modules', data),
  getTrainingModule: async (id: number) => axios.get(`/organization/training-modules/${id}`),
  updateTrainingModule: async (id: number, data: any) => axios.put(`/organization/training-modules/${id}`, data),
  deleteTrainingModule: async (id: number) => axios.delete(`/organization/training-modules/${id}`),

  /* Certificates (Organization) */
  listIssuedCertificates: async (params?: any) => axios.get('/organization/certificates', { params }),
  issueCertificate: async (data: any) => axios.post('/organization/certificates', data),
  revokeCertificate: async (id: number, reason: string) =>
    axios.post(`/organization/certificates/${id}/revoke`, { reason }),

  /* Training (Volunteer) */
  listVolunteerTraining: async () => axios.get('/volunteer/training'),
  getVolunteerTrainingModule: async (moduleId: number) => axios.get(`/volunteer/training/${moduleId}`),
  startVolunteerTraining: async (moduleId: number) => axios.post(`/volunteer/training/${moduleId}/start`),
  completeVolunteerTraining: async (moduleId: number, data: { score: number }) =>
    axios.post(`/volunteer/training/${moduleId}/complete`, data),

  /* Certificates (Volunteer) */
  getMyCertificates: async () => axios.get('/volunteer/certificates'),
  downloadCertificate: async (id: number) => axios.get(`/volunteer/certificates/${id}/download`),

  /* Verification (Public) */
  verifyCertificate: async (uuid: string) => axios.get(`/verify/${uuid}`), // Legacy method name, sticking to it for compat if used elsewhere? Or change?
  getPublicCertificate: async (id: string) => axios.get(`/public/certificates/${id}`)
} as const;

export const useLazyQuery = (key: QueryKey, fn: QueryFunction, options = {}) => {
  const query = useQuery(key, fn, {
    ...options,
    enabled: false
  });

  return [query.refetch, query];
};

export default api as any;
