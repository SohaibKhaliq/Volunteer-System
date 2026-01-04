import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Database from '@ioc:Adonis/Lucid/Database'

export default class ResourceAssignmentSeeder extends BaseSeeder {
  public async run() {
    const RECORD_COUNT = 100
    const now = new Date()
    const timestamp = now.toISOString().slice(0, 19).replace('T', ' ')

    const resourcesResult = await Database.rawQuery('SELECT id FROM resources ORDER BY id ASC LIMIT 50')
    const resourceIds = resourcesResult[0].map((row: any) => row.id)

    const eventsResult = await Database.rawQuery('SELECT id FROM events ORDER BY id ASC LIMIT 50')
    const eventIds = eventsResult[0].map((row: any) => row.id)

    if (resourceIds.length === 0 || eventIds.length === 0) {
      console.log('ResourceAssignmentSeeder: missing resources or events, skipping')
      return
    }

    const statuses = ['assigned', 'in_use', 'returned']
    const rows: any[] = []

    for (let i = 0; i < RECORD_COUNT; i++) {
      const resourceId = resourceIds[Math.floor(Math.random() * resourceIds.length)]
      const eventId = eventIds[Math.floor(Math.random() * eventIds.length)]
      
      const assignedDate = new Date()
      assignedDate.setDate(assignedDate.getDate() - Math.floor(Math.random() * 30))
      
      const expectedReturnDate = new Date(assignedDate)
      expectedReturnDate.setDate(expectedReturnDate.getDate() + Math.floor(Math.random() * 7) + 1)
      
      const status = statuses[Math.floor(Math.random() * statuses.length)]
      const returnedDate = status === 'returned' ? new Date(expectedReturnDate.getTime() + Math.random() * 2 * 24 * 60 * 60 * 1000) : null

      rows.push({
        resource_id: resourceId,
        assignment_type: 'event',
        related_id: eventId,
        assigned_at: assignedDate.toISOString().slice(0, 19).replace('T', ' '),
        expected_return_at: expectedReturnDate.toISOString().slice(0, 19).replace('T', ' '),
        returned_at: returnedDate ? returnedDate.toISOString().slice(0, 19).replace('T', ' ') : null,
        status: status,
        notes: 'Assigned for event use',
        created_at: timestamp,
        updated_at: timestamp
      })
    }

    if (!rows.length) {
      console.log('ResourceAssignmentSeeder: no rows to insert')
      return
    }

    const placeholders = rows.map(() => '(?,?,?,?,?,?,?,?,?,?)').join(',')
    const sql = 'INSERT INTO resource_assignments (resource_id,assignment_type,related_id,assigned_at,expected_return_at,returned_at,status,notes,created_at,updated_at) VALUES ' + placeholders

    const bindings = rows.flatMap((row) => [row.resource_id, row.assignment_type, row.related_id, row.assigned_at, row.expected_return_at, row.returned_at, row.status, row.notes, row.created_at, row.updated_at])

    const trx = await Database.transaction()
    try {
      await trx.rawQuery(sql, bindings)
      await trx.commit()
      console.log(`ResourceAssignmentSeeder: inserted ${rows.length} resource assignments`)
    } catch (error) {
      await trx.rollback()
      console.error('ResourceAssignmentSeeder failed', error)
      throw error
    }
  }
}
