import { test } from '@japa/runner'
import User from 'App/Models/User'
import Database from '@ioc:Adonis/Lucid/Database'

test.group('Admin summary endpoint', () => {
  test('unauthenticated should return 401', async ({ client }) => {
    await client.get('/admin/summary').assertStatus(401)
  })

  test('admin can fetch summary counts', async ({ client }) => {
    // create a super admin
    const admin = await User.create({
      email: 'admin-summary@test',
      password: 'pass',
      isAdmin: true
    })

    // seed some records to ensure counts are non-zero
    await Database.table('background_checks').insert({
      user_id: admin.id,
      status: 'requested',
      requested_at: new Date()
    })
    await Database.table('scheduled_jobs').insert({
      name: 'import volunteers',
      type: 'import:volunteers',
      status: 'Scheduled',
      run_at: new Date()
    })
    await Database.table('volunteer_hours').insert({
      user_id: admin.id,
      status: 'pending',
      hours: 1,
      date: new Date()
    })
    await Database.table('notifications').insert({
      user_id: admin.id,
      type: 'system',
      payload: JSON.stringify({}),
      read: false,
      created_at: new Date()
    })

    const resp = await client.loginAs(admin).get('/admin/summary')
    resp.assertStatus(200)
    const body = resp.body()

    test.assert(typeof body.backgroundChecksPending === 'number')
    test.assert(typeof body.importsPending === 'number')
    test.assert(typeof body.pendingHours === 'number')
    test.assert(typeof body.unreadNotifications === 'number')

    // ensure counts are >= 1
    test.assert(body.backgroundChecksPending >= 1)
    test.assert(body.importsPending >= 1)
    test.assert(body.pendingHours >= 1)
    test.assert(body.unreadNotifications >= 1)
  })
})
