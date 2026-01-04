import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Database from '@ioc:Adonis/Lucid/Database'

export default class RolePermissionSeeder extends BaseSeeder {
  public async run() {
    const now = new Date()
    const timestamp = now.toISOString()

    const rolesResult = await Database.rawQuery('SELECT id, slug FROM roles ORDER BY id ASC')
    const roles = rolesResult[0] as Array<{ id: number; slug: string }>

    const permsResult = await Database.rawQuery('SELECT id, name FROM permissions ORDER BY id ASC')
    const permissions = permsResult[0] as Array<{ id: number; name: string }>

    if (roles.length === 0 || permissions.length === 0) {
      console.log('RolePermissionSeeder: missing roles or permissions, skipping')
      return
    }

    const roleMap = Object.fromEntries(roles.map((r) => [r.slug, r.id]))
    const permMap = Object.fromEntries(permissions.map((p) => [p.name, p.id]))

    const rolePermissions: Record<string, string[]> = {
      'super-admin': permissions.map((p) => p.name),

      'organization-admin': [
        'view_users',
        'edit_users',
        'view_user_hours',
        'approve_user_hours',
        'view_organizations',
        'edit_organizations',
        'manage_org_members',
        'invite_org_members',
        'view_org_analytics',
        'manage_org_settings',
        'view_events',
        'create_events',
        'edit_events',
        'delete_events',
        'publish_events',
        'cancel_events',
        'manage_event_attendance',
        'view_event_reports',
        'view_opportunities',
        'create_opportunities',
        'edit_opportunities',
        'delete_opportunities',
        'publish_opportunities',
        'review_applications',
        'approve_applications',
        'view_teams',
        'create_teams',
        'edit_teams',
        'delete_teams',
        'assign_team_members',
        'assign_team_leaders',
        'view_tasks',
        'create_tasks',
        'edit_tasks',
        'assign_tasks',
        'complete_tasks',
        'view_resources',
        'create_resources',
        'edit_resources',
        'assign_resources',
        'track_resource_usage',
        'view_courses',
        'create_courses',
        'edit_courses',
        'enroll_volunteers',
        'track_certifications',
        'view_shifts',
        'create_shifts',
        'edit_shifts',
        'assign_shifts',
        'approve_shift_hours',
        'send_notifications',
        'send_emails',
        'create_announcements',
        'view_communication_logs',
        'view_reports',
        'export_reports',
        'view_analytics_dashboard',
        'view_surveys',
        'create_surveys',
        'edit_surveys',
        'view_survey_results',
        'view_compliance',
        'manage_compliance_docs',
        'approve_compliance',
        'manage_background_checks'
      ],

      'volunteer-manager': [
        'view_users',
        'view_user_hours',
        'approve_user_hours',
        'view_organizations',
        'manage_org_members',
        'view_events',
        'create_events',
        'edit_events',
        'publish_events',
        'manage_event_attendance',
        'view_event_reports',
        'view_opportunities',
        'create_opportunities',
        'edit_opportunities',
        'publish_opportunities',
        'review_applications',
        'approve_applications',
        'view_teams',
        'assign_team_members',
        'view_tasks',
        'create_tasks',
        'edit_tasks',
        'assign_tasks',
        'view_resources',
        'assign_resources',
        'view_courses',
        'enroll_volunteers',
        'view_shifts',
        'create_shifts',
        'assign_shifts',
        'approve_shift_hours',
        'send_notifications',
        'view_reports',
        'view_surveys',
        'view_survey_results',
        'view_compliance'
      ],

      'team-leader': [
        'view_users',
        'view_organizations',
        'view_events',
        'manage_event_attendance',
        'view_opportunities',
        'review_applications',
        'view_teams',
        'assign_team_members',
        'view_tasks',
        'assign_tasks',
        'complete_tasks',
        'view_resources',
        'view_shifts',
        'view_reports',
        'view_surveys'
      ],

      coordinator: [
        'view_users',
        'view_organizations',
        'view_events',
        'create_events',
        'edit_events',
        'manage_event_attendance',
        'view_opportunities',
        'create_opportunities',
        'edit_opportunities',
        'review_applications',
        'view_teams',
        'view_tasks',
        'create_tasks',
        'assign_tasks',
        'view_resources',
        'assign_resources',
        'view_shifts',
        'assign_shifts',
        'send_notifications',
        'view_reports',
        'view_surveys'
      ],

      volunteer: [
        'view_events',
        'view_opportunities',
        'view_teams',
        'view_tasks',
        'complete_tasks',
        'view_resources',
        'view_shifts',
        'view_courses',
        'view_surveys'
      ],

      'training-coordinator': [
        'view_users',
        'view_courses',
        'create_courses',
        'edit_courses',
        'delete_courses',
        'enroll_volunteers',
        'track_certifications',
        'view_reports',
        'view_surveys',
        'create_surveys',
        'view_survey_results'
      ],

      'resource-manager': [
        'view_resources',
        'create_resources',
        'edit_resources',
        'delete_resources',
        'assign_resources',
        'track_resource_usage',
        'manage_resource_maintenance',
        'view_events',
        'view_reports'
      ],

      auditor: [
        'view_users',
        'view_organizations',
        'view_events',
        'view_event_reports',
        'view_opportunities',
        'view_teams',
        'view_tasks',
        'view_resources',
        'view_courses',
        'view_shifts',
        'view_communication_logs',
        'view_reports',
        'view_analytics_dashboard',
        'view_audit_logs',
        'view_surveys',
        'view_survey_results',
        'view_compliance',
        'audit_compliance'
      ],

      guest: ['view_events', 'view_opportunities']
    }

    const rows: any[] = []

    for (const [roleSlug, permNames] of Object.entries(rolePermissions)) {
      const roleId = roleMap[roleSlug]
      if (!roleId) continue

      for (const permName of permNames) {
        const permId = permMap[permName]
        if (!permId) continue

        rows.push({
          role_id: roleId,
          permission_id: permId,
          created_at: timestamp,
          updated_at: timestamp
        })
      }
    }

    if (!rows.length) {
      console.log('RolePermissionSeeder: no rows to insert')
      return
    }

    const placeholders = rows.map(() => '(?,?,?,?)').join(',')
    const sql =
      'INSERT INTO role_permissions (role_id,permission_id,created_at,updated_at) VALUES ' +
      placeholders +
      ' ON DUPLICATE KEY UPDATE updated_at=VALUES(updated_at)'

    const bindings = rows.flatMap((row) => [
      row.role_id,
      row.permission_id,
      row.created_at,
      row.updated_at
    ])

    const trx = await Database.transaction()
    try {
      await trx.rawQuery(sql, bindings)
      await trx.commit()
      console.log(`RolePermissionSeeder: upserted ${rows.length} role-permission mappings`)
    } catch (error) {
      await trx.rollback()
      console.error('RolePermissionSeeder failed', error)
      throw error
    }
  }
}
