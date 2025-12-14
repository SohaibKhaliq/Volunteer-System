import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Database from '@ioc:Adonis/Lucid/Database'
import { DateTime } from 'luxon'

export default class UserAchievementsSeeder extends BaseSeeder {
  public async run() {
    const env = process.env.NODE_ENV || 'development'
    if (env !== 'development' && env !== 'test') {
      console.info(
        'UserAchievementsSeeder skipped - not running in non-development/test environment'
      )
      return
    }

    const now = DateTime.now().toSQL({ includeOffset: false })

    try {
      // Ensure tables exist before attempting to seed
      await Database.from('achievements').count('* as total')
      await Database.from('users').count('* as total')
      await Database.from('user_achievements').count('* as total')
    } catch (e) {
      console.warn('Skipping UserAchievementsSeeder: required tables missing', e?.message)
      return
    }

    try {
      // pick a handful of achievements and users to award
      const achievements = await Database.from('achievements').select('id').limit(5)
      const users = await Database.from('users').select('id').limit(10)

      if (!achievements.length || !users.length) {
        console.info('No achievements or users found; skipping user achievements seeding')
        return
      }

      for (const u of users) {
        for (const a of achievements.slice(0, 2)) {
          const exists = await Database.from('user_achievements')
            .where('user_id', u.id)
            .andWhere('achievement_id', a.id)
            .first()

          if (!exists) {
            await Database.table('user_achievements').insert({
              user_id: u.id,
              achievement_id: a.id,
              metadata: JSON.stringify({ seeded: true }),
              awarded_at: now,
              created_at: now,
              updated_at: now
            })
          }
        }
      }

      console.info('UserAchievementsSeeder: done')
    } catch (e) {
      console.warn('UserAchievementsSeeder failed', e?.message)
    }
  }
}
