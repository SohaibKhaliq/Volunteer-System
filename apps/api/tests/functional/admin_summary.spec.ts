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
      firstName: 'Admin',
      lastName: 'User',
      isAdmin: true
    })

    const { DateTime } = await import('luxon')
    const BackgroundCheck = (await import('App/Models/BackgroundCheck')).default
    const ScheduledJob = (await import('App/Models/ScheduledJob')).default
    const VolunteerHour = (await import('App/Models/VolunteerHour')).default
    const Notification = (await import('App/Models/Notification')).default

    await BackgroundCheck.create({
      userId: admin.id,
      status: 'requested',
      requestedAt: DateTime.now()
    })

    await ScheduledJob.create({
      name: 'import volunteers',
      type: 'import:volunteers',
      status: 'Scheduled',
      runAt: DateTime.now()
    })

    await VolunteerHour.create({
      userId: admin.id,
      status: 'pending',
      hours: 1,
      date: DateTime.now()
    })

    await Notification.create({
      userId: admin.id,
      type: 'system',
      payload: {},
      read: false
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
