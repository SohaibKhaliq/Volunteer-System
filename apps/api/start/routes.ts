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
  .middleware({ '*': ['auth'] })
  .apiOnly()

Route.resource('roles', 'RolesController')
  .middleware({ '*': ['auth'] })
  .apiOnly()

Route.resource('events', 'EventsController')
  .middleware({ '*': ['auth'] })
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
Route.post('/compliance/remind/:userId', 'ComplianceController.remind').middleware(['auth'])

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

// scheduled jobs (admin)
Route.get('/scheduled-jobs', 'ScheduledJobsController.index').middleware(['auth'])
Route.get('/scheduled-jobs/:id', 'ScheduledJobsController.show').middleware(['auth'])
Route.post('/scheduled-jobs', 'ScheduledJobsController.store').middleware(['auth'])
Route.post('/scheduled-jobs/:id/retry', 'ScheduledJobsController.retry').middleware(['auth'])

// Organization routes are defined in start/organization.ts
