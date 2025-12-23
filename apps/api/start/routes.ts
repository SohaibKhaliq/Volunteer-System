/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| This file is dedicated for defining HTTP routes. A single file is enough
| for majority of projects, however you can define routes in different
| files and just make sure to import them inside this file. For example
|
| Define routes in following two files
| ├── start/routes/cart.ts
| ├── start/routes/customer.ts
|
| and then import them inside `start/routes.ts` as follows
|
| import './routes/cart'
| import './routes/customer'
|
*/

import HealthCheck from '@ioc:Adonis/Core/HealthCheck'
import Route from '@ioc:Adonis/Core/Route'
import './organization'

Route.get('/', async () => {
  return { hello: 'world' }
})

Route.post('/contact', 'ContactController.store')

Route.get('/health', async ({ response }) => {
  const report = await HealthCheck.getReport()
  return report.healthy ? response.ok(report) : response.badRequest(report)
})

// Skills search (public)
Route.get('/skills', 'SkillsController.search')

Route.resource('offers', 'OffersController')
  .middleware({
    // store: ['auth:api'],
    // destroy: ['auth:api'],
    // update: ['auth:api']
  })
  .apiOnly()

Route.resource('carpooling-ads', 'CarpoolingAdsController')
  .middleware({
    // store: ['auth:api'],
    // destroy: ['auth:api'],
    // update: ['auth:api']
  })
  .apiOnly()

Route.resource('help-requests', 'HelpRequestsController')
  .middleware({
    // store: ['auth:api'],
    // destroy: ['auth:api'],
    // update: ['auth:api']
  })
  .apiOnly()

Route.resource('types', 'TypesController')
  .middleware({
    // store: ['auth:api'],
    // destroy: ['auth:api'],
    // update: ['auth:api']
  })
  .apiOnly()

// Register analytics before resource routes so static path doesn't get
// shadowed by the `GET /users/:id` parameter route.
Route.get('/users/analytics', 'UsersController.analytics').middleware(['auth'])

Route.resource('users', 'UsersController')
  .middleware({
    '*': ['auth']
  })
  .apiOnly()

Route.resource('organizations', 'OrganizationsController')
  .middleware({
    store: ['auth', 'admin'],
    update: ['auth', 'admin'],
    destroy: ['auth', 'admin']
  })
  .apiOnly()
// Admin: list resources for a given organization
Route.get('/organizations/:id/resources', 'OrganizationsController.getResources').middleware([
  'auth'
])

// Organization volunteer management
Route.get('/organizations/:id/volunteers', 'OrganizationsController.getVolunteers').middleware([
  'auth'
])
Route.post('/organizations/:id/volunteers', 'OrganizationsController.addVolunteer').middleware([
  'auth'
])
Route.put(
  '/organizations/:id/volunteers/:userId',
  'OrganizationsController.updateVolunteer'
).middleware(['auth'])
Route.delete(
  '/organizations/:id/volunteers/:userId',
  'OrganizationsController.removeVolunteer'
).middleware(['auth'])

// Organization events & tasks
Route.get('/organizations/:id/events', 'OrganizationsController.getEvents').middleware(['auth'])
Route.get('/organizations/:id/tasks', 'OrganizationsController.getTasks').middleware(['auth'])

// Organization hours
Route.get('/organizations/:id/hours', 'OrganizationsController.getHours').middleware(['auth'])
Route.post('/organizations/:id/hours/approve', 'OrganizationsController.approveHours').middleware([
  'auth'
])

// Organization analytics & compliance
Route.get('/organizations/:id/analytics', 'OrganizationsController.getAnalytics').middleware([
  'auth'
])
Route.get('/organizations/:id/compliance', 'OrganizationsController.getCompliance').middleware([
  'auth'
])

