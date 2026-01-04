import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Database from '@ioc:Adonis/Lucid/Database'

export default class UserRoleSeeder extends BaseSeeder {
  public async run() {
    const RECORD_COUNT = 50

    const now = new Date()
    const timestamp = now.toISOString()

    const usersResult = await Database.rawQuery('SELECT id FROM users ORDER BY id ASC LIMIT 50')
    const userIds = usersResult[0].map((row: any) => row.id)

    const rolesResult = await Database.rawQuery('SELECT id, slug FROM roles ORDER BY id ASC')
    const roles = rolesResult[0] as Array<{ id: number; slug: string }>

    if (userIds.length === 0 || roles.length === 0) {
      console.log('UserRoleSeeder: missing users or roles, skipping')
      return
    }

    const roleMap = Object.fromEntries(roles.map((r) => [r.slug, r.id]))

    const roleDistribution = [
      { slug: 'super-admin', percentage: 0.02 },
      { slug: 'organization-admin', percentage: 0.08 },
      { slug: 'volunteer-manager', percentage: 0.1 },
      { slug: 'team-leader', percentage: 0.1 },
      { slug: 'coordinator', percentage: 0.1 },
      { slug: 'training-coordinator', percentage: 0.05 },
      { slug: 'resource-manager', percentage: 0.05 },
      { slug: 'volunteer', percentage: 0.5 }
    ]

    const rows: any[] = []

    let userIndex = 0
    for (const dist of roleDistribution) {
      const roleId = roleMap[dist.slug]
      if (!roleId) continue

      const count = Math.ceil(RECORD_COUNT * dist.percentage)

      for (let i = 0; i < count && userIndex < userIds.length; i++, userIndex++) {
        rows.push({
          user_id: userIds[userIndex],
          role_id: roleId,
          created_at: timestamp,
          updated_at: timestamp
        })
      }
    }

    while (userIndex < Math.min(userIds.length, RECORD_COUNT)) {
      const volunteerRoleId = roleMap['volunteer']
      if (!volunteerRoleId) break

      rows.push({
        user_id: userIds[userIndex],
        role_id: volunteerRoleId,
        created_at: timestamp,
        updated_at: timestamp
      })
      userIndex++
    }

    if (!rows.length) {
      console.log('UserRoleSeeder: no rows to insert')
      return
    }

    const placeholders = rows.map(() => '(?,?,?,?)').join(',')
    const sql =
      'INSERT INTO user_roles (user_id,role_id,created_at,updated_at) VALUES ' +
      placeholders +
      ' ON DUPLICATE KEY UPDATE updated_at=VALUES(updated_at)'

    const bindings = rows.flatMap((row) => [
      row.user_id,
      row.role_id,
      row.created_at,
      row.updated_at
    ])

    const trx = await Database.transaction()
    try {
      await trx.rawQuery(sql, bindings)
      await trx.commit()
      console.log(`UserRoleSeeder: upserted ${rows.length} user-role assignments`)
    } catch (error) {
      await trx.rollback()
      console.error('UserRoleSeeder failed', error)
      throw error
    }
  }
}
