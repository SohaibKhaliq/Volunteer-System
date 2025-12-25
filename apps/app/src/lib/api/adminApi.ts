/**
 * Admin Panel API Client
 * Authenticated endpoints for admin panel
 */

import { axios } from '../axios';

export const adminApi = {
  // ==========================================
  // DASHBOARD & OVERVIEW
  // ==========================================
  getDashboard: async () => axios.get('/admin/dashboard'),
  getAnalytics: async (params?: any) => axios.get('/admin/analytics', { params }),
  getSummary: async () => axios.get('/admin/summary'),
  getFeatures: async () => axios.get('/admin/features'),
  getActivity: async (params?: any) => axios.get('/admin/activity', { params }),
  getPendingHoursByOrg: async (params?: any) => axios.get('/admin/pending-hours/organizations', { params }),
  exportSummary: async (format?: string) => axios.get('/admin/export', { params: { format } }),

  // ==========================================
  // ORGANIZATION MANAGEMENT
  // ==========================================
  listOrganizations: async (params?: any) => axios.get('/admin/organizations', { params }),
  approveOrganization: async (id: number) => axios.post(`/admin/organizations/${id}/approve`),
  suspendOrganization: async (id: number, reason?: string) =>
    axios.post(`/admin/organizations/${id}/suspend`, { reason }),
  reactivateOrganization: async (id: number) => axios.post(`/admin/organizations/${id}/reactivate`),
  archiveOrganization: async (id: number) => axios.post(`/admin/organizations/${id}/archive`),

  // Organization resources (admin view)
  getOrganizationResources: async (orgId: number, params?: any) =>
    axios.get(`/organizations/${orgId}/resources`, { params }),

  // Organization invitations (admin view)
  getOrganizationInvites: async (orgId: number, status?: string) =>
    axios.get(`/organizations/${orgId}/invites`, { params: status ? { status } : undefined }),
  adminAcceptOrganizationInvite: async (orgId: number, inviteId: number, userId: number) =>
    axios.post(`/admin/organizations/${orgId}/invites/${inviteId}/accept`, { userId }),

  // ==========================================
  // USER MANAGEMENT
  // ==========================================
  listUsers: async (params?: any) => axios.get('/admin/users', { params }),
  disableUser: async (id: number, reason?: string) => axios.post(`/admin/users/${id}/disable`, { reason }),
  enableUser: async (id: number) => axios.post(`/admin/users/${id}/enable`),
  getUserAnalytics: async () => axios.get('/users/analytics'),
  getUser: async (id: number) => {
    const res = await axios.get(`/users/${id}`);
    return (res && (res.data ?? res)) || res;
  },
  createUser: async (payload: any) => axios.post('/users', payload),
  updateUser: async (id: number, data: any) => axios.put(`/users/${id}`, data),
  deleteUser: async (id: number) => axios.delete(`/users/${id}`),
  sendReengagementEmail: async (id: number) => axios.post(`/users/${id}/remind`),
  bulkUpdateUsers: async (ids: number[], action: string) => axios.post('/users/bulk', { ids, action }),
  addUserRole: async (userId: number, roleId: number) => axios.post(`/users/${userId}/roles`, { roleId }),
  removeUserRole: async (userId: number, roleId: number) => axios.delete(`/users/${userId}/roles/${roleId}`),
  activateUser: async (id: number) => axios.post(`/users/${id}/activate`),

  // ==========================================
  // EVENTS MANAGEMENT
  // ==========================================
  listEvents: async (params?: any) => axios.get('/events', { params }),
  createEvent: async (data: any) => axios.post('/events', data),
  updateEvent: async (id: number, data: any) => axios.put(`/events/${id}`, data),
  deleteEvent: async (id: number) => axios.delete(`/events/${id}`),
  aiMatchVolunteers: async (id: number) => axios.post(`/events/${id}/ai-match`),
  joinEvent: async (id: number) => axios.post(`/events/${id}/join`),

  // ==========================================
  // TASKS MANAGEMENT
  // ==========================================
  listTasks: async (params?: any) => axios.get('/tasks', { params }),
  createTask: async (data: any) => axios.post('/tasks', data),
  updateTask: async (id: number, data: any) => axios.put(`/tasks/${id}`, data),
  deleteTask: async (id: number) => axios.delete(`/tasks/${id}`),

  // ==========================================
  // VOLUNTEER HOURS
  // ==========================================
  listHours: async () => axios.get('/hours'),
  updateHour: async (id: number, data: any) => axios.put(`/hours/${id}`, data),
  bulkUpdateHours: async (ids: number[], status: string) => axios.post('/hours/bulk', { ids, status }),

  // ==========================================
  // COMPLIANCE & BACKGROUND CHECKS
  // ==========================================
  listCompliance: async () => axios.get('/compliance'),
  createCompliance: async (data: any) => axios.post('/compliance', data),
  updateComplianceDoc: async (id: number, data: any) => axios.put(`/compliance/${id}`, data),
  deleteCompliance: async (id: number) => axios.delete(`/compliance/${id}`),
  getComplianceFile: async (id: number) => axios.get(`/compliance/${id}/file`, { responseType: 'blob' }),
  createComplianceWithFile: async (data: FormData) =>
    axios.post('/compliance', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateComplianceDocWithFile: async (id: number, data: FormData) =>
    axios.put(`/compliance/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  sendComplianceReminder: async (userId: number) => axios.post(`/compliance/remind/${userId}`),

  // Australian Compliance - WWCC Validation
  validateWWCC: async (wwccNumber: string, state: string) =>
    axios.post('/compliance/validate-wwcc', { wwccNumber, state }),

  listBackgroundChecks: async () => axios.get('/background-checks'),
  createBackgroundCheck: async (data: any) => axios.post('/background-checks', data),
  updateBackgroundCheck: async (id: number, data: any) => axios.put(`/background-checks/${id}`, data),
  deleteBackgroundCheck: async (id: number) => axios.delete(`/background-checks/${id}`),

  // ==========================================
  // CENTRELINK REPORTING
  // ==========================================
  getCentrelinkFortnight: async (userId: number) => axios.get(`/centrelink/fortnight/${userId}`),
  generateSU462: async (userId: number, period?: number) =>
    axios.get(`/centrelink/su462/${userId}`, { params: period ? { period } : undefined }),
  exportSU462CSV: async (userId: number, period?: number) =>
    axios.get(`/centrelink/su462/${userId}/csv`, {
      params: period ? { period } : undefined,
      responseType: 'blob'
    }),

  // ==========================================
  // NOTIFICATION TEMPLATES
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
  // SYSTEM SETTINGS
  // ==========================================
  getSettings: async () => axios.get('/settings'),
  updateSettings: async (data: any) => axios.post('/settings', data),
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

  // ==========================================
  // BACKUP & RESTORE
  // ==========================================
  createBackup: async () => axios.get('/admin/backup'),
  getBackupStatus: async () => axios.get('/admin/backup/status'),

  // ==========================================
  // INVITE SEND JOBS
  // ==========================================
  listInviteSendJobs: async (params?: any) => axios.get('/admin/invite-send-jobs', { params }),
  getInviteSendJob: async (id: number) => axios.get(`/admin/invite-send-jobs/${id}`),
  retryInviteSendJob: async (id: number) => axios.post(`/admin/invite-send-jobs/${id}/retry`),
  getInviteSendJobsStats: async () => axios.get('/admin/invite-send-jobs/stats'),
  retryAllFailedInviteSendJobs: async () => axios.post('/admin/invite-send-jobs/retry-failed'),

  // ==========================================
  // SCHEDULED JOBS
  // ==========================================
  listScheduledJobs: async () => axios.get('/scheduled-jobs'),
  getScheduledJob: async (id: number) => axios.get(`/scheduled-jobs/${id}`),
  createScheduledJob: async (data: any) => axios.post('/scheduled-jobs', data),
  retryScheduledJob: async (id: number) => axios.post(`/scheduled-jobs/${id}/retry`),

  // ==========================================
  // MONITORING
  // ==========================================
  getMonitoringStats: async () => axios.get('/monitoring/stats'),
  getMonitoringRecent: async () => axios.get('/monitoring/recent'),

  // ==========================================
  // COMMUNICATIONS
  // ==========================================
  listCommunications: async () => axios.get('/communications'),
  createCommunication: async (data: any) => axios.post('/communications', data),
  getCommunication: async (id: number) => axios.get(`/communications/${id}`),
  updateCommunication: async (id: number, data: any) => axios.put(`/communications/${id}`, data),
  deleteCommunication: async (id: number) => axios.delete(`/communications/${id}`),
  listCommunicationLogs: async (communicationId: number) => axios.get(`/communications/${communicationId}/logs`),
  retryCommunicationLog: async (logId: number) => axios.post(`/communications/logs/${logId}/retry`),
  bulkRetryCommunicationLogs: async (ids: number[]) => axios.post(`/communications/logs/bulk-retry`, { ids }),

  // ==========================================
  // REPORTS & ANALYTICS
  // ==========================================
  getReports: async <T = unknown>(params?: Record<string, unknown>): Promise<T> =>
    (await axios.get('/reports', { params })) as Promise<T>,
  getReportsOverview: async (params?: Record<string, unknown>) => {
    try {
      return await axios.get('/reports', { params, _skipAuthRedirect: true });
    } catch (e) {
      return null as unknown as any;
    }
  },
  getVolunteerStats: async (params?: Record<string, unknown>) => axios.get('/reports/volunteers', { params }),
  getEventStats: async (params?: Record<string, unknown>) => axios.get('/reports/events', { params }),
  getHoursStats: async (params?: Record<string, unknown>) => axios.get('/reports/hours', { params }),
  getOrganizationStats: async () => axios.get('/reports/organizations'),
  getComplianceStats: async () => axios.get('/reports/compliance'),
  exportReport: async (type: string, reportType: string) =>
    axios.get('/reports/export', { params: { type, reportType } }),
  downloadReport: async (reportType: string, format = 'csv') =>
    axios.get('/reports/export', { params: { reportType, type: format }, responseType: 'blob' }),

  // ==========================================
  // RESOURCES
  // ==========================================
  listResources: async () => {
    const res = await axios.get('/resources');
    if (Array.isArray(res)) return res;
    if (res && Array.isArray((res as any).data)) return (res as any).data;
    if (res && Array.isArray((res as any).resources)) return (res as any).resources;
    return [] as const;
  },
  createResource: async (data: any) => axios.post('/resources', data),
  updateResource: async (id: number, data: any) => axios.put(`/resources/${id}`, data),
  deleteResource: async (id: number) => axios.delete(`/resources/${id}`),
  getResource: async (id: number) => axios.get(`/resources/${id}`),
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

  // ==========================================
  // AUDIT LOGS
  // ==========================================
  listAuditLogs: async (params?: { page?: number; limit?: number; q?: string }) => axios.get('/audit-logs', { params }),
  getAuditLog: async (id: number) => axios.get(`/audit-logs/${id}`),

  // ==========================================
  // SURVEYS
  // ==========================================
  listSurveys: async () => axios.get('/surveys'),
  createSurvey: async (data: any) => axios.post('/surveys', data),
  getSurvey: async (id: number) => axios.get(`/surveys/${id}`),
  updateSurvey: async (id: number, data: any) => axios.put(`/surveys/${id}`, data),
  deleteSurvey: async (id: number) => axios.delete(`/surveys/${id}`),
  listSurveyResponses: async (id: number) => axios.get(`/surveys/${id}/responses`),
  exportSurveyResponses: async (id: number, format = 'csv') =>
    axios.get(`/surveys/${id}/responses/export`, {
      params: { type: format },
      responseType: format === 'csv' ? 'blob' : undefined
    }),

  // ==========================================
  // COURSES
  // ==========================================
  listCourses: async () => axios.get('/courses'),
  createCourse: async (data: any) => axios.post('/courses', data),
  getCourse: async (id: number) => axios.get(`/courses/${id}`),
  updateCourse: async (id: number, data: any) => axios.put(`/courses/${id}`, data),
  deleteCourse: async (id: number) => axios.delete(`/courses/${id}`),

  // ==========================================
  // ASSIGNMENTS
  // ==========================================
  listAssignments: async () => axios.get('/assignments'),
  createAssignment: async (data: any) => axios.post('/assignments', data),
  updateAssignment: async (id: number, data: any) => axios.put(`/assignments/${id}`, data),
  deleteAssignment: async (id: number) => axios.delete(`/assignments/${id}`),

  // ==========================================
  // SHIFTS & SCHEDULING
  // ==========================================
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

  // ==========================================
  // ACHIEVEMENTS
  // ==========================================
  listAchievements: async (params?: any) => axios.get('/achievements', { params }),
  createAchievement: async (data: any) => axios.post('/achievements', data),
  updateAchievement: async (id: number, data: any) => axios.put(`/achievements/${id}`, data),
  deleteAchievement: async (id: number) => axios.delete(`/achievements/${id}`),

  // ==========================================
  // ROLES & TYPES
  // ==========================================
  listRoles: async () => axios.get('/roles'),
  createRole: async (data: any) => axios.post('/roles', data),
  updateRole: async (id: number, data: any) => axios.put(`/roles/${id}`, data),
  deleteRole: async (id: number) => axios.delete(`/roles/${id}`),

  // ==========================================
  // PERMISSIONS & FEATURE FLAGS
  // ==========================================
  listPermissions: async () => axios.get('/permissions'),
  createPermission: async (data: any) => axios.post('/permissions', data),
  updatePermission: async (id: number, data: any) => axios.put(`/permissions/${id}`, data),
  deletePermission: async (id: number) => axios.delete(`/permissions/${id}`),

  listFeatureFlags: async () => axios.get('/feature-flags'),
  createFeatureFlag: async (data: any) => axios.post('/feature-flags', data),
  updateFeatureFlag: async (id: number, data: any) => axios.put(`/feature-flags/${id}`, data),
  deleteFeatureFlag: async (id: number) => axios.delete(`/feature-flags/${id}`),

  listTypes: async () => axios.get('/types'),
  createType: async (data: any) => axios.post('/types', data),
  updateType: async (id: number, data: any) => axios.put(`/types/${id}`, data),
  deleteType: async (id: number) => axios.delete(`/types/${id}`),

  // ==========================================
  // NOTIFICATIONS
  // ==========================================
  listNotifications: async (params?: any) => axios.get('/notifications', { params }),
  markNotificationRead: async (id: number) => axios.put(`/notifications/${id}/read`),
  markNotificationUnread: async (id: number) => axios.put(`/notifications/${id}/unread`),

  // ==========================================
  // CALENDAR
  // ==========================================
  getEventsCalendar: async (params?: { from?: string; to?: string; organizationId?: number }) =>
    axios.get('/calendar/events', { params, responseType: 'blob' })
};

export default adminApi;
