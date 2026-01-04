import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Database from '@ioc:Adonis/Lucid/Database'

export default class ShiftAssignmentSeeder extends BaseSeeder {
  public async run() {
    const RECORD_COUNT = 150
    const now = new Date()
    const timestamp = now.toISOString().slice(0, 19).replace('T', ' ').slice(0, 19).replace('T', ' ')

    const shiftsResult = await Database.rawQuery('SELECT id FROM shifts ORDER BY id ASC LIMIT 50')
    const shiftIds = shiftsResult[0].map((row: any) => row.id)

    const usersResult = await Database.rawQuery('SELECT id FROM users ORDER BY id ASC LIMIT 50')
    const userIds = usersResult[0].map((row: any) => row.id)

    const tasksResult = await Database.rawQuery('SELECT id FROM shift_tasks ORDER BY id ASC LIMIT 100')
    const taskIds = tasksResult[0].map((row: any) => row.id)

    if (shiftIds.length === 0 || userIds.length === 0) {
      console.log('ShiftAssignmentSeeder: missing shifts or users, skipping')
      return
    }

    const statuses = ['scheduled', 'confirmed', 'completed', 'no_show', 'cancelled']
    const rows: any[] = []

    for (let i = 0; i < RECORD_COUNT; i++) {
      const shiftId = shiftIds[Math.floor(Math.random() * shiftIds.length)]
      const userId = userIds[Math.floor(Math.random() * userIds.length)]
      const taskId = taskIds.length > 0 ? taskIds[Math.floor(Math.random() * taskIds.length)] : null
      const assignedBy = userIds[Math.floor(Math.random() * Math.min(5, userIds.length))]

      const status = statuses[Math.floor(Math.random() * statuses.length)]

      let checkedInAt: string | null = null
      let checkedOutAt: string | null = null
      let hours: number | null = null

      if (status === 'completed') {
        const checkIn = new Date()
        checkIn.setDate(checkIn.getDate() - Math.floor(Math.random() * 15))
        checkedInAt = checkIn.toISOString().slice(0, 19).replace('T', ' ')

        const checkOut = new Date(checkIn)
        const shiftHours = Math.floor(Math.random() * 6) + 2
        checkOut.setHours(checkOut.getHours() + shiftHours)
        checkedOutAt = checkOut.toISOString().slice(0, 19).replace('T', ' ')
        hours = shiftHours
      }

      rows.push({
        shift_id: shiftId,
        task_id: taskId,
        user_id: userId,
        assigned_by: assignedBy,
        status: status,
        checked_in_at: checkedInAt,
        checked_out_at: checkedOutAt,
        hours: hours,
        created_at: timestamp,
        updated_at: timestamp
      })
    }

    if (!rows.length) {
      console.log('ShiftAssignmentSeeder: no rows to insert')
      return
    }

    const placeholders = rows.map(() => '(?,?,?,?,?,?,?,?,?,?)').join(',')
    const sql = 'INSERT INTO shift_assignments (shift_id,task_id,user_id,assigned_by,status,checked_in_at,checked_out_at,hours,created_at,updated_at) VALUES ' + placeholders

    const bindings = rows.flatMap((row) => [row.shift_id, row.task_id, row.user_id, row.assigned_by, row.status, row.checked_in_at, row.checked_out_at, row.hours, row.created_at, row.updated_at])

    const trx = await Database.transaction()
    try {
      await trx.rawQuery(sql, bindings)
      await trx.commit()
      console.log(`ShiftAssignmentSeeder: inserted ${rows.length} shift assignments`)
    } catch (error) {
      await trx.rollback()
      console.error('ShiftAssignmentSeeder failed', error)
      throw error
    }
  }
}
