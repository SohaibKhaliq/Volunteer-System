import { test } from '@japa/runner'
import User from 'App/Models/User'
import Achievement from 'App/Models/Achievement'
import VolunteerHour from 'App/Models/VolunteerHour'
import Notification from 'App/Models/Notification'
import { DateTime } from 'luxon'
import Database from '@ioc:Adonis/Lucid/Database'

test.group('Achievements', () => {
  test('admin can create a global achievement and users can be awarded automatically', async ({
    client,
    assert
  }) => {
    // create an admin
    const admin = await User.create({ email: 'admin-ach@test', password: 'pass', isAdmin: true })

    const createResp = await client
      .loginAs(admin)
      .post('/achievements')
      .json({
        key: '50-hours',
        title: '50 Hours Club',
        description: 'Awarded for 50+ hours',
        criteria: { type: 'hours', threshold: 50 }
      })
    createResp.assertStatus(201)
    const ach = await Achievement.findBy('key', '50-hours')
    assert.exists(ach)

    // create a user and hours >= 50
    const u = await User.create({ email: 'achiever@test', password: 'pass' })
    await VolunteerHour.create({
      userId: u.id,
      eventId: null,
      date: DateTime.now().minus({ days: 10 }).toJSDate(),
      hours: 30,
      status: 'approved'
    })
    await VolunteerHour.create({
      userId: u.id,
      eventId: null,
      date: DateTime.now().minus({ days: 40 }).toJSDate(),
      hours: 25,
      status: 'approved'
    })

    const resp = await client.loginAs(u).get('/me')
    resp.assertStatus(200)
    const body = resp.body()
    assert.isArray(body.achievements)
    assert.isTrue(body.achievements.some((a: any) => a.key === '50-hours'))

    // a notification should have been created for this achievement
    const notes = await Notification.query()
      .where('user_id', u.id)
      .andWhere('type', 'achievement_awarded')
      .andWhere('payload', 'like', `%\"key\": \"50-hours\"%`)
    assert.isTrue(notes.length > 0)
  })

  test('achievements with events criteria are awarded', async ({ client, assert }) => {
    const admin = await User.create({ email: 'admin-ach2@test', password: 'pass', isAdmin: true })
    const achResp = await client
      .loginAs(admin)
      .post('/achievements')
      .json({
        key: '5-events',
        title: '5 Events Attended',
        description: 'Attend 5 distinct events to earn',
        criteria: { type: 'events', threshold: 5 }
      })
    achResp.assertStatus(201)

    const u = await User.create({ email: 'events@t.test', password: 'pass' })
    // create 5 distinct event volunteer_hours
    for (let i = 1; i <= 5; i++) {
      await VolunteerHour.create({
        userId: u.id,
        eventId: i + 100,
        date: DateTime.now()
          .minus({ days: i * 10 })
          .toJSDate(),
        hours: 2,
        status: 'approved'
      })
    }

    const resp = await client.loginAs(u).get('/me')
    resp.assertStatus(200)
    const body = resp.body()
    assert.isArray(body.achievements)
    assert.isTrue(body.achievements.some((a: any) => a.key === '5-events'))
  })

  test('Early Adopter awarded to users created > 2 years ago', async ({ client, assert }) => {
    const admin = await User.create({ email: 'admin-old@test', password: 'pass', isAdmin: true })

    const createResp = await client
      .loginAs(admin)
      .post('/achievements')
      .json({
        key: 'early-adopter',
        title: 'Early Adopter',
        description: 'Joined more than two years ago',
        criteria: { type: 'member_days', threshold: 365 * 2 }
      })
    createResp.assertStatus(201)

    const u = await User.create({ email: 'olduser@test', password: 'pass' })
    // Adjust created_at so user appears older than 2 years
    await Database.from('users')
      .where({ id: u.id })
      .update({ created_at: DateTime.now().minus({ days: 800 }).toSQL() })

    const resp = await client.loginAs(u).get('/me')
    resp.assertStatus(200)
    const body = resp.body()
    assert.isArray(body.achievements)
    assert.isTrue(body.achievements.some((a: any) => a.key === 'early-adopter'))
  })
})
