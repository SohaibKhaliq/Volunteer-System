import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Database from '@ioc:Adonis/Lucid/Database'

export default class RoleSeeder extends BaseSeeder {
  public async run() {
    const RECORD_COUNT = 10

    const roles = [
      {
        name: 'Super Admin',
        slug: 'super-admin',
        description: 'Full system access with all permissions'
      },
      {
        name: 'Organization Admin',
        slug: 'organization-admin',
        description: 'Full access to manage organization and its volunteers'
      },
      {
        name: 'Volunteer Manager',
        slug: 'volunteer-manager',
        description: 'Manages volunteers, events, and opportunities'
      },
      {
        name: 'Team Leader',
        slug: 'team-leader',
        description: 'Leads a team and manages team members'
      },
      {
        name: 'Coordinator',
        slug: 'coordinator',
        description: 'Coordinates events and volunteer activities'
      },
      {
        name: 'Volunteer',
        slug: 'volunteer',
        description: 'Standard volunteer with basic access'
      },
      {
        name: 'Training Coordinator',
        slug: 'training-coordinator',
        description: 'Manages training courses and certifications'
      },
      {
        name: 'Resource Manager',
        slug: 'resource-manager',
        description: 'Manages organizational resources and equipment'
      },
      {
        name: 'Auditor',
        slug: 'auditor',
        description: 'Read-only access for compliance and auditing'
      },
      {
        name: 'Guest',
        slug: 'guest',
        description: 'Limited public access to view events and opportunities'
      }
    ]

    const now = new Date()
    const timestamp = now.toISOString()

    const rows = roles.slice(0, RECORD_COUNT).map((role) => ({
      name: role.name,
      slug: role.slug,
      description: role.description,
      created_at: timestamp,
      updated_at: timestamp
    }))

    if (!rows.length) {
      console.log('RoleSeeder: no rows to insert')
      return
    }

    const placeholders = rows.map(() => '(?,?,?,?,?)').join(',')
    const sql =
      'INSERT INTO roles (name,slug,description,created_at,updated_at) VALUES ' +
      placeholders +
      ' ON DUPLICATE KEY UPDATE description=VALUES(description),updated_at=VALUES(updated_at)'

    const bindings = rows.flatMap((row) => [
      row.name,
      row.slug,
      row.description,
      row.created_at,
      row.updated_at
    ])

    const trx = await Database.transaction()
    try {
      await trx.rawQuery(sql, bindings)
      await trx.commit()
      console.log(`RoleSeeder: upserted ${rows.length} roles`)
    } catch (error) {
      await trx.rollback()
      console.error('RoleSeeder failed', error)
      throw error
    }
  }
}
