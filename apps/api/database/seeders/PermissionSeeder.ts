import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Database from '@ioc:Adonis/Lucid/Database'

export default class PermissionSeeder extends BaseSeeder {
  public async run() {
    const RECORD_COUNT = 60

    const permissions = [
      // User Management (10)
      { name: 'view_users', description: 'View user profiles and information' },
      { name: 'create_users', description: 'Create new user accounts' },
      { name: 'edit_users', description: 'Edit user profiles and settings' },
      { name: 'delete_users', description: 'Delete user accounts' },
      { name: 'manage_user_roles', description: 'Assign and modify user roles' },
      { name: 'view_user_hours', description: 'View volunteer hours for users' },
      { name: 'approve_user_hours', description: 'Approve or reject volunteer hours' },
      { name: 'export_user_data', description: 'Export user data and reports' },
      { name: 'impersonate_users', description: 'Login as another user' },
      { name: 'view_background_checks', description: 'View background check status' },

      // Organization Management (8)
      { name: 'view_organizations', description: 'View organization details' },
      { name: 'create_organizations', description: 'Create new organizations' },
      { name: 'edit_organizations', description: 'Edit organization settings' },
      { name: 'delete_organizations', description: 'Delete organizations' },
      { name: 'manage_org_members', description: 'Manage organization members' },
      { name: 'invite_org_members', description: 'Send organization invitations' },
      { name: 'view_org_analytics', description: 'View organization analytics' },
      { name: 'manage_org_settings', description: 'Manage organization settings' },

      // Event Management (8)
      { name: 'view_events', description: 'View events and details' },
      { name: 'create_events', description: 'Create new events' },
      { name: 'edit_events', description: 'Edit event details' },
      { name: 'delete_events', description: 'Delete events' },
      { name: 'publish_events', description: 'Publish events to volunteers' },
      { name: 'cancel_events', description: 'Cancel scheduled events' },
      { name: 'manage_event_attendance', description: 'Manage event check-in/check-out' },
      { name: 'view_event_reports', description: 'View event analytics and reports' },

      // Opportunity Management (7)
      { name: 'view_opportunities', description: 'View volunteer opportunities' },
      { name: 'create_opportunities', description: 'Create new opportunities' },
      { name: 'edit_opportunities', description: 'Edit opportunity details' },
      { name: 'delete_opportunities', description: 'Delete opportunities' },
      { name: 'publish_opportunities', description: 'Publish opportunities' },
      { name: 'review_applications', description: 'Review volunteer applications' },
      { name: 'approve_applications', description: 'Approve or reject applications' },

      // Team Management (6)
      { name: 'view_teams', description: 'View team information' },
      { name: 'create_teams', description: 'Create new teams' },
      { name: 'edit_teams', description: 'Edit team details' },
      { name: 'delete_teams', description: 'Delete teams' },
      { name: 'assign_team_members', description: 'Assign members to teams' },
      { name: 'assign_team_leaders', description: 'Assign team leaders' },

      // Task Management (6)
      { name: 'view_tasks', description: 'View tasks and assignments' },
      { name: 'create_tasks', description: 'Create new tasks' },
      { name: 'edit_tasks', description: 'Edit task details' },
      { name: 'delete_tasks', description: 'Delete tasks' },
      { name: 'assign_tasks', description: 'Assign tasks to volunteers' },
      { name: 'complete_tasks', description: 'Mark tasks as complete' },

      // Resource Management (7)
      { name: 'view_resources', description: 'View available resources' },
      { name: 'create_resources', description: 'Add new resources' },
      { name: 'edit_resources', description: 'Edit resource details' },
      { name: 'delete_resources', description: 'Delete resources' },
      { name: 'assign_resources', description: 'Assign resources to events' },
      { name: 'track_resource_usage', description: 'Track resource usage and availability' },
      { name: 'manage_resource_maintenance', description: 'Manage resource maintenance' },

      // Course & Training (6)
      { name: 'view_courses', description: 'View training courses' },
      { name: 'create_courses', description: 'Create new courses' },
      { name: 'edit_courses', description: 'Edit course details' },
      { name: 'delete_courses', description: 'Delete courses' },
      { name: 'enroll_volunteers', description: 'Enroll volunteers in courses' },
      { name: 'track_certifications', description: 'Track volunteer certifications' },

      // Shift Management (6)
      { name: 'view_shifts', description: 'View shift schedules' },
      { name: 'create_shifts', description: 'Create new shifts' },
      { name: 'edit_shifts', description: 'Edit shift details' },
      { name: 'delete_shifts', description: 'Delete shifts' },
      { name: 'assign_shifts', description: 'Assign volunteers to shifts' },
      { name: 'approve_shift_hours', description: 'Approve shift hours' },

      // Communication (5)
      { name: 'send_notifications', description: 'Send notifications to volunteers' },
      { name: 'send_emails', description: 'Send bulk emails' },
      { name: 'create_announcements', description: 'Create system announcements' },
      { name: 'view_communication_logs', description: 'View communication history' },
      { name: 'manage_broadcasts', description: 'Manage broadcast messages' },

      // Reporting & Analytics (5)
      { name: 'view_reports', description: 'View system reports' },
      { name: 'create_custom_reports', description: 'Create custom reports' },
      { name: 'export_reports', description: 'Export reports to CSV/PDF' },
      { name: 'view_analytics_dashboard', description: 'View analytics dashboard' },
      { name: 'view_audit_logs', description: 'View system audit logs' },

      // Survey & Feedback (4)
      { name: 'view_surveys', description: 'View surveys' },
      { name: 'create_surveys', description: 'Create new surveys' },
      { name: 'edit_surveys', description: 'Edit survey questions' },
      { name: 'view_survey_results', description: 'View survey responses and analytics' },

      // Compliance (5)
      { name: 'view_compliance', description: 'View compliance status' },
      { name: 'manage_compliance_docs', description: 'Manage compliance documents' },
      { name: 'approve_compliance', description: 'Approve compliance submissions' },
      { name: 'audit_compliance', description: 'Conduct compliance audits' },
      { name: 'manage_background_checks', description: 'Manage background check requests' },

      // System Settings (3)
      { name: 'view_settings', description: 'View system settings' },
      { name: 'edit_settings', description: 'Edit system settings' },
      { name: 'manage_permissions', description: 'Manage roles and permissions' }
    ]

    const now = new Date()
    const timestamp = now.toISOString()

    const rows = permissions.slice(0, RECORD_COUNT).map((perm) => ({
      name: perm.name,
      description: perm.description,
      created_at: timestamp,
      updated_at: timestamp
    }))

    if (!rows.length) {
      console.log('PermissionSeeder: no rows to insert')
      return
    }

    const placeholders = rows.map(() => '(?,?,?,?)').join(',')
    const sql =
      'INSERT INTO permissions (name,description,created_at,updated_at) VALUES ' +
      placeholders +
      ' ON DUPLICATE KEY UPDATE description=VALUES(description),updated_at=VALUES(updated_at)'

    const bindings = rows.flatMap((row) => [
      row.name,
      row.description,
      row.created_at,
      row.updated_at
    ])

    const trx = await Database.transaction()
    try {
      await trx.rawQuery(sql, bindings)
      await trx.commit()
      console.log(`PermissionSeeder: upserted ${rows.length} permissions`)
    } catch (error) {
      await trx.rollback()
      console.error('PermissionSeeder failed', error)
      throw error
    }
  }
}