// Organization invitations
Route.get(
  '/organizations/:organizationId/invites',
  'OrganizationInvitesController.index'
).middleware(['auth'])
Route.post(
  '/organizations/:organizationId/invites',
  'OrganizationInvitesController.store'
).middleware(['auth'])
Route.post(
  '/organizations/:organizationId/invites/:id/resend',
  'OrganizationInvitesController.resend'
).middleware(['auth'])
Route.delete(
  '/organizations/:organizationId/invites/:id',
  'OrganizationInvitesController.destroy'
).middleware(['auth'])

// Public invitation endpoints (token-based, no auth required for accept/reject)
Route.post('/invites/:token/accept', 'OrganizationInvitesController.accept').middleware(['auth'])
Route.post('/invites/:token/reject', 'OrganizationInvitesController.reject')

Route.resource('roles', 'RolesController')
  .middleware({ '*': ['auth'] })
  .apiOnly()

Route.resource('events', 'EventsController')
  .middleware({
    store: ['auth'],
    update: ['auth'],
    destroy: ['auth']
  })
  .apiOnly()

Route.resource('tasks', 'TasksController')
  .middleware({ '*': ['auth'] })
  .apiOnly()

Route.resource('assignments', 'AssignmentsController')
  .middleware({ '*': ['auth'] })
  .apiOnly()

Route.resource('compliance', 'ComplianceController')
  .middleware({ '*': ['auth'] })
  .apiOnly()

// Serve uploaded compliance files
Route.get('/compliance/:id/file', 'ComplianceController.file').middleware(['auth'])

Route.resource('background-checks', 'BackgroundChecksController')
  .middleware({ '*': ['auth'] })
  .apiOnly()

// AI-driven helpers
Route.post('/ai/match', 'AiController.match') // returns suggested volunteers for a task
Route.post('/ai/forecast', 'AiController.forecast') // returns demand forecast for a date range

Route.post('/register', 'AuthController.register')
Route.post('/login', 'AuthController.login')
Route.post('/logout', 'AuthController.logout').middleware('auth:api')

Route.get('/me', 'UsersController.me').middleware(['auth'])

Route.resource('resources', 'ResourcesController')
  .middleware({ '*': ['auth'] })
  .apiOnly()
// Resource management extra endpoints
Route.get('/resources/dashboard', 'ResourcesController.dashboard').middleware(['auth'])
Route.get('/resources/low-stock', 'ResourcesController.lowStock').middleware(['auth'])
Route.get('/resources/maintenance', 'ResourcesController.maintenanceDue').middleware(['auth'])
Route.get('/resources/:id/assignments', 'ResourceAssignmentsController.index').middleware(['auth'])
Route.post('/resources/:id/assign', 'ResourceAssignmentsController.store').middleware(['auth'])
Route.post('/assignments/:id/return', 'ResourceAssignmentsController.markReturned').middleware([
  'auth'
])
Route.patch('/resources/:id/status', 'ResourcesController.patchStatus').middleware(['auth'])
// Admin: maintenance, retire, reactivate
Route.post('/resources/:id/maintenance', 'ResourcesController.maintenance').middleware(['auth'])
Route.post('/resources/:id/retire', 'ResourcesController.retire').middleware(['auth'])
Route.post('/resources/:id/reactivate', 'ResourcesController.reactivate').middleware(['auth'])
Route.resource('audit-logs', 'AuditLogsController')
  .middleware({ '*': ['auth'] })
  .only(['index', 'show'])
Route.resource('communications', 'CommunicationsController')
  .middleware({ '*': ['auth'] })
  .apiOnly()

// communication logs and retry
Route.get('/communications/:id/logs', 'CommunicationsController.logs').middleware(['auth'])
Route.post('/communications/logs/:id/retry', 'CommunicationsController.retryLog').middleware([
  'auth'
])
Route.post('/communications/logs/bulk-retry', 'CommunicationsController.bulkRetryLogs').middleware([
  'auth'
])

