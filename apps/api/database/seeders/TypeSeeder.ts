import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Database from '@ioc:Adonis/Lucid/Database'

export default class TypeSeeder extends BaseSeeder {
  public async run() {
    const RECORD_COUNT = 20
    const now = new Date()
    const timestamp = now.toISOString().slice(0, 19).replace('T', ' ')

    const types = [
      { name: 'Transport', for_entity: 'both', icon: '🚗' },
      { name: 'Education', for_entity: 'both', icon: '📚' },
      { name: 'Food & Meals', for_entity: 'both', icon: '🍽️' },
      { name: 'Home Maintenance', for_entity: 'both', icon: '🔧' },
      { name: 'Pet Care', for_entity: 'both', icon: '🐕' },
      { name: 'Technology', for_entity: 'both', icon: '💻' },
      { name: 'Companionship', for_entity: 'both', icon: '👥' },
      { name: 'Shopping', for_entity: 'both', icon: '🛒' },
      { name: 'Healthcare', for_entity: 'request', icon: '⚕️' },
      { name: 'Childcare', for_entity: 'both', icon: '👶' },
      { name: 'Gardening', for_entity: 'both', icon: '🌱' },
      { name: 'Legal Advice', for_entity: 'offer', icon: '⚖️' },
      { name: 'Financial Advice', for_entity: 'offer', icon: '💰' },
      { name: 'Translation', for_entity: 'offer', icon: '🗣️' },
      { name: 'Moving & Removals', for_entity: 'both', icon: '📦' },
      { name: 'Emergency Assistance', for_entity: 'request', icon: '🚨' },
      { name: 'Counseling', for_entity: 'offer', icon: '💬' },
      { name: 'Arts & Crafts', for_entity: 'offer', icon: '🎨' },
      { name: 'Music Lessons', for_entity: 'offer', icon: '🎵' },
      { name: 'Other', for_entity: 'both', icon: '📌' }
    ]

    const rows = types.slice(0, RECORD_COUNT).map((type) => ({
      name: type.name,
      for_entity: type.for_entity,
      icon: type.icon,
      is_active: 1,
      created_at: timestamp,
      updated_at: timestamp
    }))

    if (!rows.length) {
      console.log('TypeSeeder: no rows to insert')
      return
    }

    const placeholders = rows.map(() => '(?,?,?,?,?,?)').join(',')
    const sql = 'INSERT INTO types (name,for_entity,icon,is_active,created_at,updated_at) VALUES ' + placeholders +
      ' ON DUPLICATE KEY UPDATE is_active=VALUES(is_active),updated_at=VALUES(updated_at)'

    const bindings = rows.flatMap((row) => [row.name, row.for_entity, row.icon, row.is_active, row.created_at, row.updated_at])

    const trx = await Database.transaction()
    try {
      await trx.rawQuery(sql, bindings)
      await trx.commit()
      console.log(`TypeSeeder: upserted ${rows.length} types`)
    } catch (error) {
      await trx.rollback()
      console.error('TypeSeeder failed', error)
      throw error
    }
  }
}
