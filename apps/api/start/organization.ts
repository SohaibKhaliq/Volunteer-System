import Route from '@ioc:Adonis/Core/Route'

// Organization Panel Routes (extracted for clarity)
Route.group(() => {
  // Profile & Dashboard
  // All paths are now relative to the group prefix '/organization'
  Route.get('/profile', 'OrganizationsController.show').middleware(['auth'])
  Route.put('/profile', 'OrganizationsController.update').middleware(['auth'])
  Route.get('/dashboard-stats', 'OrganizationsController.dashboardStats').middleware(['auth'])

  // Team
  Route.get('/team', 'OrganizationsController.team').middleware(['auth'])
  Route.post('/team/invite', 'OrganizationsController.inviteMember').middleware(['auth'])
  Route.put('/team/:memberId', 'OrganizationsController.updateMember').middleware(['auth'])
  Route.delete('/team/:memberId', 'OrganizationsController.removeMember').middleware(['auth'])

  // Events (Scoped to Org)
  Route.get('/events', 'EventsController.index').middleware(['auth'])
  Route.post('/events', 'EventsController.store').middleware(['auth'])
  Route.put('/events/:id', 'EventsController.update').middleware(['auth'])
  Route.delete('/events/:id', 'EventsController.destroy').middleware(['auth'])

  // Volunteers
  Route.get('/volunteers', 'OrganizationVolunteersController.index').middleware(['auth'])
  Route.post('/volunteers', 'OrganizationVolunteersController.store').middleware(['auth'])
  Route.put('/volunteers/:id', 'OrganizationVolunteersController.update').middleware(['auth'])
  Route.delete('/volunteers/:id', 'OrganizationVolunteersController.destroy').middleware(['auth'])

  // Compliance
  Route.get('/documents', 'OrganizationComplianceController.index').middleware(['auth'])
  Route.post('/documents', 'OrganizationComplianceController.store').middleware(['auth'])
  Route.delete('/documents/:id', 'OrganizationComplianceController.destroy').middleware(['auth'])
  Route.get('/compliance/stats', 'OrganizationComplianceController.stats').middleware(['auth'])

  // Hours Management
  Route.get('/hours/pending', 'VolunteerHoursManagementController.pending').middleware(['auth'])
  Route.post('/hours/:id/approve', 'VolunteerHoursManagementController.approve').middleware([
    'auth'
  ])
  Route.post('/hours/:id/reject', 'VolunteerHoursManagementController.reject').middleware(['auth'])
  Route.post('/hours/bulk-approve', 'VolunteerHoursManagementController.bulkApprove').middleware([
    'auth'
  ])
  Route.get(
    '/volunteers/:id/hours',
    'VolunteerHoursManagementController.volunteerHours'
  ).middleware(['auth'])

  // Analytics
  Route.get('/analytics/volunteers', 'VolunteerAnalyticsController.volunteers').middleware(['auth'])
  Route.get('/analytics/leaderboard', 'VolunteerAnalyticsController.leaderboard').middleware([
    'auth'
  ])
  Route.get('/analytics/trends', 'VolunteerAnalyticsController.trends').middleware(['auth'])

  // Communications
  Route.get('/communications', 'OrganizationCommunicationsController.index').middleware(['auth'])
  Route.post('/communications/send', 'OrganizationCommunicationsController.send').middleware([
    'auth'
  ])
  Route.get('/communications/:id', 'OrganizationCommunicationsController.show').middleware(['auth'])
  Route.post(
    '/communications/broadcast',
    'OrganizationCommunicationsController.broadcast'
  ).middleware(['auth'])

  // Organization achievements management
  Route.get('/achievements', 'AchievementsController.index').middleware(['auth'])
  Route.post('/achievements', 'AchievementsController.store').middleware(['auth'])
  Route.put('/achievements/:id', 'AchievementsController.update').middleware(['auth'])
  Route.delete('/achievements/:id', 'AchievementsController.destroy').middleware(['auth'])
  // Organization resources (current org)
  Route.get('/resources', 'OrganizationsController.organizationResources').middleware(['auth'])
}).prefix('/organization') // 🏆 New: Apply the prefix once here
// Note: If you were getting a double slash before, try prefix('organization') instead of '/organization'
// But since you were using .prefix(''), this full path is likely what's missing.

export {}
