/**
 * Unified API Client
 * Exports all API clients with 100% backend coverage
 */

export { publicApi } from './publicApi';
export { volunteerApi } from './volunteerApi';
export { organizationApi } from './organizationApi';
export { adminApi } from './adminApi';

import { publicApi } from './publicApi';
import { volunteerApi } from './volunteerApi';
import { organizationApi } from './organizationApi';
import { adminApi } from './adminApi';
import { axios } from '../axios';

/**
 * Unified API client for backwards compatibility
 * Combines all API clients into a single object
 */
const api = {
  // Auth (shared)
  login: async (credentials: any) => axios.post('/login', credentials),
  register: async (data: any) => axios.post('/register', data),
  logout: async () => axios.post('/logout'),
  getCurrentUser: async () => axios.get('/me', { _skipAuthRedirect: true } as any),

  // Invite acceptance (auth required)
  acceptInvite: async (token: string) => axios.post(`/invites/${token}/accept`),

  // Public API
  ...publicApi,

  // Volunteer API
  ...volunteerApi,

  // Organization API (with prefixed names for clarity)
  updateOrganizationProfile: organizationApi.updateProfile,
  getOrganizationProfile: organizationApi.getProfile,
  getOrganizationSettings: organizationApi.getSettings,
  updateOrganizationSettings: organizationApi.updateSettings,
  listOrganizationTeam: organizationApi.listTeam,
  inviteTeamMember: organizationApi.inviteTeamMember,
  updateTeamMember: organizationApi.updateTeamMember,
  deleteTeamMember: organizationApi.deleteTeamMember,
  listOrganizationTeams: organizationApi.listTeams,
  createOrganizationTeam: organizationApi.createTeam,
  getOrganizationTeam: organizationApi.getTeam,
  updateOrganizationTeam: organizationApi.updateTeam,
  deleteOrganizationTeam: organizationApi.deleteTeam,
  listOrganizationEvents: organizationApi.listEvents,
  createOrganizationEvent: organizationApi.createEvent,
  updateOrganizationEvent: organizationApi.updateEvent,
  deleteOrganizationEvent: organizationApi.deleteEvent,
  listOrganizationOpportunities: organizationApi.listOpportunities,
  createOrganizationOpportunity: organizationApi.createOpportunity,
  getOpportunity: publicApi.getOpportunity,
  updateOrganizationOpportunity: organizationApi.updateOpportunity,
  deleteOrganizationOpportunity: organizationApi.deleteOpportunity,
  publishOpportunity: organizationApi.publishOpportunity,
  listOrganizationApplications: organizationApi.listApplications,
  getOpportunityApplications: organizationApi.getOpportunityApplications,
  updateApplication: organizationApi.updateApplication,
  bulkUpdateApplications: organizationApi.bulkUpdateApplications,
  applyToOpportunity: volunteerApi.applyToOpportunity,
  withdrawApplication: volunteerApi.withdrawApplication,
  listOrganizationAttendances: organizationApi.listAttendances,
  getOpportunityAttendances: organizationApi.getOpportunityAttendances,
  manualCheckIn: organizationApi.manualCheckIn,
  getAttendanceSummary: organizationApi.getAttendanceSummary,
  updateAttendance: organizationApi.updateAttendance,
  deleteAttendance: organizationApi.deleteAttendance,
  checkInToOpportunity: volunteerApi.checkInToOpportunity,
  checkOutFromOpportunity: volunteerApi.checkOutFromOpportunity,
  qrCheckIn: volunteerApi.qrCheckIn,
  getOpportunityCheckinCode: organizationApi.getOpportunityCheckinCode,
  regenerateOpportunityCheckinCode: organizationApi.regenerateOpportunityCheckinCode,
  listOrganizationVolunteers: organizationApi.listVolunteers,
  addOrganizationVolunteer: organizationApi.addVolunteer,
  updateOrganizationVolunteer: organizationApi.updateVolunteer,
  deleteOrganizationVolunteer: organizationApi.deleteVolunteer,
  listOrganizationDocuments: organizationApi.listDocuments,
  uploadOrganizationDocument: organizationApi.uploadDocument,
  deleteOrganizationDocument: organizationApi.deleteDocument,
  getOrganizationComplianceStats: organizationApi.getComplianceStats,
  getOrganizationDashboardStats: organizationApi.getDashboardStats,
  getOrganizationPendingHours: organizationApi.getPendingHours,
  approveVolunteerHour: organizationApi.approveHour,
  rejectVolunteerHour: organizationApi.rejectHour,
  bulkApproveHours: organizationApi.bulkApproveHours,
  getVolunteerHoursForOrganization: organizationApi.getVolunteerHours,
  getVolunteerAnalytics: organizationApi.getVolunteerAnalytics,
  getVolunteerLeaderboard: organizationApi.getVolunteerLeaderboard,
  getVolunteerTrends: organizationApi.getVolunteerTrends,
  getOrganizationCommunications: organizationApi.getCommunications,
  sendOrganizationMessage: organizationApi.sendMessage,
  getOrganizationCommunication: organizationApi.getCommunication,
  broadcastOrganizationMessage: organizationApi.broadcastMessage,
  listOrganizationAchievements: organizationApi.listAchievements,
  createOrganizationAchievement: organizationApi.createAchievement,
  updateOrganizationAchievement: organizationApi.updateAchievement,
  deleteOrganizationAchievement: organizationApi.deleteAchievement,
  listMyOrganizationResources: organizationApi.listResources,
  importVolunteers: organizationApi.importVolunteers,
  importOpportunities: organizationApi.importOpportunities,
  getVolunteersTemplate: organizationApi.getVolunteersTemplate,
  getOpportunitiesTemplate: organizationApi.getOpportunitiesTemplate,
  exportVolunteers: organizationApi.exportVolunteers,
  exportOpportunities: organizationApi.exportOpportunities,
  exportApplications: organizationApi.exportApplications,
  exportAttendances: organizationApi.exportAttendances,
  exportHours: organizationApi.exportHours,
  getReportsSummary: organizationApi.getReportsSummary,
  getVolunteerHoursReport: organizationApi.getVolunteerHoursReport,
  getOpportunityPerformanceReport: organizationApi.getOpportunityPerformanceReport,
  getVolunteerRetentionReport: organizationApi.getVolunteerRetentionReport,
  getOrganizationOpportunitiesCalendar: organizationApi.getOrganizationOpportunitiesCalendar,

  // Admin API (with prefixed names)
  getAdminDashboard: adminApi.getDashboard,
  getAdminAnalytics: adminApi.getAnalytics,
  getAdminSummary: adminApi.getSummary,
  getAdminFeatures: adminApi.getFeatures,
  // Backwards-compatible alias used in some consumers
  getFeatures: adminApi.getFeatures,
  getAdminActivity: adminApi.getActivity,
  getAdminPendingHoursByOrg: adminApi.getPendingHoursByOrg,
  exportAdminSummary: adminApi.exportSummary,
  getAdminOrganizations: adminApi.listOrganizations,
  approveOrganization: adminApi.approveOrganization,
  suspendOrganization: adminApi.suspendOrganization,
  reactivateOrganization: adminApi.reactivateOrganization,
  archiveOrganization: adminApi.archiveOrganization,
  getOrganizationResources: adminApi.getOrganizationResources,
  getOrganizationInvites: adminApi.getOrganizationInvites,
  adminAcceptOrganizationInvite: adminApi.adminAcceptOrganizationInvite,
  getAdminUsers: adminApi.listUsers,
  disableUser: adminApi.disableUser,
  enableUser: adminApi.enableUser,
  getUserAnalytics: adminApi.getUserAnalytics,
  getUser: adminApi.getUser,
  createUser: adminApi.createUser,
  updateUser: adminApi.updateUser,
  deleteUser: adminApi.deleteUser,
  sendReengagementEmail: adminApi.sendReengagementEmail,
  bulkUpdateUsers: adminApi.bulkUpdateUsers,
  addUserRole: adminApi.addUserRole,
  removeUserRole: adminApi.removeUserRole,
  activateUser: adminApi.activateUser,
  listEvents: adminApi.listEvents,
  createEvent: adminApi.createEvent,
  updateEvent: adminApi.updateEvent,
  deleteEvent: adminApi.deleteEvent,
  aiMatchVolunteers: adminApi.aiMatchVolunteers,
  joinEvent: adminApi.joinEvent,
  listTasks: adminApi.listTasks,
  createTask: adminApi.createTask,
  updateTask: adminApi.updateTask,
  deleteTask: adminApi.deleteTask,
  listHours: adminApi.listHours,
  getMyVolunteerHours: adminApi.listHours, // alias
  updateHour: adminApi.updateHour,
  bulkUpdateHours: adminApi.bulkUpdateHours,
  listCompliance: adminApi.listCompliance,
  createCompliance: adminApi.createCompliance,
  updateComplianceDoc: adminApi.updateComplianceDoc,
  deleteCompliance: adminApi.deleteCompliance,
  getComplianceFile: adminApi.getComplianceFile,
  createComplianceWithFile: adminApi.createComplianceWithFile,
  updateComplianceDocWithFile: adminApi.updateComplianceDocWithFile,
  sendComplianceReminder: adminApi.sendComplianceReminder,
  listBackgroundChecks: adminApi.listBackgroundChecks,
  createBackgroundCheck: adminApi.createBackgroundCheck,
  updateBackgroundCheck: adminApi.updateBackgroundCheck,
  deleteBackgroundCheck: adminApi.deleteBackgroundCheck,
  getNotificationTemplates: adminApi.getNotificationTemplates,
  createNotificationTemplate: adminApi.createNotificationTemplate,
  getNotificationTemplate: adminApi.getNotificationTemplate,
  updateNotificationTemplate: adminApi.updateNotificationTemplate,
  resetNotificationTemplate: adminApi.resetNotificationTemplate,
  deleteNotificationTemplate: adminApi.deleteNotificationTemplate,
  previewNotificationTemplate: adminApi.previewNotificationTemplate,
  getSettings: adminApi.getSettings,
  updateSettings: adminApi.updateSettings,
  getSystemSettings: adminApi.getSystemSettings,
  updateSystemSettings: adminApi.updateSystemSettings,
  updateBranding: adminApi.updateBranding,
  createBackup: adminApi.createBackup,
  getBackupStatus: adminApi.getBackupStatus,
  listInviteSendJobs: adminApi.listInviteSendJobs,
  getInviteSendJob: adminApi.getInviteSendJob,
  retryInviteSendJob: adminApi.retryInviteSendJob,
  getInviteSendJobsStats: adminApi.getInviteSendJobsStats,
  retryAllFailedInviteSendJobs: adminApi.retryAllFailedInviteSendJobs,
  listScheduledJobs: adminApi.listScheduledJobs,
  getScheduledJob: adminApi.getScheduledJob,
  createScheduledJob: adminApi.createScheduledJob,
  retryScheduledJob: adminApi.retryScheduledJob,
  getMonitoringStats: adminApi.getMonitoringStats,
  getMonitoringRecent: adminApi.getMonitoringRecent,
  listCommunications: adminApi.listCommunications,
  createCommunication: adminApi.createCommunication,
  getCommunication: adminApi.getCommunication,
  updateCommunication: adminApi.updateCommunication,
  deleteCommunication: adminApi.deleteCommunication,
  listCommunicationLogs: adminApi.listCommunicationLogs,
  retryCommunicationLog: adminApi.retryCommunicationLog,
  bulkRetryCommunicationLogs: adminApi.bulkRetryCommunicationLogs,
  getReports: adminApi.getReports,
  getReportsOverview: adminApi.getReportsOverview,
  getVolunteerStats: adminApi.getVolunteerStats,
  getEventStats: adminApi.getEventStats,
  getHoursStats: adminApi.getHoursStats,
  getOrganizationStats: adminApi.getOrganizationStats,
  getComplianceStats: adminApi.getComplianceStats,
  exportReport: adminApi.exportReport,
  downloadReport: adminApi.downloadReport,
  listResources: adminApi.listResources,
  createResource: adminApi.createResource,
  updateResource: adminApi.updateResource,
  deleteResource: adminApi.deleteResource,
  getResource: adminApi.getResource,
  getResourcesDashboard: adminApi.getResourcesDashboard,
  getLowStockResources: adminApi.getLowStockResources,
  getMaintenanceDueResources: adminApi.getMaintenanceDueResources,
  listResourceAssignments: adminApi.listResourceAssignments,
  assignResource: adminApi.assignResource,
  returnAssignment: adminApi.returnAssignment,
  patchResourceStatus: adminApi.patchResourceStatus,
  createMaintenance: adminApi.createMaintenance,
  retireResource: adminApi.retireResource,
  reactivateResource: adminApi.reactivateResource,
  listAuditLogs: adminApi.listAuditLogs,
  getAuditLog: adminApi.getAuditLog,
  listSurveys: adminApi.listSurveys,
  createSurvey: adminApi.createSurvey,
  getSurvey: adminApi.getSurvey,
  updateSurvey: adminApi.updateSurvey,
  deleteSurvey: adminApi.deleteSurvey,
  listSurveyResponses: adminApi.listSurveyResponses,
  exportSurveyResponses: adminApi.exportSurveyResponses,
  listCourses: adminApi.listCourses,
  createCourse: adminApi.createCourse,
  getCourse: adminApi.getCourse,
  updateCourse: adminApi.updateCourse,
  deleteCourse: adminApi.deleteCourse,
  listAssignments: adminApi.listAssignments,
  getMyAssignments: adminApi.listAssignments, // alias
  createAssignment: adminApi.createAssignment,
  updateAssignment: adminApi.updateAssignment,
  deleteAssignment: adminApi.deleteAssignment,
  listShifts: adminApi.listShifts,
  getShift: adminApi.getShift,
  getShiftSuggestions: adminApi.getShiftSuggestions,
  createShift: adminApi.createShift,
  updateShift: adminApi.updateShift,
  deleteShift: adminApi.deleteShift,
  listShiftAssignments: adminApi.listShiftAssignments,
  assignToShift: adminApi.assignToShift,
  bulkAssignToShift: adminApi.bulkAssignToShift,
  updateShiftAssignment: adminApi.updateShiftAssignment,
  deleteShiftAssignment: adminApi.deleteShiftAssignment,
  listAchievements: adminApi.listAchievements,
  createAchievement: adminApi.createAchievement,
  updateAchievement: adminApi.updateAchievement,
  deleteAchievement: adminApi.deleteAchievement,
  listRoles: adminApi.listRoles,
  createRole: adminApi.createRole,
  updateRole: adminApi.updateRole,
  deleteRole: adminApi.deleteRole,
  listTypes: publicApi.listTypes,
  createType: adminApi.createType,
  updateType: adminApi.updateType,
  deleteType: adminApi.deleteType,
  listNotifications: adminApi.listNotifications,
  markNotificationRead: adminApi.markNotificationRead,
  markNotificationUnread: adminApi.markNotificationUnread,
  getEventsCalendar: adminApi.getEventsCalendar,

  // Legacy organization endpoints (maintain compatibility)
  listOrganizations: publicApi.listOrganizations,
  createOrganization: async (payload: any) => axios.post('/organizations', payload),
  updateOrganization: async (id: number, data: any) => axios.put(`/organizations/${id}`, data),
  deleteOrganization: async (id: number) => axios.delete(`/organizations/${id}`),
  getOrganizationVolunteers: async (orgId: number, filters?: any) =>
    axios.get(`/organizations/${orgId}/volunteers`, { params: filters }),
  addOrganizationVolunteerForOrg: async (orgId: number, data: any) =>
    axios.post(`/organizations/${orgId}/volunteers`, data),
  joinOrganization: async (orgId: number) => axios.post(`/organizations/${orgId}/volunteers`, {}),
  updateOrganizationVolunteerForOrg: async (orgId: number, userId: number, data: any) =>
    axios.put(`/organizations/${orgId}/volunteers/${userId}`, data),
  removeOrganizationVolunteer: async (orgId: number, userId: number) =>
    axios.delete(`/organizations/${orgId}/volunteers/${userId}`),
  getOrganizationEvents: async (orgId: number) => axios.get(`/organizations/${orgId}/events`),
  getOrganizationTasks: async (orgId: number) => axios.get(`/organizations/${orgId}/tasks`),
  getOrganizationHours: async (orgId: number, filters?: any) =>
    axios.get(`/organizations/${orgId}/hours`, { params: filters }),
  approveOrganizationHours: async (orgId: number, hourIds: number[], status?: string, notes?: string) =>
    axios.post(`/organizations/${orgId}/hours/approve`, { hour_ids: hourIds, status, notes }),
  getOrganizationAnalytics: async (orgId: number, dateRange?: { startDate?: string; endDate?: string }) =>
    axios.get(`/organizations/${orgId}/analytics`, { params: dateRange }),
  getOrganizationCompliance: async (orgId: number) => axios.get(`/organizations/${orgId}/compliance`),
  sendOrganizationInvite: async (orgId: number, data: any) => axios.post(`/organizations/${orgId}/invites`, data),
  resendOrganizationInvite: async (orgId: number, inviteId: number) =>
    axios.post(`/organizations/${orgId}/invites/${inviteId}/resend`),
  cancelOrganizationInvite: async (orgId: number, inviteId: number) =>
    axios.delete(`/organizations/${orgId}/invites/${inviteId}`),

  // Legacy user endpoints
  listUsers: async (q?: string) => {
    const res = await axios.get('/users', { params: q ? { search: q } : undefined });
    if (Array.isArray(res)) return res;
    if (res && Array.isArray((res as any).data)) return (res as any).data;
    return [] as const;
  },
  listUsersPaged: async (q?: string, page = 1, perPage = 20, status?: string) =>
    axios.get('/users', { params: { ...(q ? { search: q } : {}), page, perPage, status } }),

  // Helper functions
  getChartData: async () => {
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
      // ignore
    }
    return [];
  },

  // Generic CRUD helpers
  list: async (resource: string, params?: any) => axios.get(`/${resource}`, { params }),
  create: async (resource: string, data: any) => axios.post(`/${resource}`, data),
  update: async (resource: string, id: number, data: any) => axios.put(`/${resource}/${id}`, data),
  delete: async (resource: string, id: number) => axios.delete(`/${resource}/${id}`)
} as const;

export default api as any;
