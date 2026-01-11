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

Route.get('/health', async ({ response }) => {
  const report = await HealthCheck.getReport()
  return report.healthy ? response.ok(report) : response.badRequest(report)
})

// Skills search (public)
Route.get('/skills', 'SkillsController.search')

// Home stats (public)
Route.get('/home/stats', 'HomeController.stats')

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

Route.post('/help-requests/:id/assign', 'HelpRequestsController.assign').middleware(['auth'])

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

// Detailed Membership Management (Admin)
Route.get('/organizations/:id/members', 'MembershipController.index').middleware(['auth'])
Route.put('/organizations/:id/members/:memberId', 'MembershipController.updateStatus').middleware([
  'auth'
])
Route.delete('/organizations/:id/members/:memberId', 'MembershipController.remove').middleware([
  'auth'
])

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

// Permissions and feature flags management (admin only)
Route.resource('permissions', 'PermissionsController')
  .middleware({ '*': ['auth', 'admin'] })
  .apiOnly()

Route.resource('feature-flags', 'FeatureFlagsController')
  .middleware({ '*': ['auth', 'admin'] })
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

Route.get('/compliance/types', 'ComplianceController.getTypes').middleware(['auth'])
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

// =====================================================================
// Authentication & User Lifecycle Routes
// =====================================================================

// Public Authentication Routes
Route.post('/register', 'AuthController.register')
Route.post('/login', 'AuthController.login')

// Contact Form (Public)
Route.post('/contact', 'ContactController.store')

// Protected Authentication Routes
Route.group(() => {
  Route.post('/logout', 'AuthController.logout')
  Route.get('/me', 'AuthController.me')
  Route.post('/refresh', 'AuthController.refresh')
}).middleware('auth:api')

// User Preferences Routes
Route.group(() => {
  Route.get('/preferences', 'UserPreferencesController.show')
  Route.put('/preferences', 'UserPreferencesController.update')
  Route.post('/preferences/reset', 'UserPreferencesController.reset')
  Route.patch('/preferences/:category', 'UserPreferencesController.updateCategory')
}).middleware('auth:api')

// Contact Management Routes (Admin only)
Route.group(() => {
  Route.get('/contact', 'ContactController.index')
  Route.get('/contact/:id', 'ContactController.show')
  Route.patch('/contact/:id', 'ContactController.update')
  Route.delete('/contact/:id', 'ContactController.destroy')
}).middleware(['auth', 'admin'])

// =====================================================================
// End Authentication & User Lifecycle Routes
// =====================================================================

// Hierarchical Resource Workflow
Route.group(() => {
  Route.post('/resources/provision', 'ResourceAllocationController.provision')
  Route.post('/resources/distribute', 'ResourceAllocationController.distribute')
  Route.post('/resources/return-request', 'ResourceAllocationController.requestReturn')
  Route.post('/resources/reconcile', 'ResourceAllocationController.reconcile')
  Route.get('/resources/:id/history', 'ResourceAllocationController.history')
}).middleware(['auth'])

// Resource management extra endpoints (must be before resource definition)
Route.get('/resources/dashboard', 'ResourcesController.dashboard').middleware(['auth'])
Route.get('/resources/low-stock', 'ResourcesController.lowStock').middleware(['auth'])
Route.get('/resources/maintenance', 'ResourcesController.maintenanceDue').middleware(['auth'])

Route.resource('resources', 'ResourcesController')
  .middleware({ '*': ['auth'] })
  .apiOnly()
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

// Import routes
Route.group(() => {
  Route.post('/volunteers', 'ImportController.importVolunteers')
  Route.post('/opportunities', 'ImportController.importOpportunities')
  Route.post('/queue', 'ImportController.queueImport')
  Route.get('/:id/status', 'ImportController.getStatus')
  Route.get('/templates/volunteers', 'ImportController.volunteersTemplate')
  Route.get('/templates/opportunities', 'ImportController.opportunitiesTemplate')

  // Generic Import Routes
  Route.get('/template', 'ImportsController.getTemplate')
  Route.post('/process', 'ImportsController.processImport')
})
  .prefix('/imports')
  .middleware(['auth'])

// Export routes
Route.group(() => {
  Route.get('/volunteers', 'ExportController.exportVolunteers')
  Route.get('/opportunities', 'ExportController.exportOpportunities')
  Route.get('/applications', 'ExportController.exportApplications')
  Route.get('/attendances', 'ExportController.exportAttendances')
  Route.get('/hours', 'ExportController.exportHours')
  Route.post('/queue', 'ExportController.queueExport')
  Route.get('/:id/status', 'ExportController.getExportStatus')
  Route.get('/:id/download', 'ExportController.downloadExport')

  // Generic Export Route
  Route.get('/download', 'ExportsController.download')
})
  .prefix('/exports')
  .middleware(['auth'])


