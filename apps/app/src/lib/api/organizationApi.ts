/**
 * Organization Panel API Client
 * Authenticated endpoints for organization panel
 */

import { axios } from '../axios';

export const organizationApi = {
  // ==========================================
  // PROFILE & DASHBOARD
  // ==========================================
  getProfile: async () => axios.get('/organization/profile'),
  updateProfile: async (data: any) => axios.put('/organization/profile', data),
  getDashboardStats: async () => axios.get('/organization/dashboard-stats'),
  getSettings: async () => axios.get('/organization/settings'),
  updateSettings: async (data: any) => axios.patch('/organization/settings', data),

  // ==========================================
  // TEAM MANAGEMENT
  // ==========================================
  listTeam: async () => axios.get('/organization/team'),
  inviteTeamMember: async (data: any) => axios.post('/organization/team/invite', data),
  updateTeamMember: async (id: number, data: any) => axios.put(`/organization/team/${id}`, data),
  deleteTeamMember: async (id: number) => axios.delete(`/organization/team/${id}`),

  // ==========================================
  // TEAMS/DEPARTMENTS
  // ==========================================
  listTeams: async (params?: any) => axios.get('/organization/teams', { params }),
  createTeam: async (data: any) => axios.post('/organization/teams', data),
  getTeam: async (id: number) => axios.get(`/organization/teams/${id}`),
  updateTeam: async (id: number, data: any) => axios.put(`/organization/teams/${id}`, data),
  deleteTeam: async (id: number) => axios.delete(`/organization/teams/${id}`),

  // ==========================================
  // EVENTS
  // ==========================================
  listEvents: async () => axios.get('/organization/events'),
  createEvent: async (data: any) => axios.post('/organization/events', data),
  updateEvent: async (id: number, data: any) => axios.put(`/organization/events/${id}`, data),
  deleteEvent: async (id: number) => axios.delete(`/organization/events/${id}`),

  // ==========================================
  // OPPORTUNITIES
  // ==========================================
  listOpportunities: async (params?: any) => axios.get('/organization/opportunities', { params }),
  createOpportunity: async (data: any) => axios.post('/organization/opportunities', data),
  updateOpportunity: async (id: number, data: any) => axios.put(`/organization/opportunities/${id}`, data),
  deleteOpportunity: async (id: number) => axios.delete(`/organization/opportunities/${id}`),
  publishOpportunity: async (id: number, publish = true) =>
    axios.post(`/organization/opportunities/${id}/publish`, { publish }),

  // ==========================================
  // APPLICATIONS
  // ==========================================
  listApplications: async (params?: any) => axios.get('/organization/applications', { params }),
  getOpportunityApplications: async (opportunityId: number, params?: any) =>
    axios.get(`/organization/opportunities/${opportunityId}/applications`, { params }),
  updateApplication: async (id: number, data: any) => axios.patch(`/organization/applications/${id}`, data),
  bulkUpdateApplications: async (ids: number[], status: string, notes?: string) =>
    axios.post('/organization/applications/bulk', { ids, status, notes }),

  // ==========================================
  // ATTENDANCES
  // ==========================================
  listAttendances: async (params?: any) => axios.get('/organization/attendances', { params }),
  getOpportunityAttendances: async (opportunityId: number, params?: any) =>
    axios.get(`/organization/opportunities/${opportunityId}/attendances`, { params }),
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
  listVolunteers: async (params?: any) => axios.get('/organization/volunteers', { params }),
  addVolunteer: async (data: any) => axios.post('/organization/volunteers', data),
  updateVolunteer: async (id: number, data: any) => axios.put(`/organization/volunteers/${id}`, data),
  deleteVolunteer: async (id: number) => axios.delete(`/organization/volunteers/${id}`),

  // ==========================================
  // COMPLIANCE
  // ==========================================
  listDocuments: async () => axios.get('/organization/documents'),
  uploadDocument: async (data: any) => axios.post('/organization/documents', data),
  deleteDocument: async (id: number) => axios.delete(`/organization/documents/${id}`),
  getComplianceStats: async () => axios.get('/organization/compliance/stats'),

  // ==========================================
  // HOURS MANAGEMENT
  // ==========================================
  getPendingHours: async (filters?: any) => axios.get('/organization/hours/pending', { params: filters }),
  approveHour: async (id: number, notes?: string) => axios.post(`/organization/hours/${id}/approve`, { notes }),
  rejectHour: async (id: number, reason?: string) => axios.post(`/organization/hours/${id}/reject`, { reason }),
  bulkApproveHours: async (ids: number[]) => axios.post('/organization/hours/bulk-approve', { ids }),
  getVolunteerHours: async (volunteerId: number, filters?: any) =>
    axios.get(`/organization/volunteers/${volunteerId}/hours`, { params: filters }),

  // ==========================================
  // ANALYTICS
  // ==========================================
  getVolunteerAnalytics: async (dateRange?: any) =>
    axios.get('/organization/analytics/volunteers', { params: dateRange }),
  getVolunteerLeaderboard: async (params?: any) => 
    axios.get('/organization/analytics/leaderboard', { params }),
  getVolunteerTrends: async (dateRange?: any) => 
    axios.get('/organization/analytics/trends', { params: dateRange }),

  // ==========================================
  // COMMUNICATIONS
  // ==========================================
  getCommunications: async (filters?: any) => axios.get('/organization/communications', { params: filters }),
  sendMessage: async (data: any) => axios.post('/organization/communications/send', data),
  getCommunication: async (id: number) => axios.get(`/organization/communications/${id}`),
  broadcastMessage: async (data: any) => axios.post('/organization/communications/broadcast', data),

  // ==========================================
  // ACHIEVEMENTS
  // ==========================================
  listAchievements: async (params?: any) => axios.get('/organization/achievements', { params }),
  createAchievement: async (data: any) => axios.post('/organization/achievements', data),
  updateAchievement: async (id: number, data: any) => axios.put(`/organization/achievements/${id}`, data),
  deleteAchievement: async (id: number) => axios.delete(`/organization/achievements/${id}`),

  // ==========================================
  // RESOURCES
  // ==========================================
  listResources: async (params?: any) => axios.get('/organization/resources', { params }),

  // ==========================================
  // IMPORT/EXPORT
  // ==========================================
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
  exportVolunteers: async (params?: any) =>
    axios.get('/organization/export/volunteers', { params, responseType: 'blob' }),
  exportOpportunities: async (params?: any) =>
    axios.get('/organization/export/opportunities', { params, responseType: 'blob' }),
  exportApplications: async (params?: any) =>
    axios.get('/organization/export/applications', { params, responseType: 'blob' }),
  exportAttendances: async (params?: any) =>
    axios.get('/organization/export/attendances', { params, responseType: 'blob' }),
  exportHours: async (params?: any) => 
    axios.get('/organization/export/hours', { params, responseType: 'blob' }),

  // ==========================================
  // REPORTS
  // ==========================================
  getReportsSummary: async (params?: any) => axios.get('/organization/reports/summary', { params }),
  getVolunteerHoursReport: async (params?: any) => 
    axios.get('/organization/reports/volunteer-hours', { params }),
  getOpportunityPerformanceReport: async (params?: any) =>
    axios.get('/organization/reports/opportunity-performance', { params }),
  getVolunteerRetentionReport: async () => axios.get('/organization/reports/volunteer-retention'),

  // ==========================================
  // CALENDAR
  // ==========================================
  getOrganizationOpportunitiesCalendar: async (params?: { from?: string; to?: string; status?: string }) =>
    axios.get('/calendar/organization-opportunities', { params, responseType: 'blob' }),
};

export default organizationApi;
