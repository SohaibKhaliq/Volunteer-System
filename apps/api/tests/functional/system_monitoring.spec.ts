import { test } from '@japa/runner'
import User from 'App/Models/User'
import Organization from 'App/Models/Organization'
import OrganizationTeamMember from 'App/Models/OrganizationTeamMember'
import FeatureFlag from 'App/Models/FeatureFlag'
import ScheduledJob from 'App/Models/ScheduledJob'
import AuditLog from 'App/Models/AuditLog'
import Database from '@ioc:Adonis/Lucid/Database'
import { DateTime } from 'luxon'

test.group('System & Monitoring Controllers', (group) => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction()
    return () => Database.rollbackGlobalTransaction()
  })

  // ==========================================
  // SystemMonitoringController Tests
  // ==========================================
  test('system_monitoring: background jobs status requires super admin', async ({ client, assert }) => {
    // Normal admin
    const admin = await User.create({ email: `sys-adm-${Date.now()}@test.com`, password: 'pass', isAdmin: false, firstName: 'Test', lastName: 'User' })
    const resp = await client.loginAs(admin).get('/admin/monitoring/background-jobs')
    resp.assertStatus(403) // Middleware returns 403 Forbidden

    // Super admin
    const superAdmin = await User.create({ email: `sys-super-${Date.now()}@test.com`, password: 'pass', isAdmin: true, firstName: 'Test', lastName: 'User' })
    const resp2 = await client.loginAs(superAdmin).get('/admin/monitoring/background-jobs')
    resp2.assertStatus(200)
    assert.exists(resp2.body().failed) // assuming mock service returns default struct
  })

  // ==========================================
  // MonitoringController Tests
  // ==========================================
  test('monitoring: stats and recent', async ({ client, assert }) => {
    const admin = await User.create({ email: `mon-adm-${Date.now()}@test.com`, password: 'pass', isAdmin: true, firstName: 'Test', lastName: 'User' })
    
    // Create some data
    await ScheduledJob.create({ name: 'TestJob', type: 'Cleanup', status: 'Scheduled', runAt: DateTime.now() })
    
    const statsResp = await client.loginAs(admin).get('/monitoring/stats')
    statsResp.assertStatus(200)
    assert.exists(statsResp.body().communications)
    assert.exists(statsResp.body().scheduledJobs)

    const recentResp = await client.loginAs(admin).get('/monitoring/recent')
    recentResp.assertStatus(200)
    assert.isArray(recentResp.body().scheduledJobs)
  })

  // ==========================================
  // AuditLogsController Tests
  // ==========================================
  test('audit_logs: index and export', async ({ client, assert }) => {
    const admin = await User.create({ email: `aud-adm-${Date.now()}@test.com`, password: 'pass', isAdmin: true, firstName: 'Test', lastName: 'User' })
    
    // Create log
    await AuditLog.create({
      userId: admin.id,
      action: 'login',
      targetType: 'user',
      targetId: admin.id,
      details: 'Test login',
      ipAddress: '127.0.0.1'
    })

    const indexResp = await client.loginAs(admin).get('/admin/audit-logs/search')
    indexResp.assertStatus(200) // search returns data directly? controller: return response.ok(logs)
    assert.isAbove(indexResp.body().data.length, 0)

    const exportResp = await client.loginAs(admin).get('/admin/audit-logs/export').qs({ format: 'csv' })
    exportResp.assertStatus(200)
    assert.include(exportResp.header('content-type'), 'text/csv')
  })

  // ==========================================
  // FeatureFlagsController Tests
  // ==========================================
  test('feature_flags: crud and update audit', async ({ client, assert }) => {
    const admin = await User.create({ email: `ff-adm-${Date.now()}@test.com`, password: 'pass', isAdmin: true, firstName: 'Test', lastName: 'User' }) // Middleware probably requires admin

    // Create
    const createResp = await client.loginAs(admin).post('/feature-flags').json({
      key: 'new_feature',
      description: 'Testing',
      enabled: false
    })
    createResp.assertStatus(201)
    const flagId = createResp.body().id

    // Update
    const updateResp = await client.loginAs(admin).put(`/feature-flags/${flagId}`).json({
      enabled: true
    })
    updateResp.assertStatus(200)
    assert.isTrue(updateResp.body().enabled)

    // Verify audit log created
    const log = await AuditLog.query().where('action', 'feature_flag_updated').where('entity_id', flagId).first()
    assert.exists(log)
  })

  // ==========================================
  // ScheduledJobsController Tests
  // ==========================================
  test('scheduled_jobs: create and retry', async ({ client, assert }) => {
    const admin = await User.create({ email: `job-adm-${Date.now()}@test.com`, password: 'pass', isAdmin: true, firstName: 'Test', lastName: 'User' })

    // Create
    const createResp = await client.loginAs(admin).post('/scheduled-jobs').json({
      name: 'Daily Report',
      type: 'report',
      runAt: DateTime.now().plus({ hours: 1 }).toISO()
    })
    createResp.assertStatus(201)
    const jobId = createResp.body().id

    // Retry (reschedule)
    const retryResp = await client.loginAs(admin).post(`/admin/invite-send-jobs/${jobId}/retry`)
    // Wait, route is different?
    // Routes file: Route.post('/scheduled-jobs/:id/retry', 'ScheduledJobsController.retry') -> line 417
    // Also Route.post('/invite-send-jobs/:id/retry', 'InviteSendJobsController.retry') -> line 481
    // ScheduledJobsController is at /scheduled-jobs based on line 416?
    // Let's check routes again.
    // Line 416: Route.post('/scheduled-jobs', 'ScheduledJobsController.store').middleware(['auth'])
    // Line 417: Route.post('/scheduled-jobs/:id/retry', 'ScheduledJobsController.retry').middleware(['auth'])
    
    const retryRespCorrect = await client.loginAs(admin).post(`/scheduled-jobs/${jobId}/retry`)
    retryRespCorrect.assertStatus(200)
    
    await ScheduledJob.find(jobId).then(j => {
      assert.equal(j?.status, 'Scheduled')
    })
  })

  // ==========================================
  // ImportController Tests
  // ==========================================
  test('imports: volunteers import', async ({ client, assert }) => {
    const admin = await User.create({ email: `imp-adm-${Date.now()}@test.com`, password: 'pass', firstName: 'Test', lastName: 'User' })
    const org = await Organization.create({ name: 'Imp Org', type: 'Community' })
    await OrganizationTeamMember.create({ organizationId: org.id, userId: admin.id, role: 'admin' })

    const csvContent = 'email,first_name,last_name,role,status\nnew@volunteer.com,New,Vol,Volunteer,Active'
    
    // We need to simulate file upload. Japa client .file works.
    const file = {
        fieldName: 'file',
        filename: 'volunteers.csv',
        content: csvContent,
    }
    
    // Route: /imports/volunteers
    const resp = await client.loginAs(admin).post('/imports/volunteers')
      .file('file', Buffer.from(csvContent), { filename: 'volunteers.csv', contentType: 'text/csv' }) // Proper file handling in Japa
    
    resp.assertStatus(200)
    assert.equal(resp.body().results.imported, 1)
  })
})
