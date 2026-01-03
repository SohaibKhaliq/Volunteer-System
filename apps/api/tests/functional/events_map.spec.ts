import { test } from '@japa/runner'
import Event from 'App/Models/Event'
import { DateTime } from 'luxon'

test.group('Events map API', () => {
  test('returns events with coordinates and supports geofiltering', async ({ client, assert }) => {
    // create events with known coordinates
    const ev1 = await Event.create({
      title: 'Map Test 1',
      startAt: DateTime.now(),
      latitude: 31.6295,
      longitude: -7.9811,
      is_published: true
    })

    const ev2 = await Event.create({
      title: 'Map Test 2',
      startAt: DateTime.now(),
      latitude: 31.8,
      longitude: -7.9,
      is_published: true
    })

    // query around ev1 coordinates with small radius - should return ev1 but not ev2
    const resp = await client.get('/events').qs({ lat: 31.6295, lng: -7.9811, radius: 5 })
    resp.assertStatus(200)
    const payload = resp.body()
    assert.isTrue(Array.isArray(payload))
    const ids = payload.map((e: any) => e.id)
    assert.include(ids, ev1.id)
    // ev2 is further away and may or may not be included depending on radius; at 5km should be excluded
    assert.notInclude(ids, ev2.id)
  })
})
