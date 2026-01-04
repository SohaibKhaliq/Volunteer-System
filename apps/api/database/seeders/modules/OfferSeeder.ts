import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Database from '@ioc:Adonis/Lucid/Database'

export default class OfferSeeder extends BaseSeeder {
  public async run() {
    const RECORD_COUNT = 30
    const now = new Date()
    const timestamp = now.toISOString().slice(0, 19).replace('T', ' ')

    const usersResult = await Database.rawQuery('SELECT id FROM users ORDER BY id ASC LIMIT 50')
    const userIds = usersResult[0].map((row: any) => row.id)

    if (userIds.length === 0) {
      console.log('OfferSeeder: no users found, skipping')
      return
    }

    const offers = [
      { title: 'Can help with moving', description: 'Have a van, can help people move', category: 'transport' },
      { title: 'Math tutoring available', description: 'Qualified teacher offering free math tutoring', category: 'education' },
      { title: 'Meal delivery service', description: 'Can deliver meals to elderly or disabled', category: 'food' },
      { title: 'Garden maintenance', description: 'Experienced gardener offering free help', category: 'maintenance' },
      { title: 'Pet sitting services', description: 'Love animals, happy to pet sit', category: 'pets' },
      { title: 'Free computer lessons', description: 'Teaching seniors how to use computers', category: 'technology' },
      { title: 'Home repairs', description: 'Handyman offering free minor repairs', category: 'maintenance' },
      { title: 'Language lessons', description: 'Native Spanish speaker offering lessons', category: 'education' },
      { title: 'Grocery shopping help', description: 'Can help with grocery shopping', category: 'shopping' },
      { title: 'Reading companion', description: 'Will read to visually impaired persons', category: 'companionship' }
    ]

    const statuses = ['available', 'unavailable', 'fulfilled']
    const rows: any[] = []

    for (let i = 0; i < RECORD_COUNT; i++) {
      const offer = offers[i % offers.length]
      const userId = userIds[Math.floor(Math.random() * userIds.length)]
      const status = statuses[Math.floor(Math.random() * statuses.length)]

      const createdDate = new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000)

      rows.push({
        user_id: userId,
        name: offer.title,
        description: offer.description,
        category: offer.category,
        status: status,
        address: 'Melbourne, VIC',
        phone: '+61 4' + String(Math.floor(Math.random() * 100000000)).padStart(8, '0'),
        availability: 'Weekends',
        created_at: createdDate.toISOString().slice(0, 19).replace('T', ' '),
        updated_at: timestamp
      })
    }

    if (!rows.length) {
      console.log('OfferSeeder: no rows to insert')
      return
    }

    const placeholders = rows.map(() => '(?,?,?,?,?,?,?,?,?,?)').join(',')
    const sql = 'INSERT INTO offers (user_id,name,description,category,status,address,phone,availability,created_at,updated_at) VALUES ' + placeholders +
      ' ON DUPLICATE KEY UPDATE status=VALUES(status),updated_at=VALUES(updated_at)'

    const bindings = rows.flatMap((row) => [row.user_id, row.name, row.description, row.category, row.status, row.address, row.phone, row.availability, row.created_at, row.updated_at])

    const trx = await Database.transaction()
    try {
      await trx.rawQuery(sql, bindings)
      await trx.commit()
      console.log(`OfferSeeder: upserted ${rows.length} offers`)
    } catch (error) {
      await trx.rollback()
      console.error('OfferSeeder failed', error)
      throw error
    }
  }
}
