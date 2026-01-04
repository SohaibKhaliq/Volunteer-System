import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Database from '@ioc:Adonis/Lucid/Database'

export default class AttendanceSeeder extends BaseSeeder {
  public async run() {
    const RECORD_COUNT = 150

    const now = new Date()
    const timestamp = now.toISOString().slice(0, 19).replace('T', ' ')

    const usersResult = await Database.rawQuery('SELECT id FROM users ORDER BY id ASC LIMIT 50')
    const userIds = usersResult[0].map((row: any) => row.id)

    const oppsResult = await Database.rawQuery('SELECT id FROM opportunities ORDER BY id ASC LIMIT 50')
    const oppIds = oppsResult[0].map((row: any) => row.id)

    if (userIds.length === 0 || oppIds.length === 0) {
      console.log('AttendanceSeeder: missing users or opportunities, skipping')
      return
    }

    const methods = ['manual', 'qr', 'biometric']

    const rows: any[] = []

    for (let i = 0; i < RECORD_COUNT; i++) {
      const userId = userIds[Math.floor(Math.random() * userIds.length)]
      const oppId = oppIds[Math.floor(Math.random() * oppIds.length)]

      const checkInDate = new Date()
      checkInDate.setDate(checkInDate.getDate() - Math.floor(Math.random() * 60))
      checkInDate.setHours(Math.floor(Math.random() * 6) + 8, Math.floor(Math.random() * 60))

      const checkOutDate = new Date(checkInDate)
      checkOutDate.setHours(checkOutDate.getHours() + Math.floor(Math.random() * 4) + 2)

      const method = methods[Math.floor(Math.random() * methods.length)]

      const metadata = JSON.stringify({
        device_id: `device_${Math.floor(Math.random() * 100)}`,
        ip_address: `192.168.1.${Math.floor(Math.random() * 255)}`,
        location: 'On-site'
      })

      rows.push({
        opportunity_id: oppId,
        user_id: userId,
        check_in_at: checkInDate.toISOString().slice(0, 19).replace('T', ' '),
        check_out_at: Math.random() > 0.1 ? checkOutDate.toISOString().slice(0, 19).replace('T', ' ') : null,
        method: method,
        metadata: metadata,
        created_at: timestamp,
        updated_at: timestamp
      })
    }

    if (!rows.length) {
      console.log('AttendanceSeeder: no rows to insert')
      return
    }

    const placeholders = rows.map(() => '(?,?,?,?,?,?,?,?)').join(',')
    const sql =
      'INSERT INTO attendances (opportunity_id,user_id,check_in_at,check_out_at,method,metadata,created_at,updated_at) VALUES ' +
      placeholders

    const bindings = rows.flatMap((row) => [
      row.opportunity_id,
      row.user_id,
      row.check_in_at,
      row.check_out_at,
      row.method,
      row.metadata,
      row.created_at,
      row.updated_at
    ])

    const trx = await Database.transaction()
    try {
      await trx.rawQuery(sql, bindings)
      await trx.commit()
      console.log(`AttendanceSeeder: inserted ${rows.length} attendance records`)
    } catch (error) {
      await trx.rollback()
      console.error('AttendanceSeeder failed', error)
      throw error
    }
  }
}
