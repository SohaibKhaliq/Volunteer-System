import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Database from '@ioc:Adonis/Lucid/Database'

export default class CarpoolingAdSeeder extends BaseSeeder {
  public async run() {
    const RECORD_COUNT = 20
    const now = new Date()
    const timestamp = now.toISOString()

    const usersResult = await Database.rawQuery('SELECT id FROM users ORDER BY id ASC LIMIT 50')
    const userIds = usersResult[0].map((row: any) => row.id)

    if (userIds.length === 0) {
      console.log('CarpoolingAdSeeder: no users found, skipping')
      return
    }

    const routes = [
      { from: 'Sydney CBD', to: 'Parramatta', seats: 3 },
      { from: 'Melbourne CBD', to: 'Geelong', seats: 2 },
      { from: 'Brisbane City', to: 'Gold Coast', seats: 4 },
      { from: 'Perth CBD', to: 'Fremantle', seats: 3 },
      { from: 'Adelaide CBD', to: 'Glenelg', seats: 2 }
    ]

    const statuses = ['active', 'filled', 'cancelled']
    const rows: any[] = []

    for (let i = 0; i < RECORD_COUNT; i++) {
      const route = routes[i % routes.length]
      const userId = userIds[Math.floor(Math.random() * userIds.length)]
      const status = statuses[Math.floor(Math.random() * statuses.length)]

      const departureDate = new Date()
      departureDate.setDate(departureDate.getDate() + Math.floor(Math.random() * 14) + 1)
      departureDate.setHours(Math.floor(Math.random() * 8) + 7, 0, 0, 0)

      rows.push({
        user_id: userId,
        from_location: route.from,
        to_location: route.to,
        departure_time: departureDate.toISOString(),
        available_seats: route.seats,
        price_per_seat: Math.floor(Math.random() * 20) + 5,
        status: status,
        notes: 'Prefer non-smokers',
        created_at: timestamp,
        updated_at: timestamp
      })
    }

    if (!rows.length) {
      console.log('CarpoolingAdSeeder: no rows to insert')
      return
    }

    const placeholders = rows.map(() => '(?,?,?,?,?,?,?,?,?,?)').join(',')
    const sql = 'INSERT INTO carpooling_ads (user_id,from_location,to_location,departure_time,available_seats,price_per_seat,status,notes,created_at,updated_at) VALUES ' + placeholders +
      ' ON DUPLICATE KEY UPDATE status=VALUES(status),updated_at=VALUES(updated_at)'

    const bindings = rows.flatMap((row) => [row.user_id, row.from_location, row.to_location, row.departure_time, row.available_seats, row.price_per_seat, row.status, row.notes, row.created_at, row.updated_at])

    const trx = await Database.transaction()
    try {
      await trx.rawQuery(sql, bindings)
      await trx.commit()
      console.log(`CarpoolingAdSeeder: upserted ${rows.length} carpooling ads`)
    } catch (error) {
      await trx.rollback()
      console.error('CarpoolingAdSeeder failed', error)
      throw error
    }
  }
}
