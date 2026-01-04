import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Database from '@ioc:Adonis/Lucid/Database'

export default class TaskSeeder extends BaseSeeder {
  public async run() {
    const RECORD_COUNT = 100

    const taskTemplates = [
      { title: 'Setup Event Space', description: 'Arrange tables, chairs, and equipment for the event' },
      { title: 'Registration Desk', description: 'Check in participants and provide information' },
      { title: 'Food Service', description: 'Prepare and serve food and beverages' },
      { title: 'Cleanup Crew', description: 'Clean and restore venue after event' },
      { title: 'Photographer', description: 'Take photos and videos of the event' },
      { title: 'Social Media Updates', description: 'Post live updates on social media during event' },
      { title: 'Guest Speaker Coordination', description: 'Coordinate with and assist guest speakers' },
      { title: 'Activity Facilitation', description: 'Lead activities and workshops during event' },
      { title: 'First Aid Station', description: 'Provide first aid support if needed' },
      { title: 'Parking Assistance', description: 'Direct vehicles and assist with parking' },
      { title: 'Information Booth', description: 'Answer questions and provide directions' },
      { title: 'Merchandise Sales', description: 'Sell event merchandise and handle payments' },
      { title: 'Sound and AV Setup', description: 'Setup and manage audio-visual equipment' },
      { title: 'Transportation Coordination', description: 'Coordinate volunteer transportation' },
      { title: 'Childcare Services', description: 'Supervise children during event' },
      { title: 'Security and Safety', description: 'Monitor event safety and security' },
      { title: 'Waste Management', description: 'Manage recycling and waste disposal' },
      { title: 'Banner Setup', description: 'Display banners and signage' },
      { title: 'Equipment Management', description: 'Manage and distribute equipment' },
      { title: 'Attendee Survey', description: 'Collect feedback from participants' }
    ]

    const now = new Date()
    const timestamp = now.toISOString().slice(0, 19).replace('T', ' ')

    const eventsResult = await Database.rawQuery('SELECT id FROM events ORDER BY id ASC LIMIT 50')
    const eventIds = eventsResult[0].map((row: any) => row.id)

    if (eventIds.length === 0) {
      console.log('TaskSeeder: no events found, skipping')
      return
    }

    const rows: any[] = []

    for (let i = 0; i < RECORD_COUNT; i++) {
      const eventId = eventIds[Math.floor(Math.random() * eventIds.length)]
      const template = taskTemplates[Math.floor(Math.random() * taskTemplates.length)]

      const taskStart = new Date()
      taskStart.setDate(taskStart.getDate() + Math.floor(Math.random() * 30))
      const taskEnd = new Date(taskStart)
      taskEnd.setHours(taskEnd.getHours() + Math.floor(Math.random() * 3) + 1)

      const slotCount = Math.floor(Math.random() * 5) + 1

      const skills = ['Communication', 'Teamwork', 'Organization', 'Technical', 'Physical']
      const requiredSkills = JSON.stringify([skills[Math.floor(Math.random() * skills.length)]])

      rows.push({
        event_id: eventId,
        title: template.title,
        description: template.description,
        start_at: taskStart.toISOString().slice(0, 19).replace('T', ' '),
        end_at: taskEnd.toISOString().slice(0, 19).replace('T', ' '),
        slot_count: slotCount,
        required_skills: requiredSkills,
        created_at: timestamp,
        updated_at: timestamp
      })
    }

    if (!rows.length) {
      console.log('TaskSeeder: no rows to insert')
      return
    }

    const placeholders = rows.map(() => '(?,?,?,?,?,?,?,?,?)').join(',')
    const sql =
      'INSERT INTO tasks (event_id,title,description,start_at,end_at,slot_count,required_skills,created_at,updated_at) VALUES ' +
      placeholders

    const bindings = rows.flatMap((row) => [
      row.event_id,
      row.title,
      row.description,
      row.start_at,
      row.end_at,
      row.slot_count,
      row.required_skills,
      row.created_at,
      row.updated_at
    ])

    const trx = await Database.transaction()
    try {
      await trx.rawQuery(sql, bindings)
      await trx.commit()
      console.log(`TaskSeeder: inserted ${rows.length} tasks`)
    } catch (error) {
      await trx.rollback()
      console.error('TaskSeeder failed', error)
      throw error
    }
  }
}