// Notifications (admin) - expose recent notifications for UI
Route.get('/notifications', 'NotificationsController.index').middleware(['auth'])
Route.put('/notifications/:id/read', 'NotificationsController.markRead').middleware(['auth'])
Route.put('/notifications/:id/unread', 'NotificationsController.markUnread').middleware(['auth'])
// NOTE: SSE streaming has been removed. The /notifications/stream route now returns 501
// and clients should use the Socket.IO-based realtime endpoint instead. The API
// also posts new notifications to the socket server internal endpoint `/_internal/notify`.
Route.get('/notifications/stream', 'NotificationsController.stream')

// Surveys (feedback)
Route.resource('surveys', 'SurveysController')
  .middleware({ '*': ['auth'] })
  .apiOnly()
Route.post('/surveys/:id/submit', 'SurveysController.submit')
Route.get('/surveys/:id/responses', 'SurveysController.responses').middleware(['auth'])
Route.get('/surveys/:id/responses/export', 'SurveysController.exportResponses').middleware(['auth'])

// Custom endpoints
Route.post('/users/:id/remind', 'UsersController.remind').middleware(['auth'])
Route.post('/users/bulk', 'UsersController.bulkUpdate').middleware(['auth'])
// (moved analytics route earlier to avoid route shadowing)

// Role management and activation endpoints
Route.post('/users/:id/roles', 'UsersController.addRole').middleware(['auth'])
Route.delete('/users/:id/roles/:roleId', 'UsersController.removeRole').middleware(['auth'])
Route.post('/users/:id/activate', 'UsersController.activate').middleware(['auth'])

Route.post('/events/:id/ai-match', 'EventsController.aiMatch').middleware(['auth'])
Route.post('/events/:id/join', 'EventsController.join').middleware(['auth'])

// Australian Compliance - WWCC validation
Route.post('/compliance/validate-wwcc', 'ComplianceController.validateWWCC').middleware(['auth'])
Route.post('/compliance/remind/:userId', 'ComplianceController.remind').middleware(['auth'])

// Centrelink reporting
Route.get('/centrelink/fortnight/:userId', 'CentrelinkController.getCurrentFortnight').middleware([
  'auth'
])
Route.get('/centrelink/su462/:userId', 'CentrelinkController.generateSU462').middleware(['auth'])
Route.get('/centrelink/su462/:userId/csv', 'CentrelinkController.exportSU462CSV').middleware([
  'auth'
])

// Document Library with Read & Acknowledge
Route.get('/documents', 'DocumentsController.index').middleware(['auth'])
Route.get('/documents/required', 'DocumentsController.required').middleware(['auth'])
Route.get('/documents/my-acknowledgments', 'DocumentsController.myAcknowledgments').middleware(['auth'])
Route.get('/documents/:id', 'DocumentsController.show').middleware(['auth'])
Route.post('/documents', 'DocumentsController.store').middleware(['auth'])
Route.put('/documents/:id', 'DocumentsController.update').middleware(['auth'])
Route.delete('/documents/:id', 'DocumentsController.destroy').middleware(['auth'])
Route.post('/documents/:id/acknowledge', 'DocumentsController.acknowledge').middleware(['auth'])
Route.get('/documents/:id/download', 'DocumentsController.download').middleware(['auth'])

// Analytics & Reports
Route.get('/reports', 'ReportsController.index').middleware(['auth'])
Route.get('/reports/volunteers', 'ReportsController.volunteerStats').middleware(['auth'])
Route.get('/reports/events', 'ReportsController.eventStats').middleware(['auth'])
Route.get('/reports/hours', 'ReportsController.hoursStats').middleware(['auth'])
Route.get('/reports/organizations', 'ReportsController.organizationStats').middleware(['auth'])
Route.get('/reports/compliance', 'ReportsController.complianceStats').middleware(['auth'])
Route.get('/reports/export', 'ReportsController.export').middleware(['auth'])

Route.get('/settings', 'SystemSettingsController.index').middleware(['auth'])
Route.post('/settings', 'SystemSettingsController.update').middleware(['auth'])

