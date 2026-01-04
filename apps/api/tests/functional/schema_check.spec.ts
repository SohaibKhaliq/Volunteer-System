
import { test } from '@japa/runner'
import Database from '@ioc:Adonis/Lucid/Database'

test.group('Schema Check', () => {


  test('dump columns', async ({ assert }) => {
    try {
      const conm = await Database.rawQuery('SHOW COLUMNS FROM communications')
      const rows = conm[0]
      console.log('Communications:', rows.map((c: any) => `${c.Field}(${c.Type}, Null:${c.Null}, Default:${c.Default})`))
    } catch(e) { console.log('Communications err', e.message) }

    try {
      const logs = await Database.rawQuery('SHOW COLUMNS FROM communication_logs')
      const rows = logs[0]
      console.log('CommunicationLogs:', rows.map((c: any) => c.Field))
    } catch(e) { console.log('CommunicationLogs err', e.message) }

    try {
      const sur = await Database.rawQuery('SHOW COLUMNS FROM survey_responses')
      const rows = sur[0]
      console.log('SurveyResponses:', rows.map((c: any) => c.Field))
    } catch(e) { console.log('SurveyResponses err', e.message) }

    try {
      const cou = await Database.rawQuery('SHOW COLUMNS FROM courses')
      const rows = cou[0]
      console.log('Courses:', rows.map((c: any) => c.Field))
    } catch(e) { console.log('Courses err', e.message) }
  })


})
