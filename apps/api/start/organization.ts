import Route from '@ioc:Adonis/Core/Route'

// Organization Panel Routes (extracted for clarity)
Route.group(() => {
  // Profile & Dashboard
  // All paths are now relative to the group prefix '/organization'
  Route.get('/profile', 'OrganizationsController.show').middleware(['auth'])
  Route.put('/profile', 'OrganizationsController.update').middleware(['auth'])
  Route.get('/dashboard-stats', 'OrganizationsController.dashboardStats').middleware(['auth'])
  Route.get('/settings', 'OrganizationsController.getSettings').middleware(['auth'])
  Route.patch('/settings', 'OrganizationsController.updateSettings').middleware(['auth'])

  // Team
  Route.get('/team', 'OrganizationsController.team').middleware(['auth'])
  Route.post('/team/invite', 'OrganizationsController.inviteMember').middleware(['auth'])
  Route.put('/team/:memberId', 'OrganizationsController.updateMember').middleware(['auth'])
  Route.delete('/team/:memberId', 'OrganizationsController.removeMember').middleware(['auth'])

  // Teams/Departments
  Route.get('/teams', 'TeamsController.myOrganizationTeams').middleware(['auth'])
  Route.post('/teams', 'TeamsController.storeForMyOrganization').middleware(['auth'])
  Route.get('/teams/:id', 'TeamsController.show').middleware(['auth'])
  Route.put('/teams/:id', 'TeamsController.update').middleware(['auth'])
  Route.delete('/teams/:id', 'TeamsController.destroy').middleware(['auth'])

  // Events (Scoped to Org)
  Route.get('/events', 'EventsController.index').middleware(['auth'])
  Route.post('/events', 'EventsController.store').middleware(['auth'])
  Route.put('/events/:id', 'EventsController.update').middleware(['auth'])
  Route.delete('/events/:id', 'EventsController.destroy').middleware(['auth'])

  // Opportunities (enhanced events/shifts)
  Route.get('/opportunities', 'OpportunitiesController.myOrganizationOpportunities').middleware([
    'auth'
  ])
  Route.post('/opportunities', 'OpportunitiesController.storeForMyOrganization').middleware([
    'auth'
  ])
  Route.get('/opportunities/:id', 'OpportunitiesController.show').middleware(['auth'])
  Route.put('/opportunities/:id', 'OpportunitiesController.update').middleware(['auth'])
  Route.delete('/opportunities/:id', 'OpportunitiesController.destroy').middleware(['auth'])
  Route.post('/opportunities/:id/publish', 'OpportunitiesController.publish').middleware(['auth'])

  // Applications for opportunities
  Route.get('/applications', 'ApplicationsController.myOrganizationApplications').middleware([
    'auth'
  ])
  Route.patch('/applications/:id', 'ApplicationsController.update').middleware(['auth'])
  Route.post('/applications/bulk', 'ApplicationsController.bulkUpdate').middleware(['auth'])
  Route.get(
    '/opportunities/:opportunityId/applications',
    'ApplicationsController.index'
  ).middleware(['auth'])

  // Attendances
  Route.get('/attendances', 'AttendancesController.myOrganizationAttendances').middleware(['auth'])
  Route.get(
    '/opportunities/:id/attendances',
    'AttendancesController.opportunityAttendances'
  ).middleware(['auth'])
  Route.post('/opportunities/:id/manual-checkin', 'AttendancesController.manualCheckIn').middleware(
    ['auth']
  )
  Route.get('/opportunities/:id/attendance-summary', 'AttendancesController.summary').middleware([
    'auth'
  ])
  Route.get('/opportunities/:id/checkin-code', 'AttendancesController.getCheckinCode').middleware([
    'auth'
  ])
  Route.post(
    '/opportunities/:id/generate-checkin-code',
    'AttendancesController.generateCheckinCode'
  ).middleware(['auth'])
  Route.put('/attendances/:id', 'AttendancesController.update').middleware(['auth'])
  Route.delete('/attendances/:id', 'AttendancesController.destroy').middleware(['auth'])

  // Volunteers
  Route.get('/volunteers', 'OrganizationVolunteersController.index').middleware(['auth'])
  Route.post('/volunteers', 'OrganizationVolunteersController.store').middleware(['auth'])
  Route.put('/volunteers/:id', 'OrganizationVolunteersController.update').middleware(['auth'])
  Route.delete('/volunteers/:id', 'OrganizationVolunteersController.destroy').middleware(['auth'])
  Route.post('/volunteers/:id/approve', 'OrganizationVolunteersController.approve').middleware([
    'auth'
  ])
  Route.post('/volunteers/:id/reject', 'OrganizationVolunteersController.reject').middleware([
    'auth'
  ])

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

  // CSV Import endpoints
  Route.post('/import/volunteers', 'ImportController.importVolunteers').middleware(['auth'])
  Route.post('/import/opportunities', 'ImportController.importOpportunities').middleware(['auth'])
  Route.get('/import/volunteers/template', 'ImportController.volunteersTemplate').middleware([
    'auth'
  ])
  Route.get('/import/opportunities/template', 'ImportController.opportunitiesTemplate').middleware([
    'auth'
  ])

  // CSV Export endpoints
  Route.get('/export/volunteers', 'ExportController.exportVolunteers').middleware(['auth'])
  Route.get('/export/opportunities', 'ExportController.exportOpportunities').middleware(['auth'])
  Route.get('/export/applications', 'ExportController.exportApplications').middleware(['auth'])
  Route.get('/export/attendances', 'ExportController.exportAttendances').middleware(['auth'])
  Route.get('/export/hours', 'ExportController.exportHours').middleware(['auth'])

  // Organization Reports & Analytics
  Route.get('/reports/summary', 'OrganizationReportsController.summary').middleware(['auth'])
  Route.get('/reports/volunteer-hours', 'OrganizationReportsController.volunteerHours').middleware([
    'auth'
  ])
  Route.get(
    '/reports/opportunity-performance',
    'OrganizationReportsController.opportunityPerformance'
  ).middleware(['auth'])
  Route.get(
    '/reports/volunteer-retention',
    'OrganizationReportsController.volunteerRetention'
  ).middleware(['auth'])
}).prefix('/organization')

