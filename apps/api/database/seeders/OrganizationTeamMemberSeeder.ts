import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Database from '@ioc:Adonis/Lucid/Database'

export default class OrganizationTeamMemberSeeder extends BaseSeeder {
  public async run() {
    const RECORD_COUNT = 100
    const now = new Date()
    const timestamp = now.toISOString().slice(0, 19).replace('T', ' ')

    const teamsResult = await Database.rawQuery('SELECT id FROM teams ORDER BY id ASC LIMIT 50')
    const teamIds = teamsResult[0].map((row: any) => row.id)

    const usersResult = await Database.rawQuery('SELECT id FROM users ORDER BY id ASC LIMIT 50')
    const userIds = usersResult[0].map((row: any) => row.id)

    if (teamIds.length === 0 || userIds.length === 0) {
      console.log('OrganizationTeamMemberSeeder: missing teams or users, skipping')
      return
    }

    // Fetch valid team roles from the database
    const targetRoles = ['volunteer', 'coordinator', 'team-leader']
    const rolesResult = await Database.from('roles').whereIn('slug', targetRoles).select('slug')
    const roles = rolesResult.map((r) => r.slug)

    if (roles.length === 0) {
      console.log('OrganizationTeamMemberSeeder: no valid team roles found')
      return
    }
    const rows: any[] = []
    const createdPairs = new Set<string>()

    let count = 0
    while (count < RECORD_COUNT) {
      const teamId = teamIds[Math.floor(Math.random() * teamIds.length)]
      const userId = userIds[Math.floor(Math.random() * userIds.length)]
      const pairKey = `${teamId}-${userId}`

      if (createdPairs.has(pairKey)) continue
      createdPairs.add(pairKey)

      const joinedDate = new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000)
      const role = roles[Math.floor(Math.random() * roles.length)]

      rows.push({
        team_id: teamId,
        user_id: userId,
        role: role,
        joined_at: joinedDate.toISOString().slice(0, 19).replace('T', ' '),
        is_active: Math.random() > 0.1 ? 1 : 0,
        created_at: timestamp,
        updated_at: timestamp
      })

      count++
    }

    if (!rows.length) {
      console.log('OrganizationTeamMemberSeeder: no rows to insert')
      return
    }

    const placeholders = rows.map(() => '(?,?,?,?,?,?,?)').join(',')
    const sql = 'INSERT INTO organization_team_members (team_id,user_id,role,joined_at,is_active,created_at,updated_at) VALUES ' + placeholders +
      ' ON DUPLICATE KEY UPDATE role=VALUES(role),is_active=VALUES(is_active),updated_at=VALUES(updated_at)'

    const bindings = rows.flatMap((row) => [row.team_id, row.user_id, row.role, row.joined_at, row.is_active, row.created_at, row.updated_at])

    const trx = await Database.transaction()
    try {
      await trx.rawQuery(sql, bindings)
      await trx.commit()
      console.log(`OrganizationTeamMemberSeeder: upserted ${rows.length} team members`)
    } catch (error) {
      await trx.rollback()
      console.error('OrganizationTeamMemberSeeder failed', error)
      throw error
    }
  }
}
