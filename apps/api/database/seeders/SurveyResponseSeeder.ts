import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Database from '@ioc:Adonis/Lucid/Database'

export default class SurveyResponseSeeder extends BaseSeeder {
  public async run() {
    const RECORD_COUNT = 200
    const now = new Date()
    const timestamp = now.toISOString()

    const surveysResult = await Database.rawQuery('SELECT id, questions FROM surveys ORDER BY id ASC LIMIT 20')
    const surveys = surveysResult[0] as Array<{ id: number; questions: string }>

    const usersResult = await Database.rawQuery('SELECT id FROM users ORDER BY id ASC LIMIT 50')
    const userIds = usersResult[0].map((row: any) => row.id)

    if (surveys.length === 0 || userIds.length === 0) {
      console.log('SurveyResponseSeeder: missing surveys or users, skipping')
      return
    }

    const rows: any[] = []
    const createdPairs = new Set<string>()

    let count = 0
    while (count < RECORD_COUNT) {
      const userId = userIds[Math.floor(Math.random() * userIds.length)]
      const survey = surveys[Math.floor(Math.random() * surveys.length)]
      const pairKey = `${survey.id}-${userId}`

      if (createdPairs.has(pairKey)) continue
      createdPairs.add(pairKey)

      let questions
      try {
        questions = JSON.parse(survey.questions)
      } catch {
        questions = []
      }

      const responses: any = {}
      for (const q of questions) {
        if (q.type === 'rating') {
          responses[q.id] = Math.floor(Math.random() * 5) + 1
        } else if (q.type === 'yes_no') {
          responses[q.id] = Math.random() > 0.5 ? 'Yes' : 'No'
        } else if (q.type === 'text') {
          responses[q.id] = 'Sample text response for question ' + q.id
        } else if (q.type === 'multiple_choice' && q.options) {
          responses[q.id] = q.options[Math.floor(Math.random() * q.options.length)]
        }
      }

      const completedDate = new Date()
      completedDate.setDate(completedDate.getDate() - Math.floor(Math.random() * 30))

      rows.push({
        survey_id: survey.id,
        user_id: userId,
        responses: JSON.stringify(responses),
        completed_at: completedDate.toISOString(),
        created_at: timestamp,
        updated_at: timestamp
      })

      count++
    }

    if (!rows.length) {
      console.log('SurveyResponseSeeder: no rows to insert')
      return
    }

    const placeholders = rows.map(() => '(?,?,?,?,?,?)').join(',')
    const sql = 'INSERT INTO survey_responses (survey_id,user_id,responses,completed_at,created_at,updated_at) VALUES ' + placeholders +
      ' ON DUPLICATE KEY UPDATE responses=VALUES(responses),completed_at=VALUES(completed_at),updated_at=VALUES(updated_at)'

    const bindings = rows.flatMap((row) => [row.survey_id, row.user_id, row.responses, row.completed_at, row.created_at, row.updated_at])

    const trx = await Database.transaction()
    try {
      await trx.rawQuery(sql, bindings)
      await trx.commit()
      console.log(`SurveyResponseSeeder: upserted ${rows.length} survey responses`)
    } catch (error) {
      await trx.rollback()
      console.error('SurveyResponseSeeder failed', error)
      throw error
    }
  }
}
