import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Database from '@ioc:Adonis/Lucid/Database'

export default class UserAchievementSeeder extends BaseSeeder {
  public async run() {
    const RECORD_COUNT = 100
    const now = new Date()
    const timestamp = now.toISOString().slice(0, 19).replace('T', ' ')

    const usersResult = await Database.rawQuery('SELECT id FROM users ORDER BY id ASC LIMIT 50')
    const userIds = usersResult[0].map((row: any) => row.id)

    const achievementsResult = await Database.rawQuery('SELECT id FROM achievements ORDER BY id ASC LIMIT 30')
    const achievementIds = achievementsResult[0].map((row: any) => row.id)

    if (userIds.length === 0 || achievementIds.length === 0) {
      console.log('UserAchievementSeeder: missing users or achievements, skipping')
      return
    }

    const rows: any[] = []
    const createdPairs = new Set<string>()

    let count = 0
    while (count < RECORD_COUNT) {
      const userId = userIds[Math.floor(Math.random() * userIds.length)]
      const achievementId = achievementIds[Math.floor(Math.random() * achievementIds.length)]
      const pairKey = `${userId}-${achievementId}`

      if (createdPairs.has(pairKey)) continue
      createdPairs.add(pairKey)

      const progress = Math.floor(Math.random() * 100) + 1
      const isUnlocked = progress >= 100
      const unlockedDate = isUnlocked ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ') : null
      const grantedBy = isUnlocked && Math.random() > 0.8 ? userIds[0] : null

      rows.push({
        user_id: userId,
        achievement_id: achievementId,
        progress: progress,
        unlocked_at: unlockedDate,
        granted_by: grantedBy,
        grant_reason: grantedBy ? 'Manually awarded for exceptional contribution' : null,
        created_at: timestamp,
        updated_at: timestamp
      })

      count++
    }

    if (!rows.length) {
      console.log('UserAchievementSeeder: no rows to insert')
      return
    }

    const placeholders = rows.map(() => '(?,?,?,?,?,?,?,?)').join(',')
    const sql = 'INSERT INTO user_achievements (user_id,achievement_id,progress,unlocked_at,granted_by,grant_reason,created_at,updated_at) VALUES ' + placeholders +
      ' ON DUPLICATE KEY UPDATE progress=VALUES(progress),unlocked_at=VALUES(unlocked_at),updated_at=VALUES(updated_at)'

    const bindings = rows.flatMap((row) => [row.user_id, row.achievement_id, row.progress, row.unlocked_at, row.granted_by, row.grant_reason, row.created_at, row.updated_at])

    const trx = await Database.transaction()
    try {
      await trx.rawQuery(sql, bindings)
      await trx.commit()
      console.log(`UserAchievementSeeder: upserted ${rows.length} user achievements`)
    } catch (error) {
      await trx.rollback()
      console.error('UserAchievementSeeder failed', error)
      throw error
    }
  }
}
