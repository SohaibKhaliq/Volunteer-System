/**
 * Organization Panel API Client
 * Authenticated endpoints for organization panel
 */

import { axios } from '../axios';

const getSelectedOrg = () => {
  try {
    const raw = localStorage.getItem('selectedOrganization') || localStorage.getItem('selectedOrganizationName');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return { id: 0, name: raw } as any;
    }
  } catch (e) {
    return null;
  }
};

const withOrgParams = (params?: any) => {
  const base = { ...(params || {}) };
  const sel = getSelectedOrg();
  if (!base.organizationId && sel && sel.id) base.organizationId = sel.id;
  if (!base.organizationName && sel && sel.name) base.organizationName = sel.name;
  return Object.keys(base).length ? base : undefined;
};

export const organizationApi = {
  // PROFILE & DASHBOARD
  // ==========================================
  getProfile: async (organizationId?: number) =>
    axios.get('/organization/profile', { params: withOrgParams(organizationId ? { organizationId } : undefined) }),
  updateProfile: async (data: any, organizationId?: number) =>
    axios.put('/organization/profile', data, {
      params: withOrgParams(organizationId ? { organizationId } : undefined)
    }),
  getDashboardStats: async (organizationId?: number) =>
    axios.get('/organization/dashboard-stats', {
      params: withOrgParams(organizationId ? { organizationId } : undefined)
    }),
  getSettings: async (organizationId?: number) =>
    axios.get('/organization/settings', { params: withOrgParams(organizationId ? { organizationId } : undefined) }),
  updateSettings: async (data: any, organizationId?: number) =>
    axios.patch('/organization/settings', data, {
      params: withOrgParams(organizationId ? { organizationId } : undefined)
    }),

  // ==========================================
  // TEAM MANAGEMENT
  // ==========================================
  listTeam: async (organizationId?: number) =>
    axios.get('/organization/team', { params: withOrgParams(organizationId ? { organizationId } : undefined) }),
  inviteTeamMember: async (data: any, organizationId?: number) =>
    axios.post('/organization/team/invite', data, {
      params: withOrgParams(organizationId ? { organizationId } : undefined)
    }),
  updateTeamMember: async (id: number, data: any, organizationId?: number) =>
    axios.put(`/organization/team/${id}`, data, {
      params: withOrgParams(organizationId ? { organizationId } : undefined)
    }),
  deleteTeamMember: async (id: number, organizationId?: number) =>
    axios.delete(`/organization/team/${id}`, {
      params: withOrgParams(organizationId ? { organizationId } : undefined)
    }),

  // ==========================================
  // TEAMS/DEPARTMENTS
  // ==========================================
  listTeams: async (params?: any) => axios.get('/organization/teams', { params: withOrgParams(params) }),
  createTeam: async (data: any) => axios.post('/organization/teams', data),
  getTeam: async (id: number) => axios.get(`/organization/teams/${id}`),
  updateTeam: async (id: number, data: any) => axios.put(`/organization/teams/${id}`, data),
  deleteTeam: async (id: number) => axios.delete(`/organization/teams/${id}`),

  // ==========================================
  // EVENTS
  // ==========================================
  listEvents: async () => axios.get('/organization/events', { params: withOrgParams(undefined) }),
  createEvent: async (data: any) => axios.post('/organization/events', data, { params: withOrgParams(undefined) }),
  updateEvent: async (id: number, data: any) =>
    axios.put(`/organization/events/${id}`, data, { params: withOrgParams(undefined) }),
  deleteEvent: async (id: number) => axios.delete(`/organization/events/${id}`, { params: withOrgParams(undefined) }),

  // ==========================================
  // OPPORTUNITIES
  // ==========================================
  listOpportunities: async (params?: any) =>
    axios.get('/organization/opportunities', { params: withOrgParams(params) }),
  createOpportunity: async (data: any) =>
    axios.post('/organization/opportunities', data, { params: withOrgParams(undefined) }),
  updateOpportunity: async (id: number, data: any) =>
    axios.put(`/organization/opportunities/${id}`, data, { params: withOrgParams(undefined) }),
  deleteOpportunity: async (id: number) =>
    axios.delete(`/organization/opportunities/${id}`, { params: withOrgParams(undefined) }),
  publishOpportunity: async (id: number, publish = true) =>
    axios.post(`/organization/opportunities/${id}/publish`, { publish }),

  // ==========================================
  // APPLICATIONS
  // ==========================================
  listApplications: async (params?: any) => axios.get('/organization/applications', { params: withOrgParams(params) }),
  getOpportunityApplications: async (opportunityId: number, params?: any) =>
    axios.get(`/organization/opportunities/${opportunityId}/applications`, { params: withOrgParams(params) }),
  updateApplication: async (id: number, data: any) => axios.patch(`/organization/applications/${id}`, data),
  bulkUpdateApplications: async (ids: number[], status: string, notes?: string) =>
    axios.post('/organization/applications/bulk', { ids, status, notes }),

  // ==========================================
  // ATTENDANCES
  // ==========================================
  listAttendances: async (params?: any) => axios.get('/organization/attendances', { params: withOrgParams(params) }),
  getOpportunityAttendances: async (opportunityId: number, params?: any) =>
    axios.get(`/organization/opportunities/${opportunityId}/attendances`, { params: withOrgParams(params) }),
  manualCheckIn: async (opportunityId: number, data: any) =>
    axios.post(`/organization/opportunities/${opportunityId}/manual-checkin`, data),
  getAttendanceSummary: async (opportunityId: number) =>
    axios.get(`/organization/opportunities/${opportunityId}/attendance-summary`),
  getOpportunityCheckinCode: async (opportunityId: number) =>
    axios.get(`/organization/opportunities/${opportunityId}/checkin-code`),
  regenerateOpportunityCheckinCode: async (opportunityId: number) =>
    axios.post(`/organization/opportunities/${opportunityId}/generate-checkin-code`),
  updateAttendance: async (id: number, data: any) => axios.put(`/organization/attendances/${id}`, data),
  deleteAttendance: async (id: number) => axios.delete(`/organization/attendances/${id}`),

  // ==========================================
  // VOLUNTEERS
  // ==========================================
  listVolunteers: async (params?: any) => axios.get('/organization/volunteers', { params: withOrgParams(params) }),
  addVolunteer: async (data: any) => axios.post('/organization/volunteers', data),
  updateVolunteer: async (id: number, data: any) => axios.put(`/organization/volunteers/${id}`, data),
  deleteVolunteer: async (id: number) => axios.delete(`/organization/volunteers/${id}`),

  // ==========================================
  // COMPLIANCE
  // ==========================================
  listDocuments: async () => axios.get('/organization/documents', { params: withOrgParams(undefined) }),
  uploadDocument: async (data: any) =>
    axios.post('/organization/documents', data, { params: withOrgParams(undefined) }),
  deleteDocument: async (id: number) =>
    axios.delete(`/organization/documents/${id}`, { params: withOrgParams(undefined) }),
  getComplianceStats: async () => axios.get('/organization/compliance/stats', { params: withOrgParams(undefined) }),

  // ==========================================
  // HOURS MANAGEMENT
  // ==========================================
  getPendingHours: async (filters?: any) =>
    axios.get('/organization/hours/pending', { params: withOrgParams(filters) }),
  approveHour: async (id: number, notes?: string) => axios.post(`/organization/hours/${id}/approve`, { notes }),
  rejectHour: async (id: number, reason?: string) => axios.post(`/organization/hours/${id}/reject`, { reason }),
  bulkApproveHours: async (ids: number[]) => axios.post('/organization/hours/bulk-approve', { ids }),
  getVolunteerHours: async (volunteerId: number, filters?: any) =>
    axios.get(`/organization/volunteers/${volunteerId}/hours`, { params: filters }),

  // ==========================================
  // ANALYTICS
  // ==========================================
  getVolunteerAnalytics: async (dateRange?: any) =>
    axios.get('/organization/analytics/volunteers', { params: withOrgParams(dateRange) }),
  getVolunteerLeaderboard: async (params?: any) =>
    axios.get('/organization/analytics/leaderboard', { params: withOrgParams(params) }),
  getVolunteerTrends: async (dateRange?: any) =>
    axios.get('/organization/analytics/trends', { params: withOrgParams(dateRange) }),

  // ==========================================
  // COMMUNICATIONS
  // ==========================================
  getCommunications: async (filters?: any) =>
    axios.get('/organization/communications', { params: withOrgParams(filters) }),
  sendMessage: async (data: any) =>
    axios.post('/organization/communications/send', data, { params: withOrgParams(undefined) }),
  getCommunication: async (id: number) =>
    axios.get(`/organization/communications/${id}`, { params: withOrgParams(undefined) }),
  broadcastMessage: async (data: any) =>
    axios.post('/organization/communications/broadcast', data, { params: withOrgParams(undefined) }),

  // ==========================================
  // ACHIEVEMENTS
  // ==========================================
  listAchievements: async (params?: any) => axios.get('/organization/achievements', { params: withOrgParams(params) }),
  createAchievement: async (data: any) => axios.post('/organization/achievements', data),
  updateAchievement: async (id: number, data: any) => axios.put(`/organization/achievements/${id}`, data),
  deleteAchievement: async (id: number) => axios.delete(`/organization/achievements/${id}`),

  // ==========================================
  // RESOURCES
  // ==========================================
  listResources: async (params?: any) => axios.get('/organization/resources', { params: withOrgParams(params) }),

  // ==========================================
  // IMPORT/EXPORT
  // ==========================================
  importVolunteers: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return axios.post('/organization/import/volunteers', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      params: withOrgParams(undefined)
    });
  },
  importOpportunities: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return axios.post('/organization/import/opportunities', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      params: withOrgParams(undefined)
    });
  },
  getVolunteersTemplate: async () =>
    axios.get('/organization/import/volunteers/template', { params: withOrgParams(undefined) }),
  getOpportunitiesTemplate: async () =>
    axios.get('/organization/import/opportunities/template', { params: withOrgParams(undefined) }),
  exportVolunteers: async (params?: any) =>
    axios.get('/organization/export/volunteers', { params: withOrgParams(params), responseType: 'blob' }),
  exportOpportunities: async (params?: any) =>
    axios.get('/organization/export/opportunities', { params: withOrgParams(params), responseType: 'blob' }),
  exportApplications: async (params?: any) =>
    axios.get('/organization/export/applications', { params: withOrgParams(params), responseType: 'blob' }),
  exportAttendances: async (params?: any) =>
    axios.get('/organization/export/attendances', { params: withOrgParams(params), responseType: 'blob' }),
  exportHours: async (params?: any) =>
    axios.get('/organization/export/hours', { params: withOrgParams(params), responseType: 'blob' }),

  // ==========================================
  // REPORTS
  // ==========================================
  getReportsSummary: async (params?: any) =>
    axios.get('/organization/reports/summary', { params: withOrgParams(params) }),
  getVolunteerHoursReport: async (params?: any) =>
    axios.get('/organization/reports/volunteer-hours', { params: withOrgParams(params) }),
  getOpportunityPerformanceReport: async (params?: any) =>
    axios.get('/organization/reports/opportunity-performance', { params: withOrgParams(params) }),
  getVolunteerRetentionReport: async () =>
    axios.get('/organization/reports/volunteer-retention', { params: withOrgParams(undefined) }),

  // ==========================================
  // CALENDAR
  // ==========================================
  getOrganizationOpportunitiesCalendar: async (params?: { from?: string; to?: string; status?: string }) =>
    axios.get('/calendar/organization-opportunities', { params: withOrgParams(params), responseType: 'blob' })
};

export default organizationApi;
