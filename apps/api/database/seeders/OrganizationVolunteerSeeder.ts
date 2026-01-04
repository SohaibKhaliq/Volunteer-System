import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Database from '@ioc:Adonis/Lucid/Database'

export default class OrganizationVolunteerSeeder extends BaseSeeder {
  public async run() {
    const RECORD_COUNT = 150

    const now = new Date()
    const timestamp = now.toISOString()

    const usersResult = await Database.rawQuery('SELECT id FROM users ORDER BY id ASC LIMIT 50')
    const userIds = usersResult[0].map((row: any) => row.id)

    const orgsResult = await Database.rawQuery('SELECT id FROM organizations ORDER BY id ASC LIMIT 50')
    const orgIds = orgsResult[0].map((row: any) => row.id)

    if (userIds.length === 0 || orgIds.length === 0) {
      console.log('OrganizationVolunteerSeeder: missing users or organizations, skipping')
      return
    }

    const statuses = ['Active', 'Inactive', 'Pending']
    const roles = ['Volunteer', 'Team Leader', 'Coordinator', 'Manager']
    const skillSets = [
      'First Aid,Communication,Teamwork',
      'Project Management,Leadership,Training',
      'Cooking,Food Safety,Customer Service',
      'IT Support,Social Media,Photography',
      'Event Planning,Fundraising,Marketing',
      'Education,Mentoring,Public Speaking',
      'Manual Labor,Carpentry,Gardening',
      'Animal Care,Wildlife Handling',
      'Data Entry,Administration,Research',
      'Translation,Multicultural Communication'
    ]

    const rows: any[] = []
    const createdPairs = new Set<string>()

    let count = 0
    while (count < RECORD_COUNT) {
      const userId = userIds[Math.floor(Math.random() * userIds.length)]
      const orgId = orgIds[Math.floor(Math.random() * orgIds.length)]
      const pairKey = `${orgId}-${userId}`

      if (createdPairs.has(pairKey)) continue

      createdPairs.add(pairKey)

      const joinedDate = new Date()
      joinedDate.setDate(joinedDate.getDate() - Math.floor(Math.random() * 365))

      const totalHours = Math.floor(Math.random() * 200)
      const rating = (Math.random() * 2 + 3).toFixed(1)

      rows.push({
        organization_id: orgId,
        user_id: userId,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        role: roles[Math.floor(Math.random() * roles.length)],
        hours: totalHours,
        rating: parseFloat(rating),
        skills: skillSets[Math.floor(Math.random() * skillSets.length)],
        notes: 'Dedicated volunteer with consistent attendance',
        joined_at: joinedDate.toISOString(),
        created_at: timestamp,
        updated_at: timestamp
      })

      count++
    }

    if (!rows.length) {
      console.log('OrganizationVolunteerSeeder: no rows to insert')
      return
    }

    const placeholders = rows.map(() => '(?,?,?,?,?,?,?,?,?,?,?)').join(',')
    const sql =
      'INSERT INTO organization_volunteers (organization_id,user_id,status,role,hours,rating,skills,notes,joined_at,created_at,updated_at) VALUES ' +
      placeholders +
      ' ON DUPLICATE KEY UPDATE status=VALUES(status),role=VALUES(role),hours=VALUES(hours),rating=VALUES(rating),skills=VALUES(skills),notes=VALUES(notes),updated_at=VALUES(updated_at)'

    const bindings = rows.flatMap((row) => [
      row.organization_id,
      row.user_id,
      row.status,
      row.role,
      row.hours,
      row.rating,
      row.skills,
      row.notes,
      row.joined_at,
      row.created_at,
      row.updated_at
    ])

    const trx = await Database.transaction()
    try {
      await trx.rawQuery(sql, bindings)
      await trx.commit()
      console.log(`OrganizationVolunteerSeeder: upserted ${rows.length} organization-volunteer relationships`)
    } catch (error) {
      await trx.rollback()
      console.error('OrganizationVolunteerSeeder failed', error)
      throw error
    }
  }
}
