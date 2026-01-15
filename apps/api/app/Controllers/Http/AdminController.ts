import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Logger from '@ioc:Adonis/Core/Logger'
import Database from '@ioc:Adonis/Lucid/Database'
import User from 'App/Models/User'
import Organization from 'App/Models/Organization'
import Event from 'App/Models/Event'
import AuditLog from 'App/Models/AuditLog'
import Notification from 'App/Models/Notification'
import Team from 'App/Models/Team'
import OrganizationTeamMember from 'App/Models/OrganizationTeamMember'
import Application from '@ioc:Adonis/Core/Application'
import fs from 'fs'
import Drive from '@ioc:Adonis/Core/Drive'

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
      const pendingOrgs = await Organization.query().where('status', 'pending').count('* as total')

      // Metrics for the last 6 months
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

      const hoursResult = await Database.from('volunteer_hours')
        .where('status', 'approved')
        .where('date', '>=', sixMonthsAgo)
        .sum('hours as total')
      const totalHours = Number(hoursResult[0].total || 0)

      const activeVolunteersResult = await Database.from('volunteer_hours')
        .where('status', 'approved')
        .where('date', '>=', sixMonthsAgo)
        .countDistinct('user_id as total')
      const activeVolunteersCount = Number(activeVolunteersResult[0].total || 0)

      return response.ok({
        totalHours,
        activeVolunteers: activeVolunteersCount,
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
   * Quick admin summary counts (background checks pending, imports pending,
   * pending volunteer hours, unread notifications)
   */
  public async summary({ auth, response }: HttpContextContract) {
    try {
      await this.requireSuperAdmin(auth)

      const bgChecks = await Database.from('background_checks')
        .whereIn('status', ['requested', 'pending'])
        .count('* as total')

      const importJobs = await Database.from('scheduled_jobs')
        .where('type', 'like', '%import%')
        .whereNotIn('status', ['Completed', 'completed'])
        .count('* as total')

      const pendingHours = await Database.from('volunteer_hours')
        .where('status', 'pending')
        .count('* as total')

      const unreadNotifs = await Database.from('notifications')
        .where('read', false)
        .count('* as total')

      // Pending approvals (help requests, offers, carpooling)
      const pendingHelpRequests = await Database.from('help_requests')
        .where('approval_status', 'pending')
        .count('* as total')
      const pendingOffers = await Database.from('offers')
        .where('approval_status', 'pending')
        .count('* as total')
      const pendingCarpooling = await Database.from('carpooling_ads')
        .where('approval_status', 'pending')
        .count('* as total')

      return response.ok({
        backgroundChecksPending: Number(bgChecks[0]?.total || bgChecks[0]?.$extras?.total || 0),
        importsPending: Number(importJobs[0]?.total || importJobs[0]?.$extras?.total || 0),
        pendingHours: Number(pendingHours[0]?.total || pendingHours[0]?.$extras?.total || 0),
        unreadNotifications: Number(unreadNotifs[0]?.total || unreadNotifs[0]?.$extras?.total || 0),
        approvalsPending:
          Number(pendingHelpRequests[0]?.total || pendingHelpRequests[0]?.$extras?.total || 0) +
          Number(pendingOffers[0]?.total || pendingOffers[0]?.$extras?.total || 0) +
          Number(pendingCarpooling[0]?.total || pendingCarpooling[0]?.$extras?.total || 0)
      })
    } catch (error) {
      Logger.error('Admin summary error: %o', error)
      return response.unauthorized({ error: { message: error.message || 'Access denied' } })
    }
  }

  /**
   * Features available to the current user — respects system settings and user roles.
   * This endpoint is for the frontend to decide which admin sections to render.
   */
  public async features({ auth, response }: HttpContextContract) {
    try {
      await auth.use('api').authenticate()
      const user = auth.user!

      // Try to read a 'features' entry in the system settings table (JSON stored)
      let settingsFeatures: Record<string, boolean> | null = null
      try {
        const row = await Database.from('system_settings').where('key', 'features').first()
        if (row && row.value) {
          try {
            settingsFeatures = JSON.parse(row.value)
          } catch {
            // ignore malformed JSON
            settingsFeatures = null
          }
        }
      } catch (err) {
        // ignore DB lookup errors and fall back to defaults
      }

      const roleNames = Array.isArray((user as any).roles)
        ? (user as any).roles.map((r: any) => String(r?.name ?? r?.role ?? '').toLowerCase())
        : []

      const isSuper =
        roleNames.some((r: string) => r.includes('super') || r.includes('owner')) || !!user.isAdmin

      const defaults: Record<string, boolean> = {
        dataOps: false,
        analytics: true,
        monitoring: true,
        scheduling: true
      }

      const final: Record<string, boolean> = {
        dataOps: (settingsFeatures?.dataOps ?? defaults.dataOps) || isSuper,
        analytics: settingsFeatures?.analytics ?? defaults.analytics,
        monitoring: settingsFeatures?.monitoring ?? defaults.monitoring,
        scheduling: settingsFeatures?.scheduling ?? defaults.scheduling,
        // System-wide module toggles
        shifts:
          (await Database.from('system_settings').where('key', 'enable_shifts').first())?.value ===
          'true',
        resources:
          (await Database.from('system_settings').where('key', 'enable_resources').first())
            ?.value === 'true',
        gamification:
          (await Database.from('system_settings').where('key', 'enable_gamification').first())
            ?.value === 'true',
        complianceEnforcement:
          (
            await Database.from('system_settings')
              .where('key', 'enable_compliance_enforcement')
              .first()
          )?.value === 'true'
      }

      return response.ok(final)
    } catch (error) {
      Logger.error('Admin features error: %o', error)
      return response.unauthorized({ error: { message: error.message || 'Access denied' } })
    }
  }

  /**
   * Pending volunteer hours grouped by organization (for platform admin)
   */
  public async pendingHoursByOrganization({ auth, request, response }: HttpContextContract) {
    try {
      await this.requireSuperAdmin(auth)

      // optional paging / limit query
      const { limit = 10 } = request.qs()

      // Count pending hours grouped by organization via organization_volunteers join
      const groups = await Database.rawQuery(
        `SELECT ov.organization_id as organizationId, orgs.name as organizationName, COUNT(*) as pendingCount
         FROM volunteer_hours vh
         JOIN organization_volunteers ov ON ov.user_id = vh.user_id
         JOIN organizations orgs ON orgs.id = ov.organization_id
         WHERE vh.status = 'pending'
         GROUP BY ov.organization_id, orgs.name
         ORDER BY pendingCount DESC`,
        []
      )

      const out: any[] = []

      for (const g of groups[0] || []) {
        const orgId = g.organizationId

        const items = await Database.from('volunteer_hours')
          .join(
            'organization_volunteers',
            'volunteer_hours.user_id',
            'organization_volunteers.user_id'
          )
          .leftJoin('users', 'users.id', 'volunteer_hours.user_id')
          .leftJoin('events', 'events.id', 'volunteer_hours.event_id')
          .where('organization_volunteers.organization_id', orgId)
          .where('volunteer_hours.status', 'pending')
          .select(
            'volunteer_hours.id',
            'volunteer_hours.date',
            'volunteer_hours.hours',
            'volunteer_hours.notes',
            'users.first_name',
            'users.last_name',
            'users.email',
            'events.title as event_title'
          )
          .orderBy('volunteer_hours.date', 'desc')
          .limit(Number(limit))

        out.push({
          organizationId: orgId,
          organizationName: g.organizationName,
          pendingCount: Number(g.pendingCount || 0),
          items
        })
      }

      return response.ok(out)
    } catch (error) {
      Logger.error('Admin pending hours by org error: %o', error)
      return response.unauthorized({ error: { message: error.message || 'Access denied' } })
    }
  }

  /**
   * List all organizations with filters (admin view)
   */
  public async listOrganizations({ auth, request, response }: HttpContextContract) {
    try {
      await this.requireSuperAdmin(auth)

      const {
        page = 1,
        perPage = 20,
        status,
        search,
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = request.qs()

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
      const previousStatus = org.status
      org.status = 'active'
      org.isApproved = true
      await org.save()

      // Create default team for the organization
      try {
        const defaultTeam = await Team.create({
          organizationId: org.id,
          name: 'Core Team',
          description: 'Default team for organization members'
        })

        // Find the organization creator/contact and add them as team admin
        // This assumes the organization has a contact_email that might match a user
        if (org.contactEmail) {
          const creator = await User.query().where('email', org.contactEmail).first()
          if (creator) {
            // Add creator as organization team member (admin role)
            await OrganizationTeamMember.create({
              organizationId: org.id,
              userId: creator.id,
              role: 'Admin'
            })

            // Send welcome notification
            await Notification.create({
              userId: creator.id,
              type: 'organization_approved',
              payload: JSON.stringify({
                organizationId: org.id,
                organizationName: org.name,
                organizationSlug: org.slug,
                teamId: defaultTeam.id
              })
            })
          }
        }
      } catch (err) {
        Logger.warn('Failed to create default team or send approval notification:', err)
      }

      // Log the action
      await AuditLog.safeCreate({
        userId: admin.id,
        action: 'organization_approved',
        targetType: 'organization',
        targetId: org.id,
        metadata: JSON.stringify({ previousStatus, newStatus: 'active' })
      })

      return response.ok({ message: 'Organization approved', organization: org })
    } catch (error) {
      Logger.error('Admin approve organization error: %o', error)
      return response.badRequest({
        error: { message: error.message || 'Failed to approve organization' }
      })
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

      // Notify all organization team members about suspension
      try {
        const teamMembers = await OrganizationTeamMember.query()
          .where('organization_id', org.id)
          .select('user_id')

        for (const member of teamMembers) {
          await Notification.create({
            userId: member.userId,
            type: 'organization_suspended',
            payload: JSON.stringify({
              organizationId: org.id,
              organizationName: org.name,
              reason: reason || 'No reason provided'
            })
          })
        }
      } catch (err) {
        Logger.warn('Failed to send suspension notifications:', err)
      }

      // Log the action
      await AuditLog.safeCreate({
        userId: admin.id,
        action: 'organization_suspended',
        targetType: 'organization',
        targetId: org.id,
        metadata: JSON.stringify({ previousStatus, newStatus: 'suspended', reason })
      })

      return response.ok({ message: 'Organization suspended', organization: org })
    } catch (error) {
      Logger.error('Admin suspend organization error: %o', error)
      return response.badRequest({
        error: { message: error.message || 'Failed to suspend organization' }
      })
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
      await AuditLog.safeCreate({
        userId: admin.id,
        action: 'organization_reactivated',
        targetType: 'organization',
        targetId: org.id,
        metadata: JSON.stringify({ previousStatus, newStatus: 'active' })
      })

      return response.ok({ message: 'Organization reactivated', organization: org })
    } catch (error) {
      Logger.error('Admin reactivate organization error: %o', error)
      return response.badRequest({
        error: { message: error.message || 'Failed to reactivate organization' }
      })
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
      await AuditLog.safeCreate({
        userId: admin.id,
        action: 'organization_archived',
        targetType: 'organization',
        targetId: org.id,
        metadata: JSON.stringify({ previousStatus, newStatus: 'archived' })
      })

      return response.ok({ message: 'Organization archived', organization: org })
    } catch (error) {
      Logger.error('Admin archive organization error: %o', error)
      return response.badRequest({
        error: { message: error.message || 'Failed to archive organization' }
      })
    }
  }

  /**
   * List all users (admin view)
   */
  public async listUsers({ auth, request, response }: HttpContextContract) {
    try {
      await this.requireSuperAdmin(auth)

      const {
        page = 1,
        perPage = 20,
        status,
        search,
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = request.qs()

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
      await AuditLog.safeCreate({
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
      await AuditLog.safeCreate({
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
      const userGrowth = await Database.rawQuery(
        `
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM users
        WHERE created_at >= ?
        GROUP BY DATE(created_at)
        ORDER BY date
      `,
        [since.toISOString()]
      )

      // Organization growth over time
      const orgGrowth = await Database.rawQuery(
        `
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM organizations
        WHERE created_at >= ?
        GROUP BY DATE(created_at)
        ORDER BY date
      `,
        [since.toISOString()]
      )

      // Volunteer hours over time
      const hoursData = await Database.rawQuery(
        `
        SELECT DATE(date) as date, SUM(hours) as total_hours
        FROM volunteer_hours
        WHERE date >= ? AND status = 'approved'
        GROUP BY DATE(date)
        ORDER BY date
      `,
        [since.toISOString()]
      )

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

      const { limit = 10 } = request.qs()

      const logs = await AuditLog.query().preload('user').orderBy('created_at', 'desc').limit(limit)

      // Format for frontend dashboard: array of {desc, time}
      const activities = logs.map((log) => {
        const userName = log.user?.firstName || log.user?.email || 'Unknown User'
        const action = log.action || 'performed action'
        const target = log.targetType || 'resource'

        // Create human-readable description
        let desc = `${userName} ${action.replace('_', ' ')} ${target}`
        if (log.targetId) {
          desc += ` #${log.targetId}`
        }

        const createdAt = log.createdAt.toJSDate()
        const now = new Date()
        const diffMs = now.getTime() - createdAt.getTime()
        const diffMins = Math.floor(diffMs / 60000)

        let time = ''
        if (diffMins < 1) {
          time = 'Just now'
        } else if (diffMins < 60) {
          time = `${diffMins}m ago`
        } else if (diffMins < 1440) {
          time = `${Math.floor(diffMins / 60)}h ago`
        } else {
          time = `${Math.floor(diffMins / 1440)}d ago`
        }

        return { desc, time }
      })

      return response.ok(activities)
    } catch (error) {
      Logger.error('Admin recent activity error: %o', error)
      return response.ok([]) // Return empty array on error to prevent UI breaking
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

  /**
   * Get system settings
   */
  public async getSystemSettings({ auth, response }: HttpContextContract) {
    try {
      await this.requireSuperAdmin(auth)
      const { default: SystemSetting } = await import('App/Models/SystemSetting')
      const settings = await SystemSetting.query().orderBy('category', 'asc').orderBy('key', 'asc')
      return response.ok(settings)
    } catch (error) {
      Logger.error('Get system settings error: %o', error)
      return response.unauthorized({ error: { message: error.message || 'Access denied' } })
    }
  }

  /**
   * Update system settings
   */
  public async updateSystemSettings({ auth, request, response }: HttpContextContract) {
    try {
      const admin = await this.requireSuperAdmin(auth)

      const settings = request.body()
      const keys = Object.keys(settings)

      // Fetch previous values for audit trail
      const existingRows = keys.length
        ? await Database.from('system_settings').whereIn('key', keys).select('key', 'value')
        : []

      const previousValues: Record<string, any> = {}
      for (const row of existingRows) {
        try {
          previousValues[row.key] = JSON.parse(row.value)
        } catch {
          previousValues[row.key] = row.value
        }
      }

      // Validate and save each setting
      // Validate and save each setting
      const SystemSetting = (await import('App/Models/SystemSetting')).default

      for (const [key, value] of Object.entries(settings)) {
        // Ensure objects are valid JSON-serializable
        if (typeof value === 'object') {
          try {
            JSON.stringify(value)
          } catch (err) {
            throw new Error(`Invalid JSON for key ${key}`)
          }
        }

        const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value)

        await SystemSetting.updateOrCreate({ key }, { value: stringValue })
      }

      // Log the action with previous and new values for full auditability
      await AuditLog.safeCreate({
        userId: admin.id,
        action: 'system_setting_updated',
        targetType: 'system',
        targetId: null,
        details: `Updated multiple system settings: ${keys.join(', ')}`,
        metadata: JSON.stringify({ keys, previousValues, newValues: settings }),
        ipAddress: request.ip()
      })

      return response.ok({ message: 'Settings updated successfully' })
    } catch (error) {
      Logger.error('Update system settings error: %o', error)
      return response.internalServerError({
        message: 'Failed to update settings',
        error: error.message
      })
    }
  }

  /**
   * Update platform branding (supports JSON body Or Multipart for file uploads)
   */
  public async updateBranding({ auth, request, response }: HttpContextContract) {
    try {
      const admin = await this.requireSuperAdmin(auth)
      const SystemSetting = (await import('App/Models/SystemSetting')).default

      const branding: Record<string, any> = request.only([
        'platform_name',
        'platform_tagline',
        'primary_color',
        'secondary_color',
        'logo_url',
        'favicon_url'
      ])

      // Handle file uploads for logo and favicon if present (multipart)
      const files = {
        logo: request.file('logo'),
        favicon: request.file('favicon')
      }

      for (const [key, file] of Object.entries(files)) {
        if (file) {
          await file.moveToDisk('local', { dirname: 'branding' })
          const filename = file.fileName
          const tmpRoot = Application.tmpPath('uploads')
          const destDir = `${tmpRoot}/branding`
          if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true })

          const candidates = [
            `${tmpRoot}/branding/${filename}`,
            `${tmpRoot}/local/branding/${filename}`,
            `${tmpRoot}/local/${filename}`,
            `${tmpRoot}/${filename}`
          ]

          let found: string | null = null
          for (const c of candidates) {
            if (fs.existsSync(c)) {
              found = c
              break
            }
          }

          if (found && found !== `${destDir}/${filename}`) {
            fs.renameSync(found, `${destDir}/${filename}`)
          }

          branding[`${key}_url`] = `/uploads/branding/${filename}`

          // Generate thumbnail for logo only
          if (key === 'logo') {
            try {
              const thumbDir = `${destDir}/thumbs`
              if (!fs.existsSync(thumbDir)) fs.mkdirSync(thumbDir, { recursive: true })
              const maybeSharp = await import('sharp').catch(() => null)
              const sharpLib = maybeSharp ? (maybeSharp.default ?? maybeSharp) : null
              if (sharpLib) {
                await sharpLib(`${destDir}/${filename}`)
                  .resize(200, 200, { fit: 'contain' })
                  .toFile(`${thumbDir}/${filename}`)
              }
            } catch (err) {
              Logger.warn('Branding logo thumbnail generation failed: %o', err)
            }
          }
        }
      }

      const keys = Object.keys(branding).filter((k) => branding[k] !== undefined)
      if (keys.length === 0) return response.badRequest({ message: 'No branding data provided' })

      // Fetch previous values for audit log
      const rows = await Database.from('system_settings')
        .whereIn('key', keys)
        .select('key', 'value')
      const previous: Record<string, any> = {}
      rows.forEach((r) => (previous[r.key] = r.value))

      // Update settings
      for (const [key, value] of Object.entries(branding)) {
        if (value !== undefined) {
          await SystemSetting.updateOrCreate({ key }, { value: String(value) })
        }
      }

      await AuditLog.safeCreate({
        userId: admin.id,
        action: 'system_setting_updated',
        targetType: 'system',
        targetId: null,
        details: `Updated branding settings: ${keys.join(', ')}`,
        metadata: JSON.stringify({ previous, new: branding }),
        ipAddress: request.ip()
      })

      return response.ok({ message: 'Branding updated successfully', branding })
    } catch (error) {
      Logger.error('Update branding error: %o', error)
      return response.internalServerError({
        message: 'Failed to update branding',
        error: error.message
      })
    }
  }

  /**
   * Create a database backup and queue processing on the server.
   * This implementation creates a Backup record and starts a background
   * process that exports core entities to a gzipped JSON file.
   */
  public async createBackup({ auth, response }: HttpContextContract) {
    try {
      const admin = await this.requireSuperAdmin(auth)

      const BackupModel = (await import('App/Models/Backup')).default
      const backup = await BackupModel.create({
        backupType: 'full',
        organizationId: null,
        createdBy: admin.id,
        filePath: '',
        fileSize: 0,
        status: 'creating'
      })

      // Start background processing (fire-and-forget)
      const BackupService = (await import('App/Services/BackupService')).default
      BackupService.processBackup(backup.id).catch((err: any) => {
        Logger.error('Backup processing failed for id %s: %o', backup.id, err)
      })

      // Log the request
      await AuditLog.safeCreate({
        userId: admin.id,
        action: 'backup_requested',
        targetType: 'system',
        targetId: 0,
        metadata: JSON.stringify({ backupId: backup.id, requestedAt: new Date().toISOString() })
      })

      return response.ok({ id: backup.id, status: backup.status, message: 'Backup queued' })
    } catch (error) {
      Logger.error('Create backup error: %o', error)
      return response.unauthorized({ error: { message: error.message || 'Access denied' } })
    }
  }

  /**
   * Get backup status (reads Backup records)
   */
  public async backupStatus({ auth, response }: HttpContextContract) {
    try {
      await this.requireSuperAdmin(auth)

      const BackupModel = (await import('App/Models/Backup')).default
      const backups = await BackupModel.query().orderBy('created_at', 'desc').limit(10)

      const mapped = backups.map((b) => ({
        id: b.id,
        backupType: b.backupType,
        status: b.status,
        createdAt: b.createdAt,
        fileSize: b.fileSize,
        downloadUrl: `/admin/backup/${b.id}/download`, // secure download endpoint
        downloadPath: b.filePath || null,
        includedEntities: b.getIncludedEntities()
      }))

      return response.ok({ lastBackup: mapped[0] || null, recentBackups: mapped })
    } catch (error) {
      Logger.error('Backup status error: %o', error)
      return response.unauthorized({ error: { message: error.message || 'Access denied' } })
    }
  }

  /**
   * Download a completed backup file (only super admins)
   */
  public async downloadBackup({ auth, params, response }: HttpContextContract) {
    try {
      await this.requireSuperAdmin(auth)
      const id = params.id
      const BackupModel = (await import('App/Models/Backup')).default
      const backup = await BackupModel.findOrFail(id)

      if (backup.status !== 'completed') {
        return response.badRequest({ message: 'Backup not available for download' })
      }

      // Try Drive first
      try {
        const Drive = await import('@ioc:Adonis/Core/Drive')
        // If stored in Drive, filePath will be disk path (e.g., backups/..)
        if (await Drive.exists(backup.filePath!)) {
          const stream = await Drive.getStream(backup.filePath!)
          response.header('Content-Type', 'application/gzip')
          response.header(
            'Content-Disposition',
            `attachment; filename="backup-${backup.id}.json.gz"`
          )
          return response.stream(stream)
        }
      } catch (e) {
        // Drive not available or file not on drive, fall back
      }

      // Fallback: local file path
      const fs = await import('fs')
      if (fs.existsSync(backup.filePath!)) {
        return response.download(backup.filePath!)
      }

      return response.notFound({ message: 'Backup file not found' })
    } catch (error) {
      Logger.error('Download backup error: %o', error)
      return response.unauthorized({ error: { message: error.message || 'Access denied' } })
    }
  }
}
