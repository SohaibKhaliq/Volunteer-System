import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Database from '@ioc:Adonis/Lucid/Database'

export default class UserBadgeSeeder extends BaseSeeder {
  public async run() {
    const RECORD_COUNT = 80
    const now = new Date()
    const timestamp = now.toISOString().slice(0, 19).replace('T', ' ')

    const usersResult = await Database.rawQuery('SELECT id FROM users ORDER BY id ASC LIMIT 50')
    const userIds = usersResult[0].map((row: any) => row.id)

    const badgesResult = await Database.rawQuery('SELECT id FROM gamification_badges ORDER BY id ASC LIMIT 25')
    const badgeIds = badgesResult[0].map((row: any) => row.id)

    if (userIds.length === 0 || badgeIds.length === 0) {
      console.log('UserBadgeSeeder: missing users or badges, skipping')
      return
    }

    const rows: any[] = []
    const createdPairs = new Set<string>()

    let count = 0
    while (count < RECORD_COUNT) {
      const userId = userIds[Math.floor(Math.random() * userIds.length)]
      const badgeId = badgeIds[Math.floor(Math.random() * badgeIds.length)]
      const pairKey = `${userId}-${badgeId}`

      if (createdPairs.has(pairKey)) continue
      createdPairs.add(pairKey)

      const awardedDate = new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000)
      const awardedBy = Math.random() > 0.7 ? userIds[0] : null

      rows.push({
        user_id: userId,
        badge_id: badgeId,
        awarded_at: awardedDate.toISOString().slice(0, 19).replace('T', ' '),
        awarded_by: awardedBy,
        award_reason: awardedBy ? 'Exceptional contribution to the organization' : null,
        created_at: timestamp,
        updated_at: timestamp
      })

      count++
    }

    if (!rows.length) {
      console.log('UserBadgeSeeder: no rows to insert')
      return
    }

    const placeholders = rows.map(() => '(?,?,?,?,?,?,?)').join(',')
    const sql = 'INSERT INTO user_badges (user_id,badge_id,awarded_at,awarded_by,award_reason,created_at,updated_at) VALUES ' + placeholders +
      ' ON DUPLICATE KEY UPDATE awarded_at=VALUES(awarded_at),updated_at=VALUES(updated_at)'

    const bindings = rows.flatMap((row) => [row.user_id, row.badge_id, row.awarded_at, row.awarded_by, row.award_reason, row.created_at, row.updated_at])

    const trx = await Database.transaction()
    try {
      await trx.rawQuery(sql, bindings)
      await trx.commit()
      console.log(`UserBadgeSeeder: upserted ${rows.length} user badges`)
    } catch (error) {
      await trx.rollback()
      console.error('UserBadgeSeeder failed', error)
      throw error
    }
  }
}
