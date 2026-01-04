import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Database from '@ioc:Adonis/Lucid/Database'

export default class VolunteerHourSeeder extends BaseSeeder {
  public async run() {
    const RECORD_COUNT = 200

    const now = new Date()
    const timestamp = now.toISOString()

    const usersResult = await Database.rawQuery('SELECT id FROM users ORDER BY id ASC LIMIT 50')
    const userIds = usersResult[0].map((row: any) => row.id)

    const eventsResult = await Database.rawQuery('SELECT id FROM events ORDER BY id ASC LIMIT 50')
    const eventIds = eventsResult[0].map((row: any) => row.id)

    if (userIds.length === 0 || eventIds.length === 0) {
      console.log('VolunteerHourSeeder: missing users or events, skipping')
      return
    }

    const statuses = ['Pending', 'Approved', 'Rejected']
    const statusWeights = [0.2, 0.7, 0.1]

    const getWeightedStatus = () => {
      const random = Math.random()
      let cumulative = 0
      for (let i = 0; i < statuses.length; i++) {
        cumulative += statusWeights[i]
        if (random < cumulative) return statuses[i]
      }
      return statuses[1]
    }

    const rows: any[] = []

    for (let i = 0; i < RECORD_COUNT; i++) {
      const userId = userIds[Math.floor(Math.random() * userIds.length)]
      const eventId = eventIds[Math.floor(Math.random() * eventIds.length)]

      const volunteerDate = new Date()
      volunteerDate.setDate(volunteerDate.getDate() - Math.floor(Math.random() * 90))

      const hours = (Math.random() * 7 + 1).toFixed(2)
      const status = getWeightedStatus()

      rows.push({
        user_id: userId,
        event_id: eventId,
        date: volunteerDate.toISOString().split('T')[0],
        hours: parseFloat(hours),
        status: status,
        created_at: timestamp,
        updated_at: timestamp
      })
    }

    if (!rows.length) {
      console.log('VolunteerHourSeeder: no rows to insert')
      return
    }

    const placeholders = rows.map(() => '(?,?,?,?,?,?,?)').join(',')
    const sql =
      'INSERT INTO volunteer_hours (user_id,event_id,date,hours,status,created_at,updated_at) VALUES ' +
      placeholders

    const bindings = rows.flatMap((row) => [
      row.user_id,
      row.event_id,
      row.date,
      row.hours,
      row.status,
      row.created_at,
      row.updated_at
    ])

    const trx = await Database.transaction()
    try {
      await trx.rawQuery(sql, bindings)
      await trx.commit()
      console.log(`VolunteerHourSeeder: inserted ${rows.length} volunteer hour records`)
    } catch (error) {
      await trx.rollback()
      console.error('VolunteerHourSeeder failed', error)
      throw error
    }
  }
}