// Public organization pages (no auth required)
Route.group(() => {
  Route.get('/', 'PublicOrganizationController.index')
  Route.get('/cities', 'PublicOrganizationController.cities')
  Route.get('/countries', 'PublicOrganizationController.countries')
  Route.get('/types', 'PublicOrganizationController.types')
  Route.get('/:slug', 'PublicOrganizationController.show')
  Route.get('/:slug/opportunities', 'PublicOrganizationController.opportunities')
  Route.get('/:slug/opportunities/:opportunityId', 'PublicOrganizationController.opportunity')
}).prefix('/public/organizations')

// Public opportunity endpoints (for volunteers to apply)
Route.get('/opportunities/:id', 'OpportunitiesController.show')
Route.post('/opportunities/:id/apply', 'ApplicationsController.apply').middleware(['auth'])
Route.post('/opportunities/:id/checkin', 'AttendancesController.checkIn').middleware(['auth'])
Route.post('/opportunities/:id/checkout', 'AttendancesController.checkOut').middleware(['auth'])

// QR Code check-in (uses code instead of opportunity ID)
Route.post('/checkin/qr', 'AttendancesController.qrCheckIn').middleware(['auth'])

// Application management for volunteers
Route.delete('/applications/:id', 'ApplicationsController.withdraw').middleware(['auth'])

// Organization-scoped routes (admin/manager access to specific org)
Route.group(() => {
  // Teams
  Route.get('/teams', 'TeamsController.index').middleware(['auth'])
  Route.post('/teams', 'TeamsController.store').middleware(['auth'])

  // Opportunities
  Route.get('/opportunities', 'OpportunitiesController.index').middleware(['auth'])
  Route.post('/opportunities', 'OpportunitiesController.store').middleware(['auth'])

  // Applications
  Route.get('/applications', 'ApplicationsController.organizationApplications').middleware(['auth'])

  // Attendances
  Route.get('/attendances', 'AttendancesController.organizationAttendances').middleware(['auth'])
}).prefix('/organizations/:organizationId')

export {}
