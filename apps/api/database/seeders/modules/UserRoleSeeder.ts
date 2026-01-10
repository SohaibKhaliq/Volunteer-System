import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Database from '@ioc:Adonis/Lucid/Database'

export default class UserRoleSeeder extends BaseSeeder {
  public async run() {
    const RECORD_COUNT = 150 // Increased from 50

    const now = new Date()
    const timestamp = now.toISOString().slice(0, 19).replace('T', ' ')

    // Get all users with their emails to identify our key users
    const usersResult = await Database.rawQuery(
      'SELECT id, email FROM users ORDER BY id ASC LIMIT 200'
    )
    const users = usersResult[0] as Array<{ id: number; email: string }>

    const userIds = users.map((u) => u.id)

    const rolesResult = await Database.rawQuery('SELECT id, slug FROM roles ORDER BY id ASC')
    const roles = rolesResult[0] as Array<{ id: number; slug: string }>

    if (userIds.length === 0 || roles.length === 0) {
      console.log('UserRoleSeeder: missing users or roles, skipping')
      return
    }

    const roleMap = Object.fromEntries(roles.map((r) => [r.slug, r.id]))

    // Find our key users
    const adminUser = users.find((u) => u.email === 'admin@gmail.com')
    const orgUser = users.find((u) => u.email === 'organization@gmail.com')
    const volunteerUser = users.find((u) => u.email === 'volunteer@gmail.com')

    const rows: any[] = []

    // Assign super-admin role to admin@gmail.com
    if (adminUser && roleMap['super-admin']) {
      rows.push({
        user_id: adminUser.id,
        role_id: roleMap['super-admin'],
        created_at: timestamp,
        updated_at: timestamp
      })
    }

    // Assign organization-admin role to organization@gmail.com
    if (orgUser && roleMap['organization-admin']) {
      rows.push({
        user_id: orgUser.id,
        role_id: roleMap['organization-admin'],
        created_at: timestamp,
        updated_at: timestamp
      })
    }

    // Assign volunteer role to volunteer@gmail.com
    if (volunteerUser && roleMap['volunteer']) {
      rows.push({
        user_id: volunteerUser.id,
        role_id: roleMap['volunteer'],
        created_at: timestamp,
        updated_at: timestamp
      })
    }

    // Distribution for remaining users
    const roleDistribution = [
      { slug: 'admin', percentage: 0.02 },
      { slug: 'organization-admin', percentage: 0.08 },
      { slug: 'volunteer-manager', percentage: 0.1 },
      { slug: 'team-leader', percentage: 0.1 },
      { slug: 'coordinator', percentage: 0.1 },
      { slug: 'training-coordinator', percentage: 0.05 },
      { slug: 'resource-manager', percentage: 0.05 },
      { slug: 'volunteer', percentage: 0.5 }
    ]

    // Get remaining users (skip the first 3 key users)
    const remainingUserIds = userIds.slice(3)
    let userIndex = 0

    for (const dist of roleDistribution) {
      const roleId = roleMap[dist.slug]
      if (!roleId) continue

      const count = Math.ceil((RECORD_COUNT - 3) * dist.percentage)

      for (let i = 0; i < count && userIndex < remainingUserIds.length; i++, userIndex++) {
        rows.push({
          user_id: remainingUserIds[userIndex],
          role_id: roleId,
          created_at: timestamp,
          updated_at: timestamp
        })
      }
    }

    // Assign remaining users as volunteers
    while (userIndex < Math.min(remainingUserIds.length, RECORD_COUNT - 3)) {
      const volunteerRoleId = roleMap['volunteer']
      if (!volunteerRoleId) break

      rows.push({
        user_id: remainingUserIds[userIndex],
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

      // Also update is_admin flag for super admins
      const superAdminRoleId = roleMap['super-admin']
      const adminRoleId = roleMap['admin']
      if (superAdminRoleId) {
        await trx.rawQuery(
          'UPDATE users SET is_admin = 1 WHERE id IN (SELECT user_id FROM user_roles WHERE role_id IN (?, ?))',
          [superAdminRoleId, adminRoleId]
        )
      }

      await trx.commit()
      console.log(
        `UserRoleSeeder: upserted ${rows.length} user-role assignments and updated admin flags`
      )
    } catch (error) {
      await trx.rollback()
      console.error('UserRoleSeeder failed', error)
      throw error
    }
  }
}
