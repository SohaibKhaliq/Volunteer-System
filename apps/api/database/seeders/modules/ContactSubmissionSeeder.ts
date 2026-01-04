import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Database from '@ioc:Adonis/Lucid/Database'

export default class ContactSubmissionSeeder extends BaseSeeder {
  public async run() {
    const RECORD_COUNT = 50
    const now = new Date()
    const timestamp = now.toISOString().slice(0, 19).replace('T', ' ')

    const firstNames = ['John', 'Sarah', 'Michael', 'Emma', 'David', 'Jessica', 'Chris', 'Amanda', 'Ryan', 'Michelle']
    const lastNames = ['Smith', 'Jones', 'Williams', 'Brown', 'Davis', 'Wilson', 'Taylor', 'Anderson', 'Thomas', 'Lee']
    const subjects = ['General Inquiry', 'Volunteer Registration', 'Event Information', 'Partnership Opportunity', 'Technical Support', 'Feedback', 'Donation Inquiry', 'Media Request']
    const statuses = ['new', 'in_progress', 'resolved', 'closed']

    const rows: any[] = []

    for (let i = 0; i < RECORD_COUNT; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
      const subject = subjects[Math.floor(Math.random() * subjects.length)]
      const status = statuses[Math.floor(Math.random() * statuses.length)]

      const submittedDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)

      rows.push({
        first_name: firstName,
        last_name: lastName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com.au`,
        phone: '+61 4' + String(Math.floor(Math.random() * 100000000)).padStart(8, '0'),
        subject: subject,
        message: `This is a ${subject.toLowerCase()} from ${firstName} ${lastName}.`,
        status: status,
        ip_address: `192.168.1.${Math.floor(Math.random() * 255)}`,
        user_agent: 'Mozilla/5.0',
        created_at: submittedDate.toISOString().slice(0, 19).replace('T', ' '),
        updated_at: timestamp
      })
    }

    if (!rows.length) {
      console.log('ContactSubmissionSeeder: no rows to insert')
      return
    }

    const placeholders = rows.map(() => '(?,?,?,?,?,?,?,?,?,?,?)').join(',')
    const sql = 'INSERT INTO contact_submissions (first_name,last_name,email,phone,subject,message,status,ip_address,user_agent,created_at,updated_at) VALUES ' + placeholders +
      ' ON DUPLICATE KEY UPDATE status=VALUES(status),updated_at=VALUES(updated_at)'

    const bindings = rows.flatMap((row) => [row.first_name, row.last_name, row.email, row.phone, row.subject, row.message, row.status, row.ip_address, row.user_agent, row.created_at, row.updated_at])

    const trx = await Database.transaction()
    try {
      await trx.rawQuery(sql, bindings)
      await trx.commit()
      console.log(`ContactSubmissionSeeder: upserted ${rows.length} contact submissions`)
    } catch (error) {
      await trx.rollback()
      console.error('ContactSubmissionSeeder failed', error)
      throw error
    }
  }
}
