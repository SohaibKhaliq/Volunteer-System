import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Database from '@ioc:Adonis/Lucid/Database'

export default class CommunicationSeeder extends BaseSeeder {
  public async run() {
    const RECORD_COUNT = 100
    const now = new Date()
    const timestamp = now.toISOString()

    const orgsResult = await Database.rawQuery('SELECT id FROM organizations ORDER BY id ASC LIMIT 50')
    const orgIds = orgsResult[0].map((row: any) => row.id)

    const usersResult = await Database.rawQuery('SELECT id FROM users ORDER BY id ASC LIMIT 50')
    const userIds = usersResult[0].map((row: any) => row.id)

    if (orgIds.length === 0 || userIds.length === 0) {
      console.log('CommunicationSeeder: missing organizations or users, skipping')
      return
    }

    const messageTemplates = [
      { subject: 'Welcome to our organization!', type: 'email', category: 'onboarding' },
      { subject: 'Upcoming event reminder', type: 'email', category: 'reminder' },
      { subject: 'Thank you for volunteering', type: 'email', category: 'appreciation' },
      { subject: 'Important update about your shift', type: 'sms', category: 'notification' },
      { subject: 'Training session invitation', type: 'email', category: 'training' },
      { subject: 'Monthly volunteer newsletter', type: 'email', category: 'newsletter' },
      { subject: 'Emergency shift coverage needed', type: 'sms', category: 'urgent' },
      { subject: 'Feedback request', type: 'email', category: 'feedback' },
      { subject: 'Certificate of completion', type: 'email', category: 'certificate' },
      { subject: 'Event cancellation notice', type: 'email', category: 'notification' }
    ]

    const rows: any[] = []

    for (let i = 0; i < RECORD_COUNT; i++) {
      const template = messageTemplates[i % messageTemplates.length]
      const orgId = orgIds[Math.floor(Math.random() * orgIds.length)]
      const userId = userIds[Math.floor(Math.random() * userIds.length)]
      const sentBy = userIds[Math.floor(Math.random() * Math.min(5, userIds.length))]

      const sentDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
      const deliveredDate = new Date(sentDate.getTime() + Math.random() * 60000)
      const readDate = Math.random() > 0.3 ? new Date(deliveredDate.getTime() + Math.random() * 24 * 60 * 60 * 1000) : null

      rows.push({
        organization_id: orgId,
        user_id: userId,
        sent_by: sentBy,
        type: template.type,
        category: template.category,
        subject: template.subject,
        body: `This is a ${template.category} message for the volunteer.`,
        status: 'delivered',
        sent_at: sentDate.toISOString(),
        delivered_at: deliveredDate.toISOString(),
        read_at: readDate ? readDate.toISOString() : null,
        created_at: timestamp,
        updated_at: timestamp
      })
    }

    if (!rows.length) {
      console.log('CommunicationSeeder: no rows to insert')
      return
    }

    const placeholders = rows.map(() => '(?,?,?,?,?,?,?,?,?,?,?,?,?)').join(',')
    const sql = 'INSERT INTO communications (organization_id,user_id,sent_by,type,category,subject,body,status,sent_at,delivered_at,read_at,created_at,updated_at) VALUES ' + placeholders

    const bindings = rows.flatMap((row) => [row.organization_id, row.user_id, row.sent_by, row.type, row.category, row.subject, row.body, row.status, row.sent_at, row.delivered_at, row.read_at, row.created_at, row.updated_at])

    const trx = await Database.transaction()
    try {
      await trx.rawQuery(sql, bindings)
      await trx.commit()
      console.log(`CommunicationSeeder: inserted ${rows.length} communications`)
    } catch (error) {
      await trx.rollback()
      console.error('CommunicationSeeder failed', error)
      throw error
    }
  }
}
