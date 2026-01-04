import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Database from '@ioc:Adonis/Lucid/Database'

export default class AuditLogSeeder extends BaseSeeder {
  public async run() {
    const RECORD_COUNT = 200


    const usersResult = await Database.rawQuery('SELECT id FROM users ORDER BY id ASC LIMIT 50')
    const userIds = usersResult[0].map((row: any) => row.id)

    if (userIds.length === 0) {
      console.log('AuditLogSeeder: no users found, skipping')
      return
    }

    const actions = ['create', 'update', 'delete', 'login', 'logout', 'approve', 'reject', 'assign', 'unassign']
    const entities = ['user', 'organization', 'event', 'opportunity', 'resource', 'shift', 'application', 'task']
    const rows: any[] = []

    for (let i = 0; i < RECORD_COUNT; i++) {
      const userId = userIds[Math.floor(Math.random() * userIds.length)]
      const action = actions[Math.floor(Math.random() * actions.length)]
      const entity = entities[Math.floor(Math.random() * entities.length)]

      const actionDate = new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000)

      rows.push({
        user_id: userId,
        action: action,
        entity_type: entity,
        entity_id: Math.floor(Math.random() * 100) + 1,
        description: `User ${action}d ${entity} successfully`,
        ip_address: `192.168.1.${Math.floor(Math.random() * 255)}`,
        user_agent: 'Mozilla/5.0',
        old_values: action === 'update' ? JSON.stringify({ status: 'pending' }) : null,
        new_values: action === 'update' ? JSON.stringify({ status: 'approved' }) : null,
        created_at: actionDate.toISOString().slice(0, 19).replace('T', ' '),
        updated_at: actionDate.toISOString().slice(0, 19).replace('T', ' ')
      })
    }

    if (!rows.length) {
      console.log('AuditLogSeeder: no rows to insert')
      return
    }

    const placeholders = rows.map(() => '(?,?,?,?,?,?,?,?,?,?,?)').join(',')
    const sql = 'INSERT INTO audit_logs (user_id,action,entity_type,entity_id,description,ip_address,user_agent,old_values,new_values,created_at,updated_at) VALUES ' + placeholders

    const bindings = rows.flatMap((row) => [row.user_id, row.action, row.entity_type, row.entity_id, row.description, row.ip_address, row.user_agent, row.old_values, row.new_values, row.created_at, row.updated_at])

    const trx = await Database.transaction()
    try {
      await trx.rawQuery(sql, bindings)
      await trx.commit()
      console.log(`AuditLogSeeder: inserted ${rows.length} audit logs`)
    } catch (error) {
      await trx.rollback()
      console.error('AuditLogSeeder failed', error)
      throw error
    }
  }
}
