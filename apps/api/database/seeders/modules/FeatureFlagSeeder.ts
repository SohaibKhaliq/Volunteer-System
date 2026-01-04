import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Database from '@ioc:Adonis/Lucid/Database'

export default class extends BaseSeeder {
  public async run() {
    const flags = [
      {
        key: 'enable_volunteer_matching',
        description: 'Enable AI-powered volunteer-opportunity matching',
        enabled: true,
        conditions: JSON.stringify({ min_profile_completion: 80 })
      },
      {
        key: 'enable_gamification',
        description: 'Enable badges, achievements, and leaderboards',
        enabled: true,
        conditions: null
      },
      {
        key: 'enable_carpooling',
        description: 'Enable carpooling feature for events',
        enabled: true,
        conditions: null
      },
      {
        key: 'enable_background_checks',
        description: 'Require background checks for sensitive opportunities',
        enabled: false,
        conditions: JSON.stringify({ opportunity_types: ['children', 'vulnerable'] })
      },
      {
        key: 'enable_sms_notifications',
        description: 'Enable SMS notifications in addition to email',
        enabled: false,
        conditions: JSON.stringify({ max_daily_sms: 3 })
      },
      {
        key: 'enable_advanced_analytics',
        description: 'Enable advanced analytics dashboard for organizations',
        enabled: true,
        conditions: JSON.stringify({ min_volunteers: 10 })
      },
      {
        key: 'enable_volunteer_hours_auto_approval',
        description: 'Automatically approve volunteer hours under certain conditions',
        enabled: false,
        conditions: JSON.stringify({ max_hours: 4, trusted_volunteers_only: true })
      },
      {
        key: 'enable_multi_language',
        description: 'Enable multi-language support',
        enabled: false,
        conditions: JSON.stringify({ supported_languages: ['en', 'es', 'zh'] })
      },
      {
        key: 'maintenance_mode',
        description: 'Put the system in maintenance mode',
        enabled: false,
        conditions: JSON.stringify({ allowed_ips: ['127.0.0.1'] })
      },
      {
        key: 'enable_event_livestream',
        description: 'Enable livestreaming for virtual events',
        enabled: true,
        conditions: null
      }
    ]

    // Check if any flags already exist
    const existingCount = await Database.from('feature_flags').count('* as total')
    
    if (existingCount[0].total > 0) {
      console.log('Feature flags already seeded, skipping...')
      return
    }

    await Database.table('feature_flags').multiInsert(
      flags.map(flag => ({
        ...flag,
        created_at: new Date(),
        updated_at: new Date()
      }))
    )

    console.log(`✓ Seeded ${flags.length} feature flags`)
  }
}
