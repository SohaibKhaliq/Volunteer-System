import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Database from '@ioc:Adonis/Lucid/Database'

export default class CourseEnrollmentSeeder extends BaseSeeder {
  public async run() {
    const RECORD_COUNT = 100

    const now = new Date()
    const timestamp = now.toISOString().slice(0, 19).replace('T', ' ')

    const usersResult = await Database.rawQuery('SELECT id FROM users ORDER BY id ASC LIMIT 50')
    const userIds = usersResult[0].map((row: any) => row.id)

    const coursesResult = await Database.rawQuery('SELECT id FROM courses ORDER BY id ASC LIMIT 50')
    const courseIds = coursesResult[0].map((row: any) => row.id)

    if (userIds.length === 0 || courseIds.length === 0) {
      console.log('CourseEnrollmentSeeder: missing users or courses, skipping')
      return
    }

    const statuses = ['enrolled', 'completed', 'dropped', 'waitlisted']
    const statusWeights = [0.4, 0.4, 0.1, 0.1]

    const getWeightedStatus = () => {
      const random = Math.random()
      let cumulative = 0
      for (let i = 0; i < statuses.length; i++) {
        cumulative += statusWeights[i]
        if (random < cumulative) return statuses[i]
      }
      return statuses[0]
    }

    const rows: any[] = []
    const createdPairs = new Set<string>()

    let count = 0
    while (count < RECORD_COUNT) {
      const userId = userIds[Math.floor(Math.random() * userIds.length)]
      const courseId = courseIds[Math.floor(Math.random() * courseIds.length)]
      const pairKey = `${courseId}-${userId}`

      if (createdPairs.has(pairKey)) continue

      createdPairs.add(pairKey)

      const enrolledDate = new Date()
      enrolledDate.setDate(enrolledDate.getDate() - Math.floor(Math.random() * 30))

      const status = getWeightedStatus()
      const completedDate = status === 'completed' ? new Date(enrolledDate.getTime() + Math.random() * 14 * 24 * 60 * 60 * 1000) : null

      rows.push({
        course_id: courseId,
        user_id: userId,
        status: status,
        enrolled_at: enrolledDate.toISOString().slice(0, 19).replace('T', ' '),
        completed_at: completedDate ? completedDate.toISOString().slice(0, 19).replace('T', ' ') : null,
        created_at: timestamp,
        updated_at: timestamp
      })

      count++
    }

    if (!rows.length) {
      console.log('CourseEnrollmentSeeder: no rows to insert')
      return
    }

    const placeholders = rows.map(() => '(?,?,?,?,?,?,?)').join(',')
    const sql =
      'INSERT INTO course_enrollments (course_id,user_id,status,enrolled_at,completed_at,created_at,updated_at) VALUES ' +
      placeholders +
      ' ON DUPLICATE KEY UPDATE status=VALUES(status),completed_at=VALUES(completed_at),updated_at=VALUES(updated_at)'

    const bindings = rows.flatMap((row) => [
      row.course_id,
      row.user_id,
      row.status,
      row.enrolled_at,
      row.completed_at,
      row.created_at,
      row.updated_at
    ])

    const trx = await Database.transaction()
    try {
      await trx.rawQuery(sql, bindings)
      await trx.commit()
      console.log(`CourseEnrollmentSeeder: upserted ${rows.length} course enrollments`)
    } catch (error) {
      await trx.rollback()
      console.error('CourseEnrollmentSeeder failed', error)
      throw error
    }
  }
}
