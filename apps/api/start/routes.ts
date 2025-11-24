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

Route.resource('resources', 'ResourcesController').middleware({ '*': ['auth'] }).apiOnly()
Route.resource('audit-logs', 'AuditLogsController').middleware({ '*': ['auth'] }).only(['index', 'show'])
Route.resource('surveys', 'SurveysController').middleware({ '*': ['auth'] }).apiOnly()
Route.resource('communications', 'CommunicationsController').middleware({ '*': ['auth'] }).apiOnly()

// Notifications (admin) - expose recent notifications for UI
Route.get('/notifications', 'NotificationsController.index').middleware(['auth'])
Route.put('/notifications/:id/read', 'NotificationsController.markRead').middleware(['auth'])

// Custom endpoints
Route.post('/users/:id/remind', 'UsersController.remind').middleware(['auth'])
Route.post('/users/bulk', 'UsersController.bulkUpdate').middleware(['auth'])
Route.get('/users/analytics', 'UsersController.analytics').middleware(['auth'])

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

Route.get('/hours', 'VolunteerHoursController.index').middleware(['auth'])
Route.put('/hours/:id', 'VolunteerHoursController.update').middleware(['auth'])
Route.post('/hours/bulk', 'VolunteerHoursController.bulkUpdate').middleware(['auth'])

Route.resource('courses', 'CoursesController').middleware({ '*': ['auth'] }).apiOnly()

// Organization Panel Routes
Route.group(() => {
  // Profile & Dashboard
  Route.get('/organization/profile', 'OrganizationsController.show').middleware(['auth']) // Assuming current user's org
  Route.put('/organization/profile', 'OrganizationsController.update').middleware(['auth'])
  Route.get('/organization/dashboard-stats', 'OrganizationsController.dashboardStats').middleware(['auth'])

  // Team
  Route.get('/organization/team', 'OrganizationsController.team').middleware(['auth'])
  Route.post('/organization/team/invite', 'OrganizationsController.inviteMember').middleware(['auth'])
  Route.delete('/organization/team/:memberId', 'OrganizationsController.removeMember').middleware(['auth'])

  // Events (Scoped to Org)
  Route.get('/organization/events', 'EventsController.index').middleware(['auth']) // Should filter by org in controller or via query param
  Route.post('/organization/events', 'EventsController.store').middleware(['auth'])
  Route.put('/organization/events/:id', 'EventsController.update').middleware(['auth'])
  Route.delete('/organization/events/:id', 'EventsController.destroy').middleware(['auth'])

  // Volunteers
  Route.get('/organization/volunteers', 'OrganizationVolunteersController.index').middleware(['auth'])
  Route.post('/organization/volunteers', 'OrganizationVolunteersController.store').middleware(['auth'])
  Route.put('/organization/volunteers/:id', 'OrganizationVolunteersController.update').middleware(['auth'])
  Route.delete('/organization/volunteers/:id', 'OrganizationVolunteersController.destroy').middleware(['auth'])

  // Compliance
  Route.get('/organization/documents', 'OrganizationComplianceController.index').middleware(['auth'])
  Route.post('/organization/documents', 'OrganizationComplianceController.store').middleware(['auth'])
  Route.delete('/organization/documents/:id', 'OrganizationComplianceController.destroy').middleware(['auth'])
  Route.get('/organization/compliance/stats', 'OrganizationComplianceController.stats').middleware(['auth'])
}).prefix('api')
