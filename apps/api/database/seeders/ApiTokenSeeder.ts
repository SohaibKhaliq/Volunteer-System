import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Database from '@ioc:Adonis/Lucid/Database'

export default class ApiTokenSeeder extends BaseSeeder {
  public async run() {
    const RECORD_COUNT = 10
    const now = new Date()
    const timestamp = now.toISOString().slice(0, 19).replace('T', ' ')

    const usersResult = await Database.rawQuery('SELECT id FROM users ORDER BY id ASC LIMIT 10')
    const userIds = usersResult[0].map((row: any) => row.id)

    if (userIds.length === 0) {
      console.log('ApiTokenSeeder: no users found, skipping')
      return
    }

    const rows: any[] = []

    for (let i = 0; i < RECORD_COUNT; i++) {
      const userId = userIds[i % userIds.length]
      const tokenName = `API Token ${i + 1}`
      const token = Buffer.from(`token_${userId}_${Date.now()}_${Math.random()}`).toString('base64')

      const expiresDate = new Date()
      expiresDate.setFullYear(expiresDate.getFullYear() + 1)

      rows.push({
        user_id: userId,
        name: tokenName,
        token: token,
        type: 'api',
        expires_at: expiresDate.toISOString().slice(0, 19).replace('T', ' '),
        created_at: timestamp,
        updated_at: timestamp
      })
    }

    if (!rows.length) {
      console.log('ApiTokenSeeder: no rows to insert')
      return
    }

    const placeholders = rows.map(() => '(?,?,?,?,?,?,?)').join(',')
    const sql = 'INSERT INTO api_tokens (user_id,name,token,type,expires_at,created_at,updated_at) VALUES ' + placeholders +
      ' ON DUPLICATE KEY UPDATE updated_at=VALUES(updated_at)'

    const bindings = rows.flatMap((row) => [row.user_id, row.name, row.token, row.type, row.expires_at, row.created_at, row.updated_at])

    const trx = await Database.transaction()
    try {
      await trx.rawQuery(sql, bindings)
      await trx.commit()
      console.log(`ApiTokenSeeder: upserted ${rows.length} API tokens`)
    } catch (error) {
      await trx.rollback()
      console.error('ApiTokenSeeder failed', error)
      throw error
    }
  }
}
