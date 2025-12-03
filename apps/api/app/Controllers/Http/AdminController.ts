import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Logger from '@ioc:Adonis/Core/Logger'
import Database from '@ioc:Adonis/Lucid/Database'
import User from 'App/Models/User'
import Organization from 'App/Models/Organization'
import Event from 'App/Models/Event'
import AuditLog from 'App/Models/AuditLog'

/**
 * AdminController - Platform-level super admin operations
 * 
 * Features:
 * - Manage all organizations (approve, suspend, archive)
 * - Manage all users (disable, enable, delete)
 * - View system-wide reports and analytics
 * - Access audit logs and monitoring
 * - System settings management
 */
export default class AdminController {
  /**
   * Check if user is super admin
   */
  private async requireSuperAdmin(auth: HttpContextContract['auth']) {
    await auth.use('api').authenticate()
    const user = auth.user!
    if (!user.isAdmin) {
      throw new Error('Super admin access required')
    }
    return user
  }

  /**
   * Get platform-wide dashboard stats
   */
  public async dashboard({ auth, response }: HttpContextContract) {
    try {
      await this.requireSuperAdmin(auth)

      // Total counts
      const totalOrgs = await Organization.query().count('* as total')
      const activeOrgs = await Organization.query().where('status', 'active').count('* as total')
      const totalUsers = await User.query().count('* as total')
      const activeUsers = await User.query().whereNotNull('email_verified_at').count('* as total')
      const totalEvents = await Event.query().count('* as total')

      // Recent activity (last 7 days)
      const since = new Date()
      since.setDate(since.getDate() - 7)

      const newUsers = await User.query()
        .where('created_at', '>=', since.toISOString())
        .count('* as total')

      const newOrgs = await Organization.query()
        .where('created_at', '>=', since.toISOString())
        .count('* as total')

      // Pending approvals (organizations with pending status)
      const pendingOrgs = await Organization.query()
        .where('status', 'pending')
        .count('* as total')

      return response.ok({
        organizations: {
          total: totalOrgs[0].$extras.total || 0,
          active: activeOrgs[0].$extras.total || 0,
          pending: pendingOrgs[0].$extras.total || 0
        },
        users: {
          total: totalUsers[0].$extras.total || 0,
          active: activeUsers[0].$extras.total || 0
        },
        events: {
          total: totalEvents[0].$extras.total || 0
        },
        recent: {
          newUsers: newUsers[0].$extras.total || 0,
          newOrgs: newOrgs[0].$extras.total || 0
        }
      })
    } catch (error) {
      Logger.error('Admin dashboard error: %o', error)
      return response.unauthorized({ error: { message: error.message || 'Access denied' } })
    }
  }

  /**
   * List all organizations with filters (admin view)
   */
  public async listOrganizations({ auth, request, response }: HttpContextContract) {
    try {
      await this.requireSuperAdmin(auth)

      const { page = 1, perPage = 20, status, search, sortBy = 'created_at', sortOrder = 'desc' } = request.qs()

      const query = Organization.query()

      if (status) {
        query.where('status', status)
      }

      if (search) {
        query.where((builder) => {
          builder
            .where('name', 'LIKE', `%${search}%`)
            .orWhere('slug', 'LIKE', `%${search}%`)
            .orWhere('contact_email', 'LIKE', `%${search}%`)
        })
      }

      query.orderBy(sortBy, sortOrder === 'asc' ? 'asc' : 'desc')

      const orgs = await query.paginate(page, perPage)

      return response.ok(orgs)
    } catch (error) {
      Logger.error('Admin list organizations error: %o', error)
      return response.unauthorized({ error: { message: error.message || 'Access denied' } })
    }
  }

  /**
   * Approve an organization
   */
  public async approveOrganization({ auth, params, response }: HttpContextContract) {
    try {
      const admin = await this.requireSuperAdmin(auth)

      const org = await Organization.findOrFail(params.id)
      org.status = 'active'
      await org.save()

      // Log the action
      await AuditLog.create({
        userId: admin.id,
        action: 'organization_approved',
        targetType: 'organization',
        targetId: org.id,
        metadata: JSON.stringify({ previousStatus: 'pending', newStatus: 'active' })
      })

      return response.ok({ message: 'Organization approved', organization: org })
    } catch (error) {
      Logger.error('Admin approve organization error: %o', error)
      return response.badRequest({ error: { message: error.message || 'Failed to approve organization' } })
    }
  }

