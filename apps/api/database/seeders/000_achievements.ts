import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Achievement from 'App/Models/Achievement'

export default class AchievementSeeder extends BaseSeeder {
  public async run() {
    // Create global default achievements if they don't exist
    const defaults = [
      {
        key: 'early-adopter',
        title: 'Early Adopter',
        description: 'Joined the platform 2+ years ago',
        criteria: { type: 'member_days', threshold: 730 },
        points: 50,
        isEnabled: true
      },
      {
        key: '50-hours',
        title: '50 Hours Club',
        description: 'Contributed 50+ approved volunteering hours',
        criteria: { type: 'hours', threshold: 50 },
        points: 100,
        isEnabled: true
      },
      {
        key: 'eco-warrior',
        title: 'Eco Warrior',
        description: 'Attended 5+ distinct events',
        criteria: { type: 'events', threshold: 5 },
        points: 75,
        isEnabled: true
      }
    ]

    for (const def of defaults) {
      const existing = await Achievement.findBy('key', def.key)
      if (!existing) {
        await Achievement.create(def)
      }
    }
  }
}