// Monitoring endpoints for admin dashboard
Route.get('/monitoring/stats', 'MonitoringController.stats').middleware(['auth'])
Route.get('/monitoring/recent', 'MonitoringController.recent').middleware(['auth'])

Route.get('/hours', 'VolunteerHoursController.index').middleware(['auth'])
Route.put('/hours/:id', 'VolunteerHoursController.update').middleware(['auth'])
Route.post('/hours/bulk', 'VolunteerHoursController.bulkUpdate').middleware(['auth'])

Route.resource('courses', 'CoursesController')
  .middleware({ '*': ['auth'] })
  .apiOnly()

// Achievements (admin-level / general)
Route.resource('achievements', 'AchievementsController')
  .middleware({ '*': ['auth'] })
  .apiOnly()

// Shift scheduling routes
Route.get('/shifts', 'ShiftsController.index').middleware(['auth'])
Route.post('/shifts', 'ShiftsController.store').middleware(['auth'])
Route.post('/shifts/recurring', 'ShiftsController.createRecurring').middleware(['auth'])
Route.get('/shifts/:id', 'ShiftsController.show').middleware(['auth'])
Route.get('/shifts/:id/suggestions', 'ShiftsController.suggest').middleware(['auth'])
Route.post('/shifts/:id/check-conflicts', 'ShiftsController.checkConflicts').middleware(['auth'])
Route.post('/shifts/:id/assign', 'ShiftsController.assignWithConflictCheck').middleware(['auth'])
Route.put('/shifts/:id', 'ShiftsController.update').middleware(['auth'])
Route.delete('/shifts/:id', 'ShiftsController.destroy').middleware(['auth'])

Route.get('/shift-assignments', 'ShiftAssignmentsController.index').middleware(['auth'])
Route.post('/shift-assignments', 'ShiftAssignmentsController.store').middleware(['auth'])
Route.post('/shift-assignments/bulk', 'ShiftAssignmentsController.bulk').middleware(['auth'])
Route.put('/shift-assignments/:id', 'ShiftAssignmentsController.update').middleware(['auth'])
Route.delete('/shift-assignments/:id', 'ShiftAssignmentsController.destroy').middleware(['auth'])

// scheduled jobs (admin)
Route.get('/scheduled-jobs', 'ScheduledJobsController.index').middleware(['auth'])
Route.get('/scheduled-jobs/:id', 'ScheduledJobsController.show').middleware(['auth'])
Route.post('/scheduled-jobs', 'ScheduledJobsController.store').middleware(['auth'])
Route.post('/scheduled-jobs/:id/retry', 'ScheduledJobsController.retry').middleware(['auth'])

// Organization routes are defined in start/organization.ts

