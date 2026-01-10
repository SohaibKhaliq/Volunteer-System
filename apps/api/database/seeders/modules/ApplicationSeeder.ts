import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Database from '@ioc:Adonis/Lucid/Database'

export default class ApplicationSeeder extends BaseSeeder {
  public async run() {
    const RECORD_COUNT = 250 // Increased from 100

    const now = new Date()
    const timestamp = now.toISOString().slice(0, 19).replace('T', ' ')

    const usersResult = await Database.rawQuery('SELECT id FROM users ORDER BY id ASC LIMIT 300')
    const userIds = usersResult[0].map((row: any) => row.id)

    const oppsResult = await Database.rawQuery(
      'SELECT id FROM opportunities ORDER BY id ASC LIMIT 150'
    )
    const oppIds = oppsResult[0].map((row: any) => row.id)

    if (userIds.length === 0 || oppIds.length === 0) {
      console.log('ApplicationSeeder: missing users or opportunities, skipping')
      return
    }

    const statuses = ['applied', 'accepted', 'rejected', 'withdrawn']
    const statusWeights = [0.3, 0.5, 0.1, 0.1]

    const getWeightedStatus = () => {
      const random = Math.random()
      let cumulative = 0
      for (let i = 0; i < statuses.length; i++) {
        cumulative += statusWeights[i]
        if (random < cumulative) return statuses[i]
      }
      return statuses[0]
    }

    const rows: any[] = []
    const createdPairs = new Set<string>()

    let count = 0
    while (count < RECORD_COUNT) {
      const userId = userIds[Math.floor(Math.random() * userIds.length)]
      const oppId = oppIds[Math.floor(Math.random() * oppIds.length)]
      const pairKey = `${oppId}-${userId}`

      if (createdPairs.has(pairKey)) continue

      createdPairs.add(pairKey)

      const appliedDate = new Date()
      appliedDate.setDate(appliedDate.getDate() - Math.floor(Math.random() * 30))

      const status = getWeightedStatus()
      const respondedDate =
        status !== 'applied'
          ? new Date(appliedDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000)
          : null

      const notes =
        status === 'accepted'
          ? 'Strong application with relevant experience'
          : status === 'rejected'
            ? 'Position filled by another candidate'
            : status === 'withdrawn'
              ? 'Volunteer withdrew due to scheduling conflict'
              : null

      rows.push({
        opportunity_id: oppId,
        user_id: userId,
        status: status,
        applied_at: appliedDate.toISOString().slice(0, 19).replace('T', ' '),
        responded_at: respondedDate
          ? respondedDate.toISOString().slice(0, 19).replace('T', ' ')
          : null,
        notes: notes,
        created_at: timestamp,
        updated_at: timestamp
      })

      count++
    }

    if (!rows.length) {
      console.log('ApplicationSeeder: no rows to insert')
      return
    }

    const placeholders = rows.map(() => '(?,?,?,?,?,?,?,?)').join(',')
    const sql =
      'INSERT INTO applications (opportunity_id,user_id,status,applied_at,responded_at,notes,created_at,updated_at) VALUES ' +
      placeholders +
      ' ON DUPLICATE KEY UPDATE status=VALUES(status),responded_at=VALUES(responded_at),notes=VALUES(notes),updated_at=VALUES(updated_at)'

    const bindings = rows.flatMap((row) => [
      row.opportunity_id,
      row.user_id,
      row.status,
      row.applied_at,
      row.responded_at,
      row.notes,
      row.created_at,
      row.updated_at
    ])

    const trx = await Database.transaction()
    try {
      await trx.rawQuery(sql, bindings)
      await trx.commit()
      console.log(`ApplicationSeeder: upserted ${rows.length} applications`)
    } catch (error) {
      await trx.rollback()
      console.error('ApplicationSeeder failed', error)
      throw error
    }
  }
}
