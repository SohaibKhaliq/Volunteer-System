import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Database from '@ioc:Adonis/Lucid/Database'

export default class AssignmentSeeder extends BaseSeeder {
  public async run() {
    const RECORD_COUNT = 100
    const now = new Date()
    const timestamp = now.toISOString().slice(0, 19).replace('T', ' ')

    const tasksResult = await Database.rawQuery('SELECT id FROM tasks ORDER BY id ASC LIMIT 100')
    const taskIds = tasksResult[0].map((row: any) => row.id)

    const usersResult = await Database.rawQuery('SELECT id FROM users ORDER BY id ASC LIMIT 50')
    const userIds = usersResult[0].map((row: any) => row.id)

    if (taskIds.length === 0 || userIds.length === 0) {
      console.log('AssignmentSeeder: missing tasks or users, skipping')
      return
    }

    const statuses = ['assigned', 'accepted', 'declined', 'completed', 'cancelled']
    const rows: any[] = []

    for (let i = 0; i < Math.min(RECORD_COUNT, taskIds.length * 2); i++) {
      const taskId = taskIds[Math.floor(Math.random() * taskIds.length)]
      const userId = userIds[Math.floor(Math.random() * userIds.length)]
      const status = statuses[Math.floor(Math.random() * statuses.length)]

      const assignedDate = new Date()
      assignedDate.setDate(assignedDate.getDate() - Math.floor(Math.random() * 20))

      const assignedBy = Math.random() > 0.3 ? userIds[Math.floor(Math.random() * userIds.length)] : null

      rows.push({
        task_id: taskId,
        user_id: userId,
        assigned_by: assignedBy,
        status: status,
        quantity: 1,
        notes: status === 'completed' ? 'Task completed successfully' : null,
        created_at: timestamp,
        updated_at: timestamp
      })
    }

    if (!rows.length) {
      console.log('AssignmentSeeder: no rows to insert')
      return
    }

    const placeholders = rows.map(() => '(?,?,?,?,?,?,?,?)').join(',')
    const sql = 'INSERT INTO assignments (task_id,user_id,assigned_by,status,quantity,notes,created_at,updated_at) VALUES ' + placeholders

    const bindings = rows.flatMap((row) => [row.task_id, row.user_id, row.assigned_by, row.status, row.quantity, row.notes, row.created_at, row.updated_at])

    const trx = await Database.transaction()
    try {
      await trx.rawQuery(sql, bindings)
      await trx.commit()
      console.log(`AssignmentSeeder: inserted ${rows.length} task assignments`)
    } catch (error) {
      await trx.rollback()
      console.error('AssignmentSeeder failed', error)
      throw error
    }
  }
}
