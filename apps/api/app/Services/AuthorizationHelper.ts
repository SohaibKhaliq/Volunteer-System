import Database from '@ioc:Adonis/Lucid/Database'
import User from 'App/Models/User'

/**
 * Authorization Helper
 * Provides reusable authorization checks
 */
export default class AuthorizationHelper {
  /**
   * Check if user is admin
   */
  public static isAdmin(user: User): boolean {
    return user.isAdmin === true
  }

  /**
   * Check if user belongs to an organization
   */
  public static async belongsToOrganization(
    userId: number,
    organizationId: number
  ): Promise<boolean> {
    const exists = await Database.from('organization_volunteers')
      .where({ user_id: userId, organization_id: organizationId })
      .first()

    return !!exists
  }

  /**
   * Check if user is a team member of an organization
   */
  public static async isOrganizationTeamMember(
    userId: number,
    organizationId: number
  ): Promise<boolean> {
    const exists = await Database.from('organization_team_members')
      .where({ user_id: userId, organization_id: organizationId })
      .first()

    return !!exists
  }

  /**
   * Check if user is admin of a specific organization team
   */
  public static async isTeamAdmin(
    userId: number,
    organizationId: number
  ): Promise<boolean> {
    const member = await Database.from('organization_team_members')
      .where({ user_id: userId, organization_id: organizationId })
      .first()

    return member && member.role === 'admin'
  }

  /**
   * Check if user can manage resource for organization
   * User must be either system admin or organization team member
   */
  public static async canManageOrganization(
    user: User,
    organizationId: number
  ): Promise<boolean> {
    if (this.isAdmin(user)) {
      return true
    }

    return await this.isOrganizationTeamMember(user.id, organizationId)
  }

  /**
   * Check if user owns a resource
   */
  public static ownsResource(resource: any, userId: number): boolean {
    return resource.userId === userId || resource.user_id === userId
  }

  /**
   * Check if user has any of the specified roles
   */
  public static async hasAnyRole(userId: number, roleNames: string[]): Promise<boolean> {
    const userRoles = await Database.from('user_roles')
      .join('roles', 'user_roles.role_id', 'roles.id')
      .where('user_roles.user_id', userId)
      .whereIn('roles.name', roleNames)
      .first()

    return !!userRoles
  }

  /**
   * Ensure user is authenticated
   */
  public static async ensureAuthenticated(auth: any): Promise<User> {
    await auth.use('api').authenticate()
    return auth.user as User
  }

  /**
   * Check if user has permission for organization resource
   * Throws error if not authorized
   */
  public static async requireOrganizationPermission(
    user: User,
    organizationId: number,
    errorMessage: string = 'Not authorized to manage this organization'
  ): Promise<void> {
    const canManage = await this.canManageOrganization(user, organizationId)
    if (!canManage) {
      throw new Error(errorMessage)
    }
  }

  /**
   * Check if user is admin or throws error
   */
  public static requireAdmin(user: User, errorMessage: string = 'Admin access required'): void {
    if (!this.isAdmin(user)) {
      throw new Error(errorMessage)
    }
  }
}
