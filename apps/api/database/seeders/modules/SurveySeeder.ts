import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Database from '@ioc:Adonis/Lucid/Database'

export default class SurveySeeder extends BaseSeeder {
  public async run() {
    const RECORD_COUNT = 20
    const now = new Date()
    const timestamp = now.toISOString().slice(0, 19).replace('T', ' ')

    const orgsResult = await Database.rawQuery('SELECT id FROM organizations ORDER BY id ASC LIMIT 50')
    const orgIds = orgsResult[0].map((row: any) => row.id)

    const usersResult = await Database.rawQuery('SELECT id FROM users ORDER BY id ASC LIMIT 10')
    const userIds = usersResult[0].map((row: any) => row.id)

    if (orgIds.length === 0) {
      console.log('SurveySeeder: no organizations found, skipping')
      return
    }

    const surveys = [
      {
        title: 'Volunteer Satisfaction Survey',
        description: 'Help us understand your volunteer experience',
        questions: JSON.stringify([
          { id: 1, question: 'How satisfied are you with your volunteer experience?', type: 'rating', required: true },
          { id: 2, question: 'Would you recommend volunteering with us to others?', type: 'yes_no', required: true },
          { id: 3, question: 'What did you enjoy most about volunteering?', type: 'text', required: false },
          { id: 4, question: 'How can we improve the volunteer experience?', type: 'text', required: false }
        ])
      },
      {
        title: 'Event Feedback Survey',
        description: 'Share your thoughts about our recent event',
        questions: JSON.stringify([
          { id: 1, question: 'How would you rate the event overall?', type: 'rating', required: true },
          { id: 2, question: 'Was the event well organized?', type: 'yes_no', required: true },
          { id: 3, question: 'What was the highlight of the event?', type: 'text', required: false },
          { id: 4, question: 'What could be improved for future events?', type: 'text', required: false }
        ])
      },
      {
        title: 'Training Evaluation',
        description: 'Evaluate your training course experience',
        questions: JSON.stringify([
          { id: 1, question: 'How effective was the training?', type: 'rating', required: true },
          { id: 2, question: 'Was the content relevant to your role?', type: 'yes_no', required: true },
          { id: 3, question: 'How knowledgeable was the instructor?', type: 'rating', required: true },
          { id: 4, question: 'What additional topics would you like covered?', type: 'text', required: false }
        ])
      },
      {
        title: 'Exit Survey',
        description: 'Help us understand why you are leaving',
        questions: JSON.stringify([
          { id: 1, question: 'What is your primary reason for leaving?', type: 'multiple_choice', required: true, options: ['Time constraints', 'Relocating', 'Health reasons', 'Not satisfied', 'Other'] },
          { id: 2, question: 'Would you consider volunteering with us again in the future?', type: 'yes_no', required: true },
          { id: 3, question: 'What did we do well?', type: 'text', required: false },
          { id: 4, question: 'What could we have done better?', type: 'text', required: false }
        ])
      },
      {
        title: 'Skills Assessment Survey',
        description: 'Help us understand your skills and interests',
        questions: JSON.stringify([
          { id: 1, question: 'What are your top skills?', type: 'text', required: true },
          { id: 2, question: 'What areas would you like to develop?', type: 'text', required: false },
          { id: 3, question: 'Do you have any certifications?', type: 'yes_no', required: false }
        ])
      }
    ]

    const statuses = ['draft', 'published', 'closed']
    const rows: any[] = []

    for (let i = 0; i < RECORD_COUNT; i++) {
      const survey = surveys[i % surveys.length]
      const orgId = orgIds[i % orgIds.length]
      const createdBy = userIds.length > 0 ? userIds[i % userIds.length] : null

      rows.push({
        organization_id: orgId,
        title: `${survey.title} ${Math.floor(i / surveys.length) + 1}`,
        description: survey.description,
        questions: survey.questions,
        status: statuses[i % statuses.length],
        created_by: createdBy,
        created_at: timestamp,
        updated_at: timestamp
      })
    }

    if (!rows.length) {
      console.log('SurveySeeder: no rows to insert')
      return
    }

    const placeholders = rows.map(() => '(?,?,?,?,?,?,?,?)').join(',')
    const sql = 'INSERT INTO surveys (organization_id,title,description,questions,status,created_by,created_at,updated_at) VALUES ' + placeholders +
      ' ON DUPLICATE KEY UPDATE description=VALUES(description),questions=VALUES(questions),status=VALUES(status),updated_at=VALUES(updated_at)'

    const bindings = rows.flatMap((row) => [row.organization_id, row.title, row.description, row.questions, row.status, row.created_by, row.created_at, row.updated_at])

    const trx = await Database.transaction()
    try {
      await trx.rawQuery(sql, bindings)
      await trx.commit()
      console.log(`SurveySeeder: upserted ${rows.length} surveys`)
    } catch (error) {
      await trx.rollback()
      console.error('SurveySeeder failed', error)
      throw error
    }
  }
}
