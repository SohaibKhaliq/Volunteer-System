import Database from '@ioc:Adonis/Lucid/Database'
import User from 'App/Models/User'
import Permission from 'App/Models/Permission'
import AuditLog from 'App/Models/AuditLog'

export default class AuthorizationService {
  /**
   * Check whether a user has a named permission.
   * Considers direct role -> permission mappings and role inheritance.
   */
  public static async userHasPermission(user: User, permissionName: string): Promise<boolean> {
    if (!user) return false

    // Platform admins bypass checks
    // @ts-ignore - user may have isAdmin helper
    if ((user as any).isAdmin) return true

    // Load permission
    const permission = await Permission.query().where('name', permissionName).first()
    if (!permission) return false

    // Query to check if any of the user's roles (including inherited roles) grant the permission
    // We'll do a DB query joining role_permissions, role_inheritances and user_roles

    const result = await Database.rawQuery(
      `
      WITH RECURSIVE inherited_roles(role_id) AS (
        SELECT r.id FROM roles r
        JOIN user_roles ur ON ur.role_id = r.id AND ur.user_id = ?
        UNION
        SELECT ri.parent_role_id FROM role_inheritances ri
        JOIN inherited_roles ir ON ri.child_role_id = ir.role_id
      )
      SELECT rp.* FROM role_permissions rp
      JOIN inherited_roles ir ON rp.role_id = ir.role_id
      WHERE rp.permission_id = ? AND rp.granted = 1
      LIMIT 1
    `,
      [user.id, permission.id]
    )

    // rawQuery returns driver-specific results; check rows
    const rows = (result && (result.rows || result[0])) || []
    return rows.length > 0
  }

  public static async logRoleChange(
    actorId: number,
    targetId: number,
    added: string[] | undefined,
    removed: string[] | undefined,
    ip?: string
  ) {
    return await AuditLog.logRoleChange(actorId, targetId, { added, removed }, ip)
  }
}
