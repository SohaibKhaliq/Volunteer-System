import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Database from '@ioc:Adonis/Lucid/Database'

export default class ShiftTaskSeeder extends BaseSeeder {
  public async run() {
    const RECORD_COUNT = 100
    const now = new Date()
    const timestamp = now.toISOString().slice(0, 19).replace('T', ' ').slice(0, 19).replace('T', ' ')

    const shiftsResult = await Database.rawQuery('SELECT id FROM shifts ORDER BY id ASC LIMIT 50')
    const shiftIds = shiftsResult[0].map((row: any) => row.id)

    if (shiftIds.length === 0) {
      console.log('ShiftTaskSeeder: no shifts found, skipping')
      return
    }

    const taskTemplates = [
      { title: 'Setup and Preparation', description: 'Prepare area and materials', difficulty: 'easy', reqVolunteers: 2, skills: 'Organization' },
      { title: 'Registration Desk', description: 'Check in participants and visitors', difficulty: 'easy', reqVolunteers: 2, skills: 'Communication' },
      { title: 'Food Service', description: 'Serve meals and refreshments', difficulty: 'medium', reqVolunteers: 3, skills: 'Food Handling' },
      { title: 'Activity Facilitation', description: 'Lead activities and programs', difficulty: 'medium', reqVolunteers: 2, skills: 'Teaching,Leadership' },
      { title: 'Equipment Management', description: 'Manage and distribute equipment', difficulty: 'easy', reqVolunteers: 1, skills: 'Organization' },
      { title: 'Safety Monitoring', description: 'Monitor safety and first aid', difficulty: 'hard', reqVolunteers: 1, skills: 'First Aid,Safety' },
      { title: 'Cleanup and Restoration', description: 'Clean and restore area', difficulty: 'easy', reqVolunteers: 3, skills: 'Physical Labor' },
      { title: 'Transportation Coordination', description: 'Coordinate volunteer transport', difficulty: 'medium', reqVolunteers: 1, skills: 'Driving,Organization' },
      { title: 'Admin Support', description: 'Provide administrative assistance', difficulty: 'easy', reqVolunteers: 1, skills: 'Computer Skills' },
      { title: 'Visitor Services', description: 'Assist visitors and answer questions', difficulty: 'easy', reqVolunteers: 2, skills: 'Communication' }
    ]

    const rows: any[] = []

    for (let i = 0; i < RECORD_COUNT; i++) {
      const shiftId = shiftIds[i % shiftIds.length]
      const template = taskTemplates[i % taskTemplates.length]

      rows.push({
        shift_id: shiftId,
        title: template.title,
        description: template.description,
        required_volunteers: template.reqVolunteers,
        difficulty: template.difficulty,
        skills: template.skills,
        created_at: timestamp,
        updated_at: timestamp
      })
    }

    if (!rows.length) {
      console.log('ShiftTaskSeeder: no rows to insert')
      return
    }

    const placeholders = rows.map(() => '(?,?,?,?,?,?,?,?)').join(',')
    const sql = 'INSERT INTO shift_tasks (shift_id,title,description,required_volunteers,difficulty,skills,created_at,updated_at) VALUES ' + placeholders

    const bindings = rows.flatMap((row) => [row.shift_id, row.title, row.description, row.required_volunteers, row.difficulty, row.skills,row.created_at, row.updated_at])

    const trx = await Database.transaction()
    try {
      await trx.rawQuery(sql, bindings)
      await trx.commit()
      console.log(`ShiftTaskSeeder: inserted ${rows.length} shift tasks`)
    } catch (error) {
      await trx.rollback()
      console.error('ShiftTaskSeeder failed', error)
      throw error
    }
  }
}
