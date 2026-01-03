import { test } from '@japa/runner'
import User from 'App/Models/User'
import Database from '@ioc:Adonis/Lucid/Database'
import { DateTime } from 'luxon'

test.group('Admin summary endpoint', () => {
  test('unauthenticated should return 401', async ({ client }) => {
  test('unauthenticated should return 401', async ({ client }) => {
    const response = await client.get('/admin/summary')
    response.assertStatus(401)
  })
  })

  test('admin can fetch summary counts', async ({ client, assert }) => {
    // create a super admin
    const admin = await User.create({
      email: 'admin-summary_' + Math.floor(Math.random() * 100000) + '@test.com',
      password: 'pass',
      isAdmin: true
    })

    // seed some records to ensure counts are non-zero
    await Database.table('background_checks').insert({
      user_id: admin.id,
      status: 'requested',
      requested_at: DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss')
    })
    await Database.table('scheduled_jobs').insert({
      name: 'import volunteers',
      type: 'import:volunteers',
      status: 'Scheduled',
      run_at: DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss')
    })
    await Database.table('volunteer_hours').insert({
      user_id: admin.id,
      status: 'pending',
      hours: 1,
      date: DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss')
    })
    await Database.table('notifications').insert({
      user_id: admin.id,
      type: 'system',
      payload: JSON.stringify({}),
      read: false,
      created_at: DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss')
    })

    const resp = await client.loginAs(admin).get('/admin/summary')
    resp.assertStatus(200)
    const body = resp.body()
    console.log('Admin Summary Body:', body)

    assert.isNumber(body.backgroundChecksPending)
    assert.isNumber(body.importsPending)
    assert.isNumber(body.pendingHours)
    assert.isNumber(body.unreadNotifications)

    // ensure counts are >= 1
    assert.isTrue(body.backgroundChecksPending >= 1)
    assert.isTrue(body.importsPending >= 1)
    assert.isTrue(body.pendingHours >= 1)
    assert.isTrue(body.unreadNotifications >= 1)
  })
})
