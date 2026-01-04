import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Database from '@ioc:Adonis/Lucid/Database'

export default class TypeSeeder extends BaseSeeder {
  public async run() {
    const RECORD_COUNT = 20
    const now = new Date()
    const timestamp = now.toISOString().slice(0, 19).replace('T', ' ')

    const types = [
      { name: 'Transport', for_entity: 'both', icon: '🚗', category: 'logistics', description: 'Transportation and mobility assistance' },
      { name: 'Education', for_entity: 'both', icon: '📚', category: 'learning', description: 'Educational support and tutoring' },
      { name: 'Food & Meals', for_entity: 'both', icon: '🍽️', category: 'basic_needs', description: 'Food preparation and meal delivery' },
      { name: 'Home Maintenance', for_entity: 'both', icon: '🔧', category: 'practical', description: 'Home repairs and maintenance tasks' },
      { name: 'Pet Care', for_entity: 'both', icon: '🐕', category: 'care', description: 'Pet sitting, walking, and veterinary assistance' },
      { name: 'Technology', for_entity: 'both', icon: '💻', category: 'professional', description: 'Tech support and digital literacy' },
      { name: 'Companionship', for_entity: 'both', icon: '👥', category: 'social', description: 'Social visits and emotional support' },
      { name: 'Shopping', for_entity: 'both', icon: '🛒', category: 'basic_needs', description: 'Grocery shopping and errands' },
      { name: 'Healthcare', for_entity: 'request', icon: '⚕️', category: 'medical', description: 'Medical appointments and health support' },
      { name: 'Childcare', for_entity: 'both', icon: '👶', category: 'care', description: 'Babysitting and child supervision' },
      { name: 'Gardening', for_entity: 'both', icon: '🌱', category: 'practical', description: 'Garden maintenance and landscaping' },
      { name: 'Legal Advice', for_entity: 'offer', icon: '⚖️', category: 'professional', description: 'Legal consultation and advice' },
      { name: 'Financial Advice', for_entity: 'offer', icon: '💰', category: 'professional', description: 'Financial planning and budgeting help' },
      { name: 'Translation', for_entity: 'offer', icon: '🗣️', category: 'professional', description: 'Language translation services' },
      { name: 'Moving & Removals', for_entity: 'both', icon: '📦', category: 'logistics', description: 'Moving assistance and furniture removal' },
      { name: 'Emergency Assistance', for_entity: 'request', icon: '🚨', category: 'urgent', description: 'Immediate help for urgent situations' },
      { name: 'Counseling', for_entity: 'offer', icon: '💬', category: 'professional', description: 'Mental health and emotional counseling' },
      { name: 'Arts & Crafts', for_entity: 'offer', icon: '🎨', category: 'creative', description: 'Art classes and creative workshops' },
      { name: 'Music Lessons', for_entity: 'offer', icon: '🎵', category: 'creative', description: 'Music instruction and performance' },
      { name: 'Other', for_entity: 'both', icon: '📌', category: 'general', description: 'Miscellaneous volunteer activities' }
    ]

    const rows = types.slice(0, RECORD_COUNT).map((type) => ({
      name: type.name,
      for_entity: type.for_entity,
      icon: type.icon,
      category: type.category,
      description: type.description,
      is_active: 1,
      created_at: timestamp,
      updated_at: timestamp
    }))

    if (!rows.length) {
      console.log('TypeSeeder: no rows to insert')
      return
    }

    const placeholders = rows.map(() => '(?,?,?,?,?,?,?,?)').join(',')
    const sql = 'INSERT INTO types (name,for_entity,icon,category,description,is_active,created_at,updated_at) VALUES ' + placeholders +
      ' ON DUPLICATE KEY UPDATE category=VALUES(category),description=VALUES(description),is_active=VALUES(is_active),updated_at=VALUES(updated_at)'

    const bindings = rows.flatMap((row) => [row.name, row.for_entity, row.icon, row.category, row.description, row.is_active, row.created_at, row.updated_at])

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
