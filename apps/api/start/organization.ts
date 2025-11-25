import Route from '@ioc:Adonis/Core/Route'

// Organization Panel Routes (extracted for clarity)
Route.group(() => {
  // Profile & Dashboard
  Route.get('/organization/profile', 'OrganizationsController.show').middleware(['auth']) // Assuming current user's org
  Route.put('/organization/profile', 'OrganizationsController.update').middleware(['auth'])
  Route.get('/organization/dashboard-stats', 'OrganizationsController.dashboardStats').middleware([
    'auth'
  ])

  // Team
  Route.get('/organization/team', 'OrganizationsController.team').middleware(['auth'])
  Route.post('/organization/team/invite', 'OrganizationsController.inviteMember').middleware([
    'auth'
  ])
  Route.put('/organization/team/:memberId', 'OrganizationsController.updateMember').middleware([
    'auth'
  ])
  Route.delete('/organization/team/:memberId', 'OrganizationsController.removeMember').middleware([
    'auth'
  ])

  // Events (Scoped to Org)
  Route.get('/organization/events', 'EventsController.index').middleware(['auth']) // Should filter by org in controller or via query param
  Route.post('/organization/events', 'EventsController.store').middleware(['auth'])
  Route.put('/organization/events/:id', 'EventsController.update').middleware(['auth'])
  Route.delete('/organization/events/:id', 'EventsController.destroy').middleware(['auth'])

  // Volunteers
  Route.get('/organization/volunteers', 'OrganizationVolunteersController.index').middleware([
    'auth'
  ])
  Route.post('/organization/volunteers', 'OrganizationVolunteersController.store').middleware([
    'auth'
  ])
  Route.put('/organization/volunteers/:id', 'OrganizationVolunteersController.update').middleware([
    'auth'
  ])
  Route.delete(
    '/organization/volunteers/:id',
    'OrganizationVolunteersController.destroy'
  ).middleware(['auth'])

  // Compliance
  Route.get('/organization/documents', 'OrganizationComplianceController.index').middleware([
    'auth'
  ])
  Route.post('/organization/documents', 'OrganizationComplianceController.store').middleware([
    'auth'
  ])
  Route.delete(
    '/organization/documents/:id',
    'OrganizationComplianceController.destroy'
  ).middleware(['auth'])
  Route.get('/organization/compliance/stats', 'OrganizationComplianceController.stats').middleware([
    'auth'
  ])

  // Hours Management
  Route.get('/organization/hours/pending', 'VolunteerHoursManagementController.pending').middleware(['auth'])
  Route.post('/organization/hours/:id/approve', 'VolunteerHoursManagementController.approve').middleware(['auth'])
  Route.post('/organization/hours/:id/reject', 'VolunteerHoursManagementController.reject').middleware(['auth'])
  Route.post('/organization/hours/bulk-approve', 'VolunteerHoursManagementController.bulkApprove').middleware(['auth'])
  Route.get('/organization/volunteers/:id/hours', 'VolunteerHoursManagementController.volunteerHours').middleware(['auth'])

  // Analytics
  Route.get('/organization/analytics/volunteers', 'VolunteerAnalyticsController.volunteers').middleware(['auth'])
  Route.get('/organization/analytics/leaderboard', 'VolunteerAnalyticsController.leaderboard').middleware(['auth'])
  Route.get('/organization/analytics/trends', 'VolunteerAnalyticsController.trends').middleware(['auth'])

  // Communications
  Route.get('/organization/communications', 'OrganizationCommunicationsController.index').middleware(['auth'])
  Route.post('/organization/communications/send', 'OrganizationCommunicationsController.send').middleware(['auth'])
  Route.get('/organization/communications/:id', 'OrganizationCommunicationsController.show').middleware(['auth'])
  Route.post('/organization/communications/broadcast', 'OrganizationCommunicationsController.broadcast').middleware(['auth'])
}).prefix('')

export {}