  /**
   * Suspend an organization
   */
  public async suspendOrganization({ auth, params, request, response }: HttpContextContract) {
    try {
      const admin = await this.requireSuperAdmin(auth)
      const { reason } = request.only(['reason'])

      const org = await Organization.findOrFail(params.id)
      const previousStatus = org.status
      org.status = 'suspended'
      await org.save()

      // Log the action
      await AuditLog.create({
        userId: admin.id,
        action: 'organization_suspended',
        targetType: 'organization',
        targetId: org.id,
        metadata: JSON.stringify({ previousStatus, newStatus: 'suspended', reason })
      })

      return response.ok({ message: 'Organization suspended', organization: org })
    } catch (error) {
      Logger.error('Admin suspend organization error: %o', error)
      return response.badRequest({ error: { message: error.message || 'Failed to suspend organization' } })
    }
  }

  /**
   * Reactivate a suspended organization
   */
  public async reactivateOrganization({ auth, params, response }: HttpContextContract) {
    try {
      const admin = await this.requireSuperAdmin(auth)

      const org = await Organization.findOrFail(params.id)
      const previousStatus = org.status
      org.status = 'active'
      await org.save()

      // Log the action
      await AuditLog.create({
        userId: admin.id,
        action: 'organization_reactivated',
        targetType: 'organization',
        targetId: org.id,
        metadata: JSON.stringify({ previousStatus, newStatus: 'active' })
      })

      return response.ok({ message: 'Organization reactivated', organization: org })
    } catch (error) {
      Logger.error('Admin reactivate organization error: %o', error)
      return response.badRequest({ error: { message: error.message || 'Failed to reactivate organization' } })
    }
  }

  /**
   * Archive an organization (soft delete)
   */
  public async archiveOrganization({ auth, params, response }: HttpContextContract) {
    try {
      const admin = await this.requireSuperAdmin(auth)

      const org = await Organization.findOrFail(params.id)
      const previousStatus = org.status
      org.status = 'archived'
      await org.save()

      // Log the action
      await AuditLog.create({
        userId: admin.id,
        action: 'organization_archived',
        targetType: 'organization',
        targetId: org.id,
        metadata: JSON.stringify({ previousStatus, newStatus: 'archived' })
      })

      return response.ok({ message: 'Organization archived', organization: org })
    } catch (error) {
      Logger.error('Admin archive organization error: %o', error)
      return response.badRequest({ error: { message: error.message || 'Failed to archive organization' } })
    }
  }

  /**
   * List all users (admin view)
   */
  public async listUsers({ auth, request, response }: HttpContextContract) {
    try {
      await this.requireSuperAdmin(auth)

      const { page = 1, perPage = 20, status, search, sortBy = 'created_at', sortOrder = 'desc' } = request.qs()

      const query = User.query().preload('roles').preload('organizations')

      if (status === 'active') {
        query.where('is_disabled', 0)
      } else if (status === 'inactive' || status === 'disabled') {
        query.where('is_disabled', 1)
      }

      if (search) {
        query.where((builder) => {
          builder
            .where('first_name', 'LIKE', `%${search}%`)
            .orWhere('last_name', 'LIKE', `%${search}%`)
            .orWhere('email', 'LIKE', `%${search}%`)
        })
      }

      const sortMap: Record<string, string> = {
        createdAt: 'created_at',
        firstName: 'first_name',
        lastName: 'last_name',
        email: 'email'
      }
      const sortField = sortMap[sortBy] ?? sortBy

      query.orderBy(sortField, sortOrder === 'asc' ? 'asc' : 'desc')

      const users = await query.paginate(page, perPage)

      // Sanitize output (remove passwords)
      const pag = users.toJSON()
      const sanitized = (pag.data || []).map((u: any) => {
        const { password, ...safe } = u
        return {
          ...safe,
          firstName: safe.firstName ?? safe.first_name,
          lastName: safe.lastName ?? safe.last_name,
          isDisabled: safe.isDisabled ?? safe.is_disabled
        }
      })

      return response.ok({ ...pag, data: sanitized })
    } catch (error) {
      Logger.error('Admin list users error: %o', error)
      return response.unauthorized({ error: { message: error.message || 'Access denied' } })
    }
  }

  /**
   * Disable a user (platform-wide ban)
   */
  public async disableUser({ auth, params, request, response }: HttpContextContract) {
    try {
      const admin = await this.requireSuperAdmin(auth)
      const { reason } = request.only(['reason'])

      const user = await User.findOrFail(params.id)

      // Don't allow disabling yourself
      if (user.id === admin.id) {
        return response.badRequest({ error: { message: 'Cannot disable your own account' } })
      }

      user.isDisabled = true
      await user.save()

      // Log the action
      await AuditLog.create({
        userId: admin.id,
        action: 'user_disabled',
        targetType: 'user',
        targetId: user.id,
        metadata: JSON.stringify({ reason })
      })

      return response.ok({ message: 'User disabled' })
    } catch (error) {
      Logger.error('Admin disable user error: %o', error)
      return response.badRequest({ error: { message: error.message || 'Failed to disable user' } })
    }
  }

