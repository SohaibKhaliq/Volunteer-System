import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Database from '@ioc:Adonis/Lucid/Database'

export default class ShiftSeeder extends BaseSeeder {
  public async run() {
    const RECORD_COUNT = 150 // Increased from 50
    const now = new Date()
    const timestamp = now.toISOString().slice(0, 19).replace('T', ' ')

    const orgsResult = await Database.rawQuery(
      'SELECT id FROM organizations ORDER BY id ASC LIMIT 150'
    )
    const orgIds = orgsResult[0].map((row: any) => row.id)

    const eventsResult = await Database.rawQuery('SELECT id FROM events ORDER BY id ASC LIMIT 150')
    const eventIds = eventsResult[0].map((row: any) => row.id)

    if (orgIds.length === 0) {
      console.log('ShiftSeeder: no organizations found, skipping')
      return
    }

    const shiftTypes = [
      { title: 'Morning Shift', startHour: 8, duration: 4 },
      { title: 'Afternoon Shift', startHour: 13, duration: 4 },
      { title: 'Evening Shift', startHour: 17, duration: 4 },
      { title: 'Full Day Shift', startHour: 9, duration: 8 },
      { title: 'Overnight Shift', startHour: 22, duration: 8 }
    ]

    const rows: any[] = []

    for (let i = 0; i < RECORD_COUNT; i++) {
      const shiftType = shiftTypes[i % shiftTypes.length]
      const orgId = orgIds[i % orgIds.length]
      const eventId = eventIds.length > 0 ? eventIds[i % eventIds.length] : null

      const startDate = new Date()
      startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 60))
      startDate.setHours(shiftType.startHour, 0, 0, 0)

      const endDate = new Date(startDate)
      endDate.setHours(endDate.getHours() + shiftType.duration)

      const isRecurring = Math.random() > 0.7
      const recurrenceRule = isRecurring ? 'FREQ=WEEKLY;INTERVAL=1' : null
      const templateName = isRecurring ? `${shiftType.title} Template` : null

      rows.push({
        title: `${shiftType.title} - ${i + 1}`,
        description: `Regular ${shiftType.title.toLowerCase()} for volunteer activities`,
        event_id: eventId,
        organization_id: orgId,
        start_at: startDate.toISOString().slice(0, 19).replace('T', ' '),
        end_at: endDate.toISOString().slice(0, 19).replace('T', ' '),
        capacity: Math.floor(Math.random() * 8) + 3,
        is_recurring: isRecurring ? 1 : 0,
        recurrence_rule: recurrenceRule,
        template_name: templateName,
        locked: 0,
        created_at: timestamp.slice(0, 19).replace('T', ' '),
        updated_at: timestamp.slice(0, 19).replace('T', ' ')
      })
    }

    if (!rows.length) {
      console.log('ShiftSeeder: no rows to insert')
      return
    }

    const placeholders = rows.map(() => '(?,?,?,?,?,?,?,?,?,?,?,?,?)').join(',')
    const sql =
      'INSERT INTO shifts (title,description,event_id,organization_id,start_at,end_at,capacity,is_recurring,recurrence_rule,template_name,locked,created_at,updated_at) VALUES ' +
      placeholders +
      ' ON DUPLICATE KEY UPDATE description=VALUES(description),capacity=VALUES(capacity),template_name=VALUES(template_name),updated_at=VALUES(updated_at)'

    const bindings = rows.flatMap((row) => [
      row.title,
      row.description,
      row.event_id,
      row.organization_id,
      row.start_at,
      row.end_at,
      row.capacity,
      row.is_recurring,
      row.recurrence_rule,
      row.template_name,
      row.locked,
      row.created_at,
      row.updated_at
    ])

    const trx = await Database.transaction()
    try {
      await trx.rawQuery(sql, bindings)
      await trx.commit()
      console.log(`ShiftSeeder: upserted ${rows.length} shifts`)
    } catch (error) {
      await trx.rollback()
      console.error('ShiftSeeder failed', error)
      throw error
    }
  }
}
