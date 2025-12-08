/**
 * Public API Client
 * No authentication required
 */

import { axios } from '../axios';

export const publicApi = {
  // Health check
  getHealth: async () => axios.get('/health'),

  // Contact
  contact: async (data: any) => axios.post('/contact', data),

  // Help requests & offers (public posting)
  createHelpRequest: async (data: FormData) => axios.post('/help-requests', data),
  createHelpOffer: async (data: FormData) => axios.post('/offers', data),
  createCarpooling: async (data: FormData) => axios.post('/carpooling-ads', data),

  // Public organizations
  getPublicOrganizations: async (params?: any) => axios.get('/public/organizations', { params }),
  getPublicOrganization: async (slug: string) => axios.get(`/public/organizations/${slug}`),
  getPublicOrganizationOpportunities: async (slug: string, params?: any) =>
    axios.get(`/public/organizations/${slug}/opportunities`, { params }),
  getPublicOrganizationOpportunity: async (slug: string, opportunityId: number) =>
    axios.get(`/public/organizations/${slug}/opportunities/${opportunityId}`),
  getPublicOrganizationCities: async () => axios.get('/public/organizations/cities'),
  getPublicOrganizationCountries: async () => axios.get('/public/organizations/countries'),
  getPublicOrganizationTypes: async () => axios.get('/public/organizations/types'),

  // Public events
  getEvent: async (id: number) => {
    const res = await axios.get(`/events/${id}`);
    return (res && (res.data ?? res)) || res;
  },

  // Public opportunity detail (for volunteers to see before applying)
  getOpportunity: async (id: number) => axios.get(`/opportunities/${id}`),

  // AI helpers (public)
  aiMatch: async (task_id: number) => axios.post('/ai/match', { task_id }),
  aiForecast: async (start: string, end: string) => axios.post('/ai/forecast', { start, end }),

  // Survey submission (public - no auth required)
  submitSurveyResponse: async (id: number, data: any) => axios.post(`/surveys/${id}/submit`, data),

  // Calendar feeds (public)
  getPublicOpportunitiesCalendar: async (params?: { organizationSlug?: string; from?: string; to?: string }) =>
    axios.get('/calendar/public-opportunities', { params, responseType: 'blob' }),

  // Invite rejection (token-based, no auth)
  rejectInvite: async (token: string) => axios.post(`/invites/${token}/reject`),

  // Organizations list (for public viewing)
  listOrganizations: async (params?: Record<string, unknown>) => axios.get('/organizations', { params }),
  
  // Events list (public)
  listEvents: async (params?: any) => axios.get('/events', { params }),

  // Types (public)
  listTypes: async () => axios.get('/types'),
};

export default publicApi;
