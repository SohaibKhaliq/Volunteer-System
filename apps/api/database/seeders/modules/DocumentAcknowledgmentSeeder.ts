import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Database from '@ioc:Adonis/Lucid/Database'

export default class DocumentAcknowledgmentSeeder extends BaseSeeder {
  public async run() {
    const RECORD_COUNT = 100
    const now = new Date()
    const timestamp = now.toISOString().slice(0, 19).replace('T', ' ').slice(0, 19).replace('T', ' ')

    const docsResult = await Database.rawQuery('SELECT id FROM documents WHERE requires_acknowledgment = 1 ORDER BY id ASC LIMIT 50')
    const docIds = docsResult[0].map((row: any) => row.id)

    const usersResult = await Database.rawQuery('SELECT id FROM users ORDER BY id ASC LIMIT 50')
    const userIds = usersResult[0].map((row: any) => row.id)

    if (docIds.length === 0 || userIds.length === 0) {
      console.log('DocumentAcknowledgmentSeeder: missing documents or users, skipping')
      return
    }

    const rows: any[] = []
    const createdPairs = new Set<string>()

    let count = 0
    while (count < RECORD_COUNT) {
      const userId = userIds[Math.floor(Math.random() * userIds.length)]
      const docId = docIds[Math.floor(Math.random() * docIds.length)]
      const pairKey = `${userId}-${docId}`

      if (createdPairs.has(pairKey)) continue
      createdPairs.add(pairKey)

      const acknowledgedDate = new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ')

      rows.push({
        user_id: userId,
        document_id: docId,
        acknowledged_at: acknowledgedDate,
        ip_address: `192.168.1.${Math.floor(Math.random() * 255)}`,
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        created_at: timestamp,
        updated_at: timestamp
      })

      count++
    }

    if (!rows.length) {
      console.log('DocumentAcknowledgmentSeeder: no rows to insert')
      return
    }

    const placeholders = rows.map(() => '(?,?,?,?,?,?,?)').join(',')
    const sql = 'INSERT INTO document_acknowledgments (user_id,document_id,acknowledged_at,ip_address,user_agent,created_at,updated_at) VALUES ' + placeholders +
      ' ON DUPLICATE KEY UPDATE acknowledged_at=VALUES(acknowledged_at),updated_at=VALUES(updated_at)'

    const bindings = rows.flatMap((row) => [row.user_id, row.document_id, row.acknowledged_at, row.ip_address, row.user_agent, row.created_at, row.updated_at])

    const trx = await Database.transaction()
    try {
      await trx.rawQuery(sql, bindings)
      await trx.commit()
      console.log(`DocumentAcknowledgmentSeeder: upserted ${rows.length} document acknowledgments`)
    } catch (error) {
      await trx.rollback()
      console.error('DocumentAcknowledgmentSeeder failed', error)
      throw error
    }
  }
}