// Chat Routes
Route.group(() => {
  Route.get('/', 'ChatController.index')
  Route.get('/:id', 'ChatController.show')
  Route.post('/', 'ChatController.store')
  Route.post('/start', 'ChatController.start')
}).prefix('/chat').middleware(['auth'])

// Backup Routes
Route.group(() => {
  Route.get('/database', 'BackupController.downloadDatabase')
  Route.get('/media', 'BackupController.downloadMedia')
})
  .prefix('/admin/backup')
  .middleware(['auth'])

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

// Notifications - expose recent notifications for UI
Route.get('/notifications', 'NotificationsController.index').middleware(['auth'])
Route.get('/notifications/unread-count', 'NotificationsController.unreadCount').middleware(['auth'])
Route.post('/notifications/mark-all-read', 'NotificationsController.markAllRead').middleware([
  'auth'
])
Route.post('/notifications/bulk-mark-read', 'NotificationsController.bulkMarkRead').middleware([
  'auth'
])
Route.put('/notifications/:id/read', 'NotificationsController.markRead').middleware(['auth'])
Route.put('/notifications/:id/unread', 'NotificationsController.markUnread').middleware(['auth'])
Route.delete('/notifications/:id', 'NotificationsController.destroy').middleware(['auth'])
// NOTE: SSE streaming has been removed. The /notifications/stream route now returns 501
// and clients should use the Socket.IO-based realtime endpoint instead. The API
// also posts new notifications to the socket server internal endpoint `/_internal/notify`.
Route.get('/notifications/stream', 'NotificationsController.stream')

// Notification Preferences
Route.get('/notification-preferences', 'NotificationPreferencesController.index').middleware([
  'auth'
])
Route.put('/notification-preferences', 'NotificationPreferencesController.update').middleware([
  'auth'
])
Route.post('/notification-preferences/reset', 'NotificationPreferencesController.reset').middleware(
  ['auth']
)

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
Route.get('/documents/my-acknowledgments', 'DocumentsController.myAcknowledgments').middleware([
  'auth'
])
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
Route.post('/hours', 'VolunteerHoursController.store').middleware(['auth'])
Route.get('/hours/:id', 'VolunteerHoursController.show').middleware(['auth'])
Route.put('/hours/:id', 'VolunteerHoursController.update').middleware(['auth'])
Route.post('/hours/bulk-status', 'VolunteerHoursController.bulkUpdateStatus').middleware(['auth'])

Route.resource('courses', 'CoursesController')
  .middleware({ '*': ['auth'] })
  .apiOnly()

// Achievements (admin-level / general)
Route.resource('achievements', 'AchievementsController')
  .middleware({ '*': ['auth'] })
  .apiOnly()

// Achievement Categories
Route.resource('achievement-categories', 'AchievementCategoriesController')
  .middleware({ '*': ['auth'] })
  .apiOnly()

