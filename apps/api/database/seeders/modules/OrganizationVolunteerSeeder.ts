import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Database from '@ioc:Adonis/Lucid/Database'

export default class OrganizationVolunteerSeeder extends BaseSeeder {
  public async run() {
    const RECORD_COUNT = 500 // Increased from 150

    const now = new Date()
    const timestamp = now.toISOString().slice(0, 19).replace('T', ' ')

    // Get all users and organizations (not just 50)
    const usersResult = await Database.rawQuery(
      'SELECT id, email FROM users ORDER BY id ASC LIMIT 300'
    )
    const users = usersResult[0] as Array<{ id: number; email: string }>
    const userIds = users.map((u) => u.id)

    const orgsResult = await Database.rawQuery(
      'SELECT id FROM organizations ORDER BY id ASC LIMIT 150'
    )
    const orgIds = orgsResult[0].map((row: any) => row.id)

    // Find key test organization
    const testOrgResult = await Database.rawQuery(
      'SELECT id FROM organizations WHERE slug = ? LIMIT 1',
      ['test-organization']
    )
    const testOrgId = testOrgResult[0]?.[0]?.id

    if (userIds.length === 0 || orgIds.length === 0) {
      console.log('OrganizationVolunteerSeeder: missing users or organizations, skipping')
      return
    }

    const statuses = ['Active', 'Inactive', 'Pending']
    // Fetch valid organization roles from the database to ensure consistency
    const targetRoles = ['volunteer', 'team-leader', 'coordinator', 'volunteer-manager']
    const rolesResult = await Database.from('roles').whereIn('slug', targetRoles).select('slug')
    const roles = rolesResult.map((r) => r.slug)

    if (roles.length === 0) {
      console.log('OrganizationVolunteerSeeder: no valid organization roles found in roles table')
      return
    }
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
      'Translation,Multicultural Communication',
      'Accounting,Finance,Budgeting',
      'Legal Services,Compliance,Auditing',
      'Healthcare,Counseling,Mental Health Support',
      'Childcare,Education,Tutoring',
      'Environmental Conservation,Sustainability'
    ]

    const rows: any[] = []
    const createdPairs = new Set<string>()

    // Assign key users to test organization first
    const keyUserEmails = ['admin@gmail.com', 'organization@gmail.com', 'volunteer@gmail.com']
    for (const email of keyUserEmails) {
      const user = users.find((u) => u.email === email)
      if (user && testOrgId) {
        const pairKey = `${testOrgId}-${user.id}`
        if (!createdPairs.has(pairKey)) {
          createdPairs.add(pairKey)
          const joinedDate = new Date()
          joinedDate.setDate(joinedDate.getDate() - 30)

          rows.push({
            organization_id: testOrgId,
            user_id: user.id,
            status: 'Active',
            role:
              email === 'admin@gmail.com'
                ? 'volunteer-manager'
                : email === 'organization@gmail.com'
                  ? 'coordinator'
                  : 'volunteer',
            hours: Math.floor(Math.random() * 200) + 50,
            rating: 5,
            skills: skillSets[0],
            notes: 'Core test user with full participation',
            joined_at: joinedDate.toISOString().slice(0, 19).replace('T', ' '),
            created_at: timestamp,
            updated_at: timestamp
          })
        }
      }
    }

    // Create random organization-volunteer assignments
    let count = 3
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
        notes: 'Dedicated volunteer with consistent attendance and strong commitment',
        joined_at: joinedDate.toISOString().slice(0, 19).replace('T', ' '),
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
      console.log(
        `OrganizationVolunteerSeeder: upserted ${rows.length} organization-volunteer relationships`
      )
    } catch (error) {
      await trx.rollback()
      console.error('OrganizationVolunteerSeeder failed', error)
      throw error
    }
  }
}
