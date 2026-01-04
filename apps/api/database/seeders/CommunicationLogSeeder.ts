import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Database from '@ioc:Adonis/Lucid/Database'

export default class CommunicationLogSeeder extends BaseSeeder {
  public async run() {
    const RECORD_COUNT = 150
    const now = new Date()
    const timestamp = now.toISOString()

    const commsResult = await Database.rawQuery('SELECT id FROM communications ORDER BY id ASC LIMIT 100')
    const commIds = commsResult[0].map((row: any) => row.id)

    if (commIds.length === 0) {
      console.log('CommunicationLogSeeder: no communications found, skipping')
      return
    }

    const activities = ['sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed']
    const rows: any[] = []

    for (let i = 0; i < RECORD_COUNT; i++) {
      const commId = commIds[Math.floor(Math.random() * commIds.length)]
      const activity = activities[Math.floor(Math.random() * activities.length)]

      const activityDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)

      rows.push({
        communication_id: commId,
        activity_type: activity,
        activity_details: `Communication ${activity} successfully`,
        ip_address: `192.168.1.${Math.floor(Math.random() * 255)}`,
        user_agent: 'Mozilla/5.0',
        occurred_at: activityDate.toISOString(),
        created_at: timestamp,
        updated_at: timestamp
      })
    }

    if (!rows.length) {
      console.log('CommunicationLogSeeder: no rows to insert')
      return
    }

    const placeholders = rows.map(() => '(?,?,?,?,?,?,?,?)').join(',')
    const sql = 'INSERT INTO communication_logs (communication_id,activity_type,activity_details,ip_address,user_agent,occurred_at,created_at,updated_at) VALUES ' + placeholders

    const bindings = rows.flatMap((row) => [row.communication_id, row.activity_type, row.activity_details, row.ip_address, row.user_agent, row.occurred_at, row.created_at, row.updated_at])

    const trx = await Database.transaction()
    try {
      await trx.rawQuery(sql, bindings)
      await trx.commit()
      console.log(`CommunicationLogSeeder: inserted ${rows.length} communication logs`)
    } catch (error) {
      await trx.rollback()
      console.error('CommunicationLogSeeder failed', error)
      throw error
    }
  }
}
