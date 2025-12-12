/**
 * Volunteer Panel API Client
 * Authenticated endpoints for volunteer panel
 */

import { axios } from '../axios';

export const volunteerApi = {
  // ==========================================
  // DASHBOARD & PROFILE
  // ==========================================
  getDashboard: async () => axios.get('/volunteer/dashboard'),
  getProfile: async () => axios.get('/volunteer/profile'),
  updateProfile: async (data: any) => axios.put('/volunteer/profile', data),

  // ==========================================
  // OPPORTUNITIES
  // ==========================================
  browseOpportunities: async (params?: any) => axios.get('/volunteer/opportunities', { params }),
  getOpportunityDetail: async (id: number) => axios.get(`/volunteer/opportunities/${id}`),
  bookmarkOpportunity: async (id: number) => axios.post(`/volunteer/opportunities/${id}/bookmark`),
  unbookmarkOpportunity: async (id: number) => axios.delete(`/volunteer/opportunities/${id}/bookmark`),
  getBookmarkedOpportunities: async () => axios.get('/volunteer/bookmarks'),

  // ==========================================
  // APPLICATIONS
  // ==========================================
  getMyApplications: async (params?: any) => axios.get('/volunteer/applications', { params }),
  applyToOpportunity: async (opportunityId: number, notes?: string) =>
    axios.post(`/opportunities/${opportunityId}/apply`, { notes }),
  withdrawApplication: async (id: number) => axios.delete(`/applications/${id}`),

  // ==========================================
  // ATTENDANCE & CHECK-IN/OUT
  // ==========================================
  getMyAttendance: async (params?: any) => axios.get('/volunteer/attendance', { params }),
  checkInToOpportunity: async (
    opportunityId: number,
    options?: {
      method?: string;
      metadata?: any;
      latitude?: number;
      longitude?: number;
      accuracy?: number;
      exceptionReason?: string;
    }
  ) => axios.post(`/opportunities/${opportunityId}/checkin`, options || {}),
  checkOutFromOpportunity: async (opportunityId: number) => 
    axios.post(`/opportunities/${opportunityId}/checkout`),
  qrCheckIn: async (code: string) => axios.post('/checkin/qr', { code }),

  // ==========================================
  // VOLUNTEER HOURS
  // ==========================================
  getMyHours: async (params?: any) => axios.get('/volunteer/hours', { params }),

  // ==========================================
  // ORGANIZATIONS
  // ==========================================
  getMyOrganizations: async () => axios.get('/volunteer/organizations'),
  joinOrganization: async (id: number) => axios.post(`/volunteer/organizations/${id}/join`),
  leaveOrganization: async (id: number) => axios.delete(`/volunteer/organizations/${id}/leave`),

  // ==========================================
  // ACHIEVEMENTS
  // ==========================================
  getMyAchievements: async () => axios.get('/volunteer/achievements'),

  // ==========================================
  // CALENDAR
  // ==========================================
  getMyScheduleCalendar: async (params?: { from?: string; to?: string }) =>
    axios.get('/calendar/my-schedule', { params, responseType: 'blob' }),
  getCalendarSubscriptionUrls: async () => axios.get('/calendar/subscription-urls'),
};

export default volunteerApi;
