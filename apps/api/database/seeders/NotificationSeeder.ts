import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Database from '@ioc:Adonis/Lucid/Database'

export default class NotificationSeeder extends BaseSeeder {
  public async run() {
    const RECORD_COUNT = 100

    const notificationTemplates = [
      { title: 'Welcome to the platform!', message: 'Thank you for joining our volunteer community', type: 'system' },
      { title: 'Your application has been accepted', message: 'Congratulations! Your volunteer application has been accepted', type: 'application' },
      { title: 'Upcoming event reminder', message: 'You have an event starting tomorrow', type: 'reminder' },
      { title: 'New opportunity available', message: 'A new volunteer opportunity matching your interests is available', type: 'opportunity' },
      { title: 'Hours approved', message: 'Your volunteer hours have been approved', type: 'hours' },
      { title: 'Course enrollment confirmed', message: 'You have been enrolled in the training course', type: 'course' },
      { title: 'Event cancelled', message: 'Unfortunately, this event has been cancelled', type: 'event' },
      { title: 'New message received', message: 'You have a new message from an organization', type: 'message' },
      { title: 'Survey invitation', message: 'Please complete our volunteer satisfaction survey', type: 'survey' },
      { title: 'Achievement unlocked', message: 'Congratulations! You unlocked a new achievement', type: 'achievement' },
      { title: 'Shift reminder', message: 'You have a shift starting in 2 hours', type: 'shift' },
      { title: 'Profile incomplete', message: 'Please complete your volunteer profile', type: 'profile' },
      { title: 'Background check required', message: 'Please complete your background check', type: 'compliance' },
      { title: 'Organization invitation', message: 'You have been invited to join an organization', type: 'invitation' },
      { title: 'Team assignment', message: 'You have been assigned to a new team', type: 'team' }
    ]

    const now = new Date()
    const timestamp = now.toISOString().slice(0, 19).replace('T', ' ')

    const usersResult = await Database.rawQuery('SELECT id FROM users ORDER BY id ASC LIMIT 50')
    const userIds = usersResult[0].map((row: any) => row.id)

    if (userIds.length === 0) {
      console.log('NotificationSeeder: no users found, skipping')
      return
    }

    const rows: any[] = []

    for (let i = 0; i < RECORD_COUNT; i++) {
      const userId = userIds[Math.floor(Math.random() * userIds.length)]
      const template = notificationTemplates[Math.floor(Math.random() * notificationTemplates.length)]

      const createdDate = new Date()
      createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 30))

      const isRead = Math.random() > 0.3
      const priorities = ['low', 'normal', 'high', 'urgent']
      const priority = priorities[Math.floor(Math.random() * priorities.length)]

      const payload = JSON.stringify({
        message: template.message,
        link: '/dashboard'
      })

      rows.push({
        user_id: userId,
        title: template.title,
        type: template.type,
        payload: payload,
        read: isRead ? 1 : 0,
        priority: priority,
        category: template.type,
        action_url: template.type === 'opportunity' ? '/opportunities' : null,
        action_text: template.type === 'opportunity' ? 'View Opportunities' : null,
        sent_via_email: Math.random() > 0.5 ? 1 : 0,
        created_at: createdDate.toISOString().slice(0, 19).replace('T', ' '),
        updated_at: timestamp
      })
    }

    if (!rows.length) {
      console.log('NotificationSeeder: no rows to insert')
      return
    }

    const placeholders = rows.map(() => '(?,?,?,?,?,?,?,?,?,?,?,?)').join(',')
    const sql =
      'INSERT INTO notifications (user_id,title,type,payload,`read`,priority,category,action_url,action_text,sent_via_email,created_at,updated_at) VALUES ' +
      placeholders

    const bindings = rows.flatMap((row) => [
      row.user_id,
      row.title,
      row.type,
      row.payload,
      row.read,
      row.priority,
      row.category,
      row.action_url,
      row.action_text,
      row.sent_via_email,
      row.created_at,
      row.updated_at
    ])

    const trx = await Database.transaction()
    try {
      await trx.rawQuery(sql, bindings)
      await trx.commit()
      console.log(`NotificationSeeder: inserted ${rows.length} notifications`)
    } catch (error) {
      await trx.rollback()
      console.error('NotificationSeeder failed', error)
      throw error
    }
  }
}
