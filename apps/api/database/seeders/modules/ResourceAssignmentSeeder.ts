import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Database from '@ioc:Adonis/Lucid/Database'

export default class ResourceAssignmentSeeder extends BaseSeeder {
  public async run() {
    const RECORD_COUNT = 80
    const now = new Date()
    const timestamp = now.toISOString().slice(0, 19).replace('T', ' ')

    const resourcesResult = await Database.rawQuery(
      'SELECT id, quantity_total, quantity_available FROM resources ORDER BY id ASC'
    )
    const resources = resourcesResult[0].map((row: any) => ({
      id: row.id,
      quantity_total: row.quantity_total,
      quantity_available: row.quantity_available
    }))

    const eventsResult = await Database.rawQuery('SELECT id FROM events ORDER BY id ASC LIMIT 100')
    const eventIds = eventsResult[0].map((row: any) => row.id)

    if (resources.length === 0 || eventIds.length === 0) {
      console.log('ResourceAssignmentSeeder: missing resources or events, skipping')
      return
    }

    const statuses = ['assigned', 'in_use', 'returned']
    const rows: any[] = []
    const resourceUpdates: Record<number, number> = {}

    for (let i = 0; i < RECORD_COUNT; i++) {
      const resource = resources[Math.floor(Math.random() * resources.length)]
      const eventId = eventIds[Math.floor(Math.random() * eventIds.length)]

      // Only assign if resource has available quantity
      if (resource.quantity_available <= 0) continue

      const assignedDate = new Date()
      assignedDate.setDate(assignedDate.getDate() - Math.floor(Math.random() * 30))

      const expectedReturnDate = new Date(assignedDate)
      expectedReturnDate.setDate(expectedReturnDate.getDate() + Math.floor(Math.random() * 7) + 1)

      const status = statuses[Math.floor(Math.random() * statuses.length)]
      const returnedDate =
        status === 'returned'
          ? new Date(expectedReturnDate.getTime() + Math.random() * 2 * 24 * 60 * 60 * 1000)
          : null

      rows.push({
        resource_id: resource.id,
        assignment_type: 'event',
        related_id: eventId,
        assigned_at: assignedDate.toISOString().slice(0, 19).replace('T', ' '),
        expected_return_at: expectedReturnDate.toISOString().slice(0, 19).replace('T', ' '),
        returned_at: returnedDate
          ? returnedDate.toISOString().slice(0, 19).replace('T', ' ')
          : null,
        status: status,
        notes: 'Assigned for event use',
        created_at: timestamp,
        updated_at: timestamp
      })

      // Track quantity reduction - only for active assignments (not returned)
      if (status !== 'returned') {
        resourceUpdates[resource.id] = (resourceUpdates[resource.id] || 0) + 1
        resource.quantity_available -= 1 // Prevent over-assignment
      }
    }

    if (!rows.length) {
      console.log('ResourceAssignmentSeeder: no rows to insert')
      return
    }

    const trx = await Database.transaction()
    try {
      // Delete existing assignments to avoid duplicates
      await trx.rawQuery('DELETE FROM resource_assignments')

      // Insert assignments in batches
      const batchSize = 10
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize)

        const placeholders = batch.map(() => '(?,?,?,?,?,?,?,?,?,?)').join(',')
        const sql =
          'INSERT INTO resource_assignments (resource_id,assignment_type,related_id,assigned_at,expected_return_at,returned_at,status,notes,created_at,updated_at) VALUES ' +
          placeholders

        const bindings: any[] = []
        for (const row of batch) {
          bindings.push(
            row.resource_id,
            row.assignment_type,
            row.related_id,
            row.assigned_at,
            row.expected_return_at,
            row.returned_at,
            row.status,
            row.notes,
            row.created_at,
            row.updated_at
          )
        }

        await trx.rawQuery(sql, bindings)
      }

      // Update resource quantities
      for (const [resourceId, reduction] of Object.entries(resourceUpdates)) {
        await trx.rawQuery(
          'UPDATE resources SET quantity_available = GREATEST(0, quantity_available - ?), status = ? WHERE id = ?',
          [reduction, 'reserved', resourceId]
        )
      }

      await trx.commit()
      console.log(
        `ResourceAssignmentSeeder: inserted ${rows.length} resource assignments and updated quantities`
      )
    } catch (error) {
      await trx.rollback()
      console.error('ResourceAssignmentSeeder failed', error)
      throw error
    }
  }
}
