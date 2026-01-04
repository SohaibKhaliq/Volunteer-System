import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Database from '@ioc:Adonis/Lucid/Database'

export default class BackgroundCheckSeeder extends BaseSeeder {
  public async run() {
    const RECORD_COUNT = 50
    const now = new Date()
    const timestamp = now.toISOString()

    const usersResult = await Database.rawQuery('SELECT id FROM users ORDER BY id ASC LIMIT 50')
    const userIds = usersResult[0].map((row: any) => row.id)

    if (userIds.length === 0) {
      console.log('BackgroundCheckSeeder: no users found, skipping')
      return
    }

    const checkTypes = ['police_check', 'working_with_children', 'reference_check', 'identity_verification']
    const statuses = ['pending', 'in_progress', 'approved', 'rejected', 'expired']
    const rows: any[] = []

    for (let i = 0; i < RECORD_COUNT; i++) {
      const userId = userIds[i % userIds.length]
      const checkType = checkTypes[i % checkTypes.length]
      const status = statuses[Math.floor(Math.random() * statuses.length)]

      const issuedDate = new Date()
      issuedDate.setDate(issuedDate.getDate() - Math.floor(Math.random() * 365))

      const expiryDate = new Date(issuedDate)
      if (checkType === 'police_check') {
        expiryDate.setFullYear(expiryDate.getFullYear() + 3)
      } else if (checkType === 'working_with_children') {
        expiryDate.setFullYear(expiryDate.getFullYear() + 5)
      } else {
        expiryDate.setFullYear(expiryDate.getFullYear() + 1)
      }

      rows.push({
        user_id: userId,
        check_type: checkType,
        status: status,
        issued_at: status === 'approved' ? issuedDate.toISOString() : null,
        expires_at: status === 'approved' ? expiryDate.toISOString() : null,
        reference_number: status === 'approved' ? `CHECK-${userId}-${Date.now().toString().slice(-6)}` : null,
        notes: status === 'rejected' ? 'Additional information required' : null,
        created_at: timestamp,
        updated_at: timestamp
      })
    }

    if (!rows.length) {
      console.log('BackgroundCheckSeeder: no rows to insert')
      return
    }

    const placeholders = rows.map(() => '(?,?,?,?,?,?,?,?,?)').join(',')
    const sql = 'INSERT INTO background_checks (user_id,check_type,status,issued_at,expires_at,reference_number,notes,created_at,updated_at) VALUES ' + placeholders +
      ' ON DUPLICATE KEY UPDATE status=VALUES(status),issued_at=VALUES(issued_at),expires_at=VALUES(expires_at),updated_at=VALUES(updated_at)'

    const bindings = rows.flatMap((row) => [row.user_id, row.check_type, row.status, row.issued_at, row.expires_at, row.reference_number, row.notes, row.created_at, row.updated_at])

    const trx = await Database.transaction()
    try {
      await trx.rawQuery(sql, bindings)
      await trx.commit()
      console.log(`BackgroundCheckSeeder: upserted ${rows.length} background checks`)
    } catch (error) {
      await trx.rollback()
      console.error('BackgroundCheckSeeder failed', error)
      throw error
    }
  }
}