  /**
   * Enable a user
   */
  public async enableUser({ auth, params, response }: HttpContextContract) {
    try {
      const admin = await this.requireSuperAdmin(auth)

      const user = await User.findOrFail(params.id)
      user.isDisabled = false
      await user.save()

      // Log the action
      await AuditLog.create({
        userId: admin.id,
        action: 'user_enabled',
        targetType: 'user',
        targetId: user.id,
        metadata: JSON.stringify({})
      })

      return response.ok({ message: 'User enabled' })
    } catch (error) {
      Logger.error('Admin enable user error: %o', error)
      return response.badRequest({ error: { message: error.message || 'Failed to enable user' } })
    }
  }

  /**
   * Get system-wide analytics
   */
  public async systemAnalytics({ auth, request, response }: HttpContextContract) {
    try {
      await this.requireSuperAdmin(auth)

      const { range = '30days' } = request.qs()

      let days = 30
      if (range === '7days') days = 7
      else if (range === '90days') days = 90
      else if (range === '1year') days = 365

      const since = new Date()
      since.setDate(since.getDate() - days)

      // User growth over time
      const userGrowth = await Database.rawQuery(`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM users
        WHERE created_at >= ?
        GROUP BY DATE(created_at)
        ORDER BY date
      `, [since.toISOString()])

      // Organization growth over time
      const orgGrowth = await Database.rawQuery(`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM organizations
        WHERE created_at >= ?
        GROUP BY DATE(created_at)
        ORDER BY date
      `, [since.toISOString()])

      // Volunteer hours over time
      const hoursData = await Database.rawQuery(`
        SELECT DATE(date) as date, SUM(hours) as total_hours
        FROM volunteer_hours
        WHERE date >= ? AND status = 'approved'
        GROUP BY DATE(date)
        ORDER BY date
      `, [since.toISOString()])

      // Organizations by status
      const orgsByStatus = await Database.from('organizations')
        .select('status')
        .count('* as count')
        .groupBy('status')

      // Users by role
      const usersByRole = await Database.from('user_roles')
        .join('roles', 'roles.id', 'user_roles.role_id')
        .select('roles.name')
        .count('* as count')
        .groupBy('roles.name')

      return response.ok({
        userGrowth: userGrowth[0] || [],
        organizationGrowth: orgGrowth[0] || [],
        volunteerHours: hoursData[0] || [],
        organizationsByStatus: orgsByStatus,
        usersByRole: usersByRole
      })
    } catch (error) {
      Logger.error('Admin system analytics error: %o', error)
      return response.unauthorized({ error: { message: error.message || 'Access denied' } })
    }
  }

  /**
   * Get recent audit logs
   */
  public async recentActivity({ auth, request, response }: HttpContextContract) {
    try {
      await this.requireSuperAdmin(auth)

      const { page = 1, perPage = 50, action, targetType } = request.qs()

      const query = AuditLog.query()
        .preload('user')
        .orderBy('created_at', 'desc')

      if (action) {
        query.where('action', action)
      }

      if (targetType) {
        query.where('target_type', targetType)
      }

      const logs = await query.paginate(page, perPage)

      return response.ok(logs)
    } catch (error) {
      Logger.error('Admin recent activity error: %o', error)
      return response.unauthorized({ error: { message: error.message || 'Access denied' } })
    }
  }

  /**
   * Platform-wide summary export
   */
  public async exportSummary({ auth, request, response }: HttpContextContract) {
    try {
      await this.requireSuperAdmin(auth)

      const { format = 'json' } = request.qs()

      // Gather summary data
      const orgs = await Organization.query()
        .select('id', 'name', 'status', 'created_at')
        .orderBy('created_at', 'desc')

      const totalUsers = await User.query().count('* as total')
      const totalHours = await Database.from('volunteer_hours')
        .where('status', 'approved')
        .sum('hours as total')

      const summary = {
        generatedAt: new Date().toISOString(),
        organizations: orgs.map((o) => o.toJSON()),
        totalUsers: totalUsers[0].$extras.total || 0,
        totalVolunteerHours: totalHours[0]?.total || 0
      }

      if (format === 'csv') {
        // Generate CSV
        const csvRows = ['Organization Name,Status,Created At']
        orgs.forEach((o) => {
          csvRows.push(`"${o.name}","${o.status}","${o.createdAt}"`)
        })

        response.header('Content-Type', 'text/csv')
        response.header('Content-Disposition', 'attachment; filename="platform-summary.csv"')
        return response.send(csvRows.join('\n'))
      }

      return response.ok(summary)
    } catch (error) {
      Logger.error('Admin export summary error: %o', error)
      return response.unauthorized({ error: { message: error.message || 'Access denied' } })
    }
  }
}
