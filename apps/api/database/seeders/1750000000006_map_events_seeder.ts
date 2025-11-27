import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Database from '@ioc:Adonis/Lucid/Database'
import { DateTime } from 'luxon'

export default class MapEventsSeeder extends BaseSeeder {
  public async run() {
    // Create several small events near the demo coordinates so map has data
    const baseLat = 31.6295
    const baseLng = -7.9811

    const events = []
    for (let i = 0; i < 8; i++) {
      const lat = +(baseLat + (Math.random() - 0.5) * 0.03).toFixed(6)
      const lng = +(baseLng + (Math.random() - 0.5) * 0.03).toFixed(6)
      events.push({
        title: `Map Seed Event ${i + 1}`,
        description: 'Seeded event for map testing',
        location: `Location ${i + 1}`,
        start_at: DateTime.now().plus({ days: i }).toSQL({ includeOffset: false }),
        end_at: DateTime.now().plus({ days: i, hours: 3 }).toSQL({ includeOffset: false }),
        capacity: 20 + Math.floor(Math.random() * 30),
        latitude: lat,
        longitude: lng,
        is_published: true,
        created_at: DateTime.now().toSQL({ includeOffset: false }),
        updated_at: DateTime.now().toSQL({ includeOffset: false })
      })
    }

    try {
      await Database.table('events').multiInsert(events)
      console.log('✅ Map events seeded')
    } catch (e) {
      console.warn('Could not seed map events, likely already present', e.message)
    }
  }
}
