import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Database from '@ioc:Adonis/Lucid/Database'

export default class HelpRequestSeeder extends BaseSeeder {
  public async run() {
    const RECORD_COUNT = 30
    const now = new Date()
    const timestamp = now.toISOString().slice(0, 19).replace('T', ' ')

    const usersResult = await Database.rawQuery('SELECT id FROM users ORDER BY id ASC LIMIT 50')
    const userIds = usersResult[0].map((row: any) => row.id)

    if (userIds.length === 0) {
      console.log('HelpRequestSeeder: no users found, skipping')
      return
    }

    const requests = [
      { title: 'Need help moving furniture', description: 'Looking for 2-3 volunteers to help move furniture', urgency: 'medium' },
      { title: 'Tutoring assistance needed', description: 'Need help with math tutoring for high school student', urgency: 'low' },
      { title: 'Emergency food delivery', description: 'Urgent food delivery needed for elderly resident', urgency: 'high' },
      { title: 'Garden maintenance help', description: 'Help needed with community garden maintenance', urgency: 'low' },
      { title: 'Pet care during hospital stay', description: 'Looking for someone to care for my dog while in hospital', urgency: 'high' },
      { title: 'Transport to medical appointment', description: 'Need ride to doctor appointment next week', urgency: 'medium' },
      { title: 'House cleaning assistance', description: 'Elderly person needs help with house cleaning', urgency: 'medium' },
      { title: 'Tech support needed', description: 'Help setting up computer and internet', urgency: 'low' },
      { title: 'Meal preparation help', description: 'Need assistance preparing meals for the week', urgency: 'medium' },
      { title: 'Shopping assistance', description: 'Help needed with grocery shopping',urgency: 'medium' }
    ]

    const statuses = ['open', 'in_progress', 'completed', 'cancelled']
    const rows: any[] = []

    for (let i = 0; i < RECORD_COUNT; i++) {
      const request = requests[i % requests.length]
      const userId = userIds[Math.floor(Math.random() * userIds.length)]
      const status = statuses[Math.floor(Math.random() * statuses.length)]

      const createdDate = new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000)

      rows.push({
        user_id: userId,
        name: request.title,
        description: request.description,
        urgency: request.urgency,
        status: status,
        address: 'Sydney, NSW',
        phone: '+61 4' + String(Math.floor(Math.random() * 100000000)).padStart(8, '0'),
        created_at: createdDate.toISOString().slice(0, 19).replace('T', ' '),
        updated_at: timestamp
      })
    }

    if (!rows.length) {
      console.log('HelpRequestSeeder: no rows to insert')
      return
    }

    const placeholders = rows.map(() => '(?,?,?,?,?,?,?,?,?)').join(',')
    const sql = 'INSERT INTO help_requests (user_id,name,description,urgency,status,address,phone,created_at,updated_at) VALUES ' + placeholders +
      ' ON DUPLICATE KEY UPDATE status=VALUES(status),updated_at=VALUES(updated_at)'

    const bindings = rows.flatMap((row) => [row.user_id, row.name, row.description, row.urgency, row.status, row.address, row.phone, row.created_at, row.updated_at])

    const trx = await Database.transaction()
    try {
      await trx.rawQuery(sql, bindings)
      await trx.commit()
      console.log(`HelpRequestSeeder: upserted ${rows.length} help requests`)
    } catch (error) {
      await trx.rollback()
      console.error('HelpRequestSeeder failed', error)
      throw error
    }
  }
}