// Achievement management endpoints
Route.post('/achievements/grant', 'AchievementsController.grantAchievement').middleware(['auth'])
Route.delete('/achievements/revoke/:id', 'AchievementsController.revokeAchievement').middleware([
  'auth'
])
Route.get('/achievements/progress', 'AchievementsController.getProgress').middleware(['auth'])
Route.post('/achievements/evaluate', 'AchievementsController.triggerEvaluation').middleware([
  'auth'
])

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

  // Broadcast Management
  Route.get('/broadcasts', 'BroadcastsController.index')
  Route.post('/broadcasts', 'BroadcastsController.store')
  Route.get('/broadcasts/:id', 'BroadcastsController.show')
  Route.put('/broadcasts/:id', 'BroadcastsController.update')
  Route.post('/broadcasts/:id/send', 'BroadcastsController.send')
  Route.post('/broadcasts/:id/schedule', 'BroadcastsController.schedule')
  Route.post('/broadcasts/:id/cancel', 'BroadcastsController.cancel')
  Route.get('/broadcasts/:id/stats', 'BroadcastsController.stats')

  // Engagement Campaigns (Re-engagement)
  Route.get('/engagement-campaigns/stats', 'EngagementCampaignsController.stats')
  Route.get('/engagement-campaigns', 'EngagementCampaignsController.index')
  Route.get('/engagement-campaigns/:id', 'EngagementCampaignsController.show')
  Route.post('/engagement-campaigns/:id/mark-sent', 'EngagementCampaignsController.markSent')
  Route.delete('/engagement-campaigns/:id', 'EngagementCampaignsController.destroy')

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

  // Enhanced Analytics
  Route.get('/platform-analytics', 'AdminController.platformAnalytics')
  Route.get('/user-growth', 'AdminController.userGrowthChart')
  Route.get('/org-growth', 'AdminController.organizationGrowthChart')
  Route.get('/hours-trend', 'AdminController.hoursTrendChart')
  Route.get('/compliance-overview', 'AdminController.complianceOverview')
  Route.get('/top-organizations', 'AdminController.topOrganizations')

  // Enhanced Audit Logs
  Route.get('/audit-logs/search', 'AuditLogsController.search')
  Route.get('/audit-logs/export', 'AuditLogsController.export')
  Route.get('/audit-logs/statistics', 'AuditLogsController.statistics')
  Route.get('/audit-logs/security-events', 'AuditLogsController.securityEvents')
  Route.get('/audit-logs/action-types', 'AuditLogsController.actionTypes')
  Route.get('/audit-logs/target-types', 'AuditLogsController.targetTypes')

  // System Monitoring
  Route.get(
    '/monitoring/background-jobs',
    'SystemMonitoringController.backgroundJobsStatus'
  ).middleware(['permission:monitoring.view'])
  Route.get('/monitoring/imports', 'SystemMonitoringController.importOperations').middleware([
    'permission:monitoring.view'
  ])
  Route.get(
    '/monitoring/notifications',
    'SystemMonitoringController.notificationDelivery'
  ).middleware(['permission:monitoring.view'])
  Route.get('/monitoring/errors', 'SystemMonitoringController.errorLogs').middleware([
    'permission:monitoring.view'
  ])
  Route.get('/monitoring/health', 'SystemMonitoringController.systemHealth').middleware([
    'permission:monitoring.view'
  ])

  Route.get('/backup', 'AdminController.createBackup')
  Route.get('/backup/status', 'AdminController.backupStatus')
  Route.get('/backup/:id/download', 'AdminController.downloadBackup')

  // Contact Submissions
  Route.get('/contact-submissions', 'ContactController.index')
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
  Route.put('/profile/avatar', 'VolunteerController.updateAvatar')

  // Opportunities
  Route.get('/opportunities', 'VolunteerController.browseOpportunities')
  Route.get('/opportunities/:id', 'VolunteerController.opportunityDetail')
  Route.post('/opportunities/:id/apply', 'VolunteerController.apply')
  Route.post('/opportunities/:id/withdraw', 'VolunteerController.withdraw')
  Route.post('/opportunities/:id/bookmark', 'VolunteerController.bookmarkOpportunity')
  Route.delete('/opportunities/:id/bookmark', 'VolunteerController.unbookmarkOpportunity')
  Route.get('/bookmarks', 'VolunteerController.bookmarkedOpportunities')

  // Applications
  Route.get('/applications', 'VolunteerController.myApplications')

  // Attendance & Hours
  Route.get('/attendance', 'VolunteerController.myAttendance')
  Route.post('/attendance/checkin', 'ShiftAssignmentsController.checkIn')
  Route.post('/attendance/checkout', 'ShiftAssignmentsController.checkOut')
  Route.get('/hours', 'VolunteerController.myHours')

  // Organizations
  Route.get('/organizations/browse', 'VolunteerController.browseOrganizations')
  Route.get('/organizations', 'VolunteerController.myOrganizations')

  // Membership management (Volunteer)
  Route.post('/organizations/:id/join', 'MembershipController.join').middleware(['auth']) // Protected
  Route.delete('/organizations/:id/leave', 'MembershipController.leave').middleware(['auth']) // Protected

  // Achievements
  Route.get('/achievements', 'VolunteerController.myAchievements').middleware(['auth']) // Protected
})
  .prefix('/volunteer')
  .middleware(['auth'])

// ==========================================
// CALENDAR / ICAL ROUTES

// Admin: Certificate Templates
Route.group(() => {
  Route.resource('certificate-templates', 'CertificateTemplatesController').apiOnly()
}).prefix('/admin').middleware(['auth', 'admin'])

// Public Verification
Route.get('/verify/:uuid', 'CertificatesController.verify')

// Volunteer: Training & Certificates
Route.group(() => {
    Route.get('/training', 'TrainingProgressesController.index')
    Route.get('/training/:moduleId', 'TrainingProgressesController.show')
    Route.post('/training/:moduleId/start', 'TrainingProgressesController.start')
    Route.post('/training/:moduleId/complete', 'TrainingProgressesController.complete')

    Route.get('/certificates', 'CertificatesController.myCertificates')
    Route.get('/certificates/:id/download', 'CertificatesController.download')
}).prefix('/volunteer').middleware(['auth'])

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