// ==========================================
// ADMIN PANEL ROUTES (Platform Super Admin)
// ==========================================
Route.group(() => {
  // Dashboard
  Route.get('/dashboard', 'AdminController.dashboard')
  Route.get('/analytics', 'AdminController.systemAnalytics')
  Route.get('/summary', 'AdminController.summary')
  Route.get('/features', 'AdminController.features')
  Route.get('/activity', 'AdminController.recentActivity')
  Route.get('/pending-hours/organizations', 'AdminController.pendingHoursByOrganization')
  Route.get('/export', 'AdminController.exportSummary')

  // Organization Management
  Route.get('/organizations', 'AdminController.listOrganizations')
  Route.post('/organizations/:id/approve', 'AdminController.approveOrganization')
  Route.post('/organizations/:id/suspend', 'AdminController.suspendOrganization')
  Route.post('/organizations/:id/reactivate', 'AdminController.reactivateOrganization')
  Route.post('/organizations/:id/archive', 'AdminController.archiveOrganization')

  // User Management
  Route.get('/users', 'AdminController.listUsers')
  Route.post('/users/:id/disable', 'AdminController.disableUser')
  Route.post('/users/:id/enable', 'AdminController.enableUser')

  // Notification Templates
  Route.get('/templates', 'NotificationTemplatesController.index')
  Route.post('/templates', 'NotificationTemplatesController.store')
  Route.get('/templates/:key', 'NotificationTemplatesController.show')
  Route.put('/templates/:key', 'NotificationTemplatesController.update')
  Route.post('/templates/:key/reset', 'NotificationTemplatesController.reset')
  Route.delete('/templates/:key', 'NotificationTemplatesController.destroy')
  Route.post('/templates/preview', 'NotificationTemplatesController.preview')

  // System Settings (extended)
  Route.get('/system-settings', 'AdminController.getSystemSettings')
  Route.put('/system-settings', 'AdminController.updateSystemSettings')
  Route.post('/system-settings/branding', 'AdminController.updateBranding')
  // Admin-level invite actions (accept on behalf of users)
  Route.post(
    '/organizations/:organizationId/invites/:id/accept',
    'OrganizationInvitesController.adminAccept'
  )
  // Admin: invite send jobs monitor & retry
  Route.get('/invite-send-jobs', 'InviteSendJobsController.index')
  // place static routes before parameterized routes so 'stats' and 'retry-failed'
  // are not treated as an :id param by the router (which caused 404s)
  Route.get('/invite-send-jobs/stats', 'InviteSendJobsController.stats')
  Route.post('/invite-send-jobs/retry-failed', 'InviteSendJobsController.retryAllFailed')
  Route.get('/invite-send-jobs/:id', 'InviteSendJobsController.show')
  Route.post('/invite-send-jobs/:id/retry', 'InviteSendJobsController.retry')
  Route.get('/backup', 'AdminController.createBackup')
  Route.get('/backup/status', 'AdminController.backupStatus')
})
  .prefix('/admin')
  .middleware(['auth'])

// ==========================================
// VOLUNTEER PANEL ROUTES (End-user Portal)
// ==========================================
Route.group(() => {
  // Dashboard & Profile
  Route.get('/dashboard', 'VolunteerController.dashboard')
  Route.get('/profile', 'VolunteerController.profile')
  Route.put('/profile', 'VolunteerController.updateProfile')

  // Opportunities
  Route.get('/opportunities', 'VolunteerController.browseOpportunities')
  Route.get('/opportunities/:id', 'VolunteerController.opportunityDetail')
  Route.post('/opportunities/:id/bookmark', 'VolunteerController.bookmarkOpportunity')
  Route.delete('/opportunities/:id/bookmark', 'VolunteerController.unbookmarkOpportunity')
  Route.get('/bookmarks', 'VolunteerController.bookmarkedOpportunities')

  // Applications
  Route.get('/applications', 'VolunteerController.myApplications')

  // Attendance & Hours
  Route.get('/attendance', 'VolunteerController.myAttendance')
  Route.get('/hours', 'VolunteerController.myHours')

  // Organizations
  Route.get('/organizations', 'VolunteerController.myOrganizations')
  Route.post('/organizations/:id/join', 'VolunteerController.joinOrganization')
  Route.delete('/organizations/:id/leave', 'VolunteerController.leaveOrganization')

  // Achievements
  Route.get('/achievements', 'VolunteerController.myAchievements')
})
  .prefix('/volunteer')
  .middleware(['auth'])

// ==========================================
// CALENDAR / ICAL ROUTES
// ==========================================
Route.group(() => {
  // Public calendar feeds (no auth required)
  Route.get('/public-opportunities', 'CalendarController.publicOpportunities')
}).prefix('/calendar')

Route.group(() => {
  // Authenticated calendar feeds
  Route.get('/my-schedule', 'CalendarController.mySchedule')
  Route.get('/organization-opportunities', 'CalendarController.organizationOpportunities')
  Route.get('/events', 'CalendarController.events')
  Route.get('/subscription-urls', 'CalendarController.getSubscriptionUrl')
})
  .prefix('/calendar')
  .middleware(['auth'])
