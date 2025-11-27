import { test } from '@japa/runner'
import User from 'App/Models/User'
import VolunteerHour from 'App/Models/VolunteerHour'
import { DateTime } from 'luxon'

test.group('User impact score', () => {
  test('me returns impactScore and impactPercentile for user with hours', async ({
    client,
    assert
  }) => {
    const u = await User.create({ email: 'impact@test', password: 'pass' })

    // create varied hours for this and other users
    const other = await User.create({ email: 'impact2@test', password: 'pass' })

    await VolunteerHour.create({
      userId: u.id,
      eventId: null,
      date: DateTime.now().minus({ days: 10 }).toJSDate(),
      hours: 20,
      status: 'approved'
    })
    await VolunteerHour.create({
      userId: u.id,
      eventId: null,
      date: DateTime.now().minus({ days: 40 }).toJSDate(),
      hours: 10,
      status: 'approved'
    })

    // other user with higher hours to influence percentile
    await VolunteerHour.create({
      userId: other.id,
      eventId: null,
      date: DateTime.now().minus({ days: 5 }).toJSDate(),
      hours: 100,
      status: 'approved'
    })

    const resp = await client.loginAs(u).get('/me')
    resp.assertStatus(200)
    const body = resp.body()
    assert.isDefined(body.impactScore)
    assert.isDefined(body.impactPercentile)
    assert.typeOf(body.impactScore, 'number')
    assert.typeOf(body.impactPercentile, 'number')
    // totals should be calculated dynamically
    assert.equal(Number(body.totalHours || body.hours), 30)
    assert.equal(Number(body.recentHours), 30)
    // last 30 days includes the 20h entry; previous 30-day window includes the 10h entry
    assert.equal(Number(body.hoursLast30), 20)
    assert.equal(Number(body.hoursPrevious30), 10)
    assert.typeOf(body.hoursChangePercent, 'number')
    assert.equal(Number(body.hoursChangePercent), 100)
  })

  test('percentile is computed using combined impact-score distribution (hours+events+recent)', async ({
    client,
    assert
  }) => {
    // Create three users with totals and events arranged so combined-score ordering
    // differs from hours-only ordering.
    const a = await User.create({ email: 'a@test', password: 'pass' })
    const b = await User.create({ email: 'b@test', password: 'pass' })
    const c = await User.create({ email: 'c@test', password: 'pass' })

    // Use old dates (> 200 days ago) so recent window (90d) does not affect scores
    const oldDate = DateTime.now().minus({ days: 200 }).toJSDate()

    // a: 60 hours, 0 events
    await VolunteerHour.create({
      userId: a.id,
      eventId: null,
      date: oldDate,
      hours: 60,
      status: 'approved'
    })

    // b: 70 hours, 0 events
    await VolunteerHour.create({
      userId: b.id,
      eventId: null,
      date: oldDate,
      hours: 70,
      status: 'approved'
    })

    // c: 50 hours split across 10 distinct events -> should have higher combined score
    for (let i = 1; i <= 10; i++) {
      await VolunteerHour.create({
        userId: c.id,
        eventId: i,
        date: oldDate,
        hours: 5,
        status: 'approved'
      })
    }

    const resp = await client.loginAs(a).get('/me')
    resp.assertStatus(200)
    const body = resp.body()
    // expected combined scores: a=60*6=360, b=70*6=420, c=50*6 + 10*15 = 300 + 150 = 450
    // percentile for a (360) among [360,420,450] -> 2 have higher -> pct ~= 33
    assert.equal(body.impactPercentile, 33)
  })
})
