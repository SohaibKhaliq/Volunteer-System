import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Database from '@ioc:Adonis/Lucid/Database'

export default class SystemSettingSeeder extends BaseSeeder {
  public async run() {
    const RECORD_COUNT = 30
    const now = new Date()
    const timestamp = now.toISOString().slice(0, 19).replace('T', ' ')

    const settings = [
      { key: 'app_name', value: 'Volunteer Management System', type: 'string', category: 'general' },
      { key: 'app_timezone', value: 'Australia/Sydney', type: 'string', category: 'general' },
      { key: 'app_locale', value: 'en_AU', type: 'string', category: 'general' },
      { key: 'volunteer_approval_required', value: 'true', type: 'boolean', category: 'volunteers' },
      { key: 'event_auto_publish', value: 'false', type: 'boolean', category: 'events' },
      { key: 'max_upload_size_mb', value: '10', type: 'number', category: 'files' },
      { key: 'session_timeout_minutes', value: '60', type: 'number', category: 'security' },
      { key: 'email_notifications_enabled', value: 'true', type: 'boolean', category: 'notifications' },
      { key: 'sms_notifications_enabled', value: 'false', type: 'boolean', category: 'notifications' },
      { key: 'maintenance_mode', value: 'false', type: 'boolean', category: 'system' },
      { key: 'registration_open', value: 'true', type: 'boolean', category: 'volunteers' },
      { key: 'max_volunteers_per_event', value: '100', type: 'number', category: 'events' },
      { key: 'background_check_required', value: 'true', type: 'boolean', category: 'compliance' },
      { key: 'min_volunteer_age', value: '16', type: 'number', category: 'volunteers' },
      { key: 'currency', value: 'AUD', type: 'string', category: 'general' },
      { key: 'date_format', value: 'DD/MM/YYYY', type: 'string', category: 'general' },
      { key: 'time_format', value: '24h', type: 'string', category: 'general' },
      { key: 'enable_gamification', value: 'true', type: 'boolean', category: 'features' },
      { key: 'enable_resources', value: 'true', type: 'boolean', category: 'features' },
      { key: 'enable_shifts', value: 'true', type: 'boolean', category: 'features' },
      // Branding
      { key: 'platform_name', value: 'Eghata Volunteer System', type: 'string', category: 'branding' },
      { key: 'platform_tagline', value: 'Connecting volunteers with opportunities', type: 'string', category: 'branding' },
      { key: 'primary_color', value: '#3B82F6', type: 'string', category: 'branding' },
      { key: 'secondary_color', value: '#10B981', type: 'string', category: 'branding' },
      { key: 'logo_url', value: '', type: 'string', category: 'branding' },
      { key: 'favicon_url', value: '', type: 'string', category: 'branding' },
      // System Extensions
      { key: 'support_email', value: 'support@eghata.gov.au', type: 'string', category: 'system' },
      { key: 'maintenance_message', value: 'System is under maintenance. Please check back later.', type: 'string', category: 'system' }
    ]

    const rows = settings.slice(0, RECORD_COUNT).map((setting) => ({
      key: setting.key,
      value: setting.value,
      type: setting.type,
      category: setting.category,
      is_editable: 1,
      created_at: timestamp,
      updated_at: timestamp
    }))

    if (!rows.length) {
      console.log('SystemSettingSeeder: no rows to insert')
      return
    }

    const placeholders = rows.map(() => '(?,?,?,?,?,?,?)').join(',')
    const sql = 'INSERT INTO system_settings (`key`,`value`,type,category,is_editable,created_at,updated_at) VALUES ' + placeholders +
      ' ON DUPLICATE KEY UPDATE `value`=VALUES(`value`),updated_at=VALUES(updated_at)'

    const bindings = rows.flatMap((row) => [row.key, row.value, row.type, row.category, row.is_editable, row.created_at, row.updated_at])

    const trx = await Database.transaction()
    try {
      await trx.rawQuery(sql, bindings)
      await trx.commit()
      console.log(`SystemSettingSeeder: upserted ${rows.length} system settings`)
    } catch (error) {
      await trx.rollback()
      console.error('SystemSettingSeeder failed', error)
      throw error
    }
  }
}
