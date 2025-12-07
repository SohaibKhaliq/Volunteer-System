import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Database from '@ioc:Adonis/Lucid/Database'
import User from 'App/Models/User'
import Organization from 'App/Models/Organization'
import { DateTime } from 'luxon'

// Large volume seeder to populate Australian-style volunteers, events and hours
export default class AusBulkSeeder extends BaseSeeder {
  public async run() {
    console.info('AusBulkSeeder disabled — using 000_all_australia_seeder instead')
    return

    // Ensure there are some organizations to attach to
    const orgs = await Organization.query().limit(10)
    if (orgs.length === 0) {
      // create a handful of well-known Australian orgs if missing
      const names = [
        'Australian Red Cross',
        'NSW Rural Fire Service',
        'Salvation Army Australia',
        'Lifeline Australia',
        'SES Victoria',
        'Victoria Police Volunteering',
        'SES NSW',
        'Bushcare',
        'State Emergency Volunteers'
      ]
      for (const n of names.slice(0, 8)) {
        await Organization.firstOrCreate({ name: n }, { name: n, isApproved: true, isActive: true })
      }
    }

    const organizations = await Organization.query().limit(8)

    // Create 200 volunteer users across Australian cities
    const cities = [
      'Sydney',
      'Melbourne',
      'Brisbane',
      'Perth',
      'Adelaide',
      'Hobart',
      'Darwin',
      'Canberra'
    ]
    const users: User[] = []
    for (let i = 0; i < 200; i++) {
      const city = cities[i % cities.length]
      const email = `${city.toLowerCase()}.vol${i}@example.com`
      const firstName = `Vol${i}`
      const lastName = city
      const u = await User.firstOrCreate(
        { email },
        {
          email,
          password: 'password',
          firstName,
          lastName,
          phone: `+61 400 ${100000 + i}`
        }
      )
      users.push(u)
    }

    // Assign users randomly to organizations as volunteers
    const volunteerRows: any[] = []
    const now = DateTime.now()
    for (const org of organizations) {
      // pick between 20 and 60 volunteers per org
      const count = Math.floor(Math.random() * 41) + 20
      const shuffled = [...users].sort(() => 0.5 - Math.random()).slice(0, count)
      for (const u of shuffled) {
        const joinedAt = now.minus({ days: Math.floor(Math.random() * 365) })
        volunteerRows.push({
          organization_id: org.id,
          user_id: u.id,
          role: Math.random() > 0.9 ? 'admin' : 'volunteer',
          status: 'active',
          joined_at: joinedAt.toSQL(),
          created_at: joinedAt.toSQL(),
          updated_at: now.toSQL()
        })
      }
    }

    // Insert volunteers
    if (volunteerRows.length) {
      try {
        await Database.table('organization_volunteers').multiInsert(volunteerRows)
        console.info(`Inserted ${volunteerRows.length} organization_volunteers`)
      } catch (err) {
        console.warn('Failed to insert organization_volunteers batch', err)
      }
    }

    // Create events & volunteer_hours across last 12 months
    const events: any[] = []
    const hoursRows: any[] = []
    for (const org of organizations) {
      // create 6-12 events per org
      const evcount = Math.floor(Math.random() * 7) + 6
      for (let e = 0; e < evcount; e++) {
        const start = now.minus({
          months: Math.floor(Math.random() * 12),
          days: Math.floor(Math.random() * 28)
        })
        const event = {
          organization_id: org.id,
          title: `${org.name} - Community Event ${e + 1}`,
          description: 'Mass volunteer mobilization',
          location: 'Various',
          start_at: start.toSQL(),
          end_at: start.plus({ hours: 6 }).toSQL(),
          capacity: Math.floor(Math.random() * 200) + 10,
          is_published: 1,
          created_at: start.toSQL(),
          updated_at: now.toSQL()
        }
        events.push({ org, event })
      }
    }

    // Bulk insert events using low-level DB (we'll need inserted ids to create hours)
    for (const item of events) {
      try {
        const [id] = await Database.table('events').insert(item.event)
        // assign some volunteer_hours to random volunteers from that org
        const vols = await Database.from('organization_volunteers')
          .where('organization_id', item.org.id)
          .select('user_id')
        for (let k = 0; k < Math.floor(Math.random() * 30); k++) {
          const chosen = vols[Math.floor(Math.random() * vols.length)]
          if (!chosen) continue
          const date = DateTime.fromSQL(item.event.start_at).plus({
            days: Math.floor(Math.random() * 2)
          })
          hoursRows.push({
            user_id: chosen.user_id,
            event_id: id,
            date: date.toISODate(),
            hours: Number((Math.random() * 6).toFixed(2)),
            status: Math.random() > 0.2 ? 'approved' : 'pending',
            created_at: now.toSQL(),
            updated_at: now.toSQL()
          })
        }
      } catch (err) {
        console.warn('Failed to insert event or generate hours', err)
      }
    }

    if (hoursRows.length) {
      try {
        await Database.table('volunteer_hours').multiInsert(hoursRows)
        console.info(`Inserted ${hoursRows.length} volunteer_hours entries`)
      } catch (err) {
        console.warn('Failed to insert volunteer_hours batch', err)
      }
    }

    // previously seeded many Australian volunteers/events; now disabled in favor of 000_all_australia_seeder
  }
}
