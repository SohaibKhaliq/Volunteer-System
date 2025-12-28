import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import OrganizationAnalyticsService from 'App/Services/OrganizationAnalyticsService'
import Organization from 'App/Models/Organization'
import Database from '@ioc:Adonis/Lucid/Database'
import User from 'App/Models/User'
import Logger from '@ioc:Adonis/Core/Logger'
import { DateTime } from 'luxon'
import OrganizationTeamMember from 'App/Models/OrganizationTeamMember'

export default class OrganizationDashboardController {
  /**
   * Check if user has access to organization dashboard
   */
  private async resolveOrganizationId(user: User, params: any): Promise<number | null> {
    // Prefer explicit route param if provided
    if (params?.id) {
      const parsed = Number(params.id)
      if (!Number.isNaN(parsed)) return parsed
    }

    // Fall back to the organization where the user is a team member (org admin/manager)
    const memberRecord = await OrganizationTeamMember.query().where('userId', user.id).first()
    if (memberRecord) return memberRecord.organizationId

    // Fallback: org volunteer admin role
    const volunteerMembership = await Database.from('organization_volunteers')
      .where('user_id', user.id)
      .where('role', 'admin')
      .where('status', 'active')
      .first()
    if (volunteerMembership) return volunteerMembership.organization_id

    return null
  }

  private async checkAccess(
    user: User,
    organizationId: number
  ): Promise<{ hasAccess: boolean; message?: string }> {
    // System admins can access all organizations
    if (user.isAdmin) {
      return { hasAccess: true }
    }

    // Check if user is an admin of this organization via team membership or volunteer record
    const teamMembership = await OrganizationTeamMember.query()
      .where('userId', user.id)
      .where('organizationId', organizationId)
      .whereIn('role', ['Admin', 'admin', 'Owner', 'owner', 'Manager', 'manager'])
      .first()

    if (teamMembership) return { hasAccess: true }

    const volunteerMembership = await Database.from('organization_volunteers')
      .where('user_id', user.id)
      .where('organization_id', organizationId)
      .whereIn('role', ['admin', 'owner', 'manager'])
      .where('status', 'active')
      .first()

    if (volunteerMembership) return { hasAccess: true }

    return {
      hasAccess: false,
      message: 'You do not have permission to access this organization dashboard'
    }
  }

  /**
   * Parse date range from query parameters
   */
  private parseDateRange(request: HttpContextContract['request']): {
    from: DateTime
    to: DateTime
  } {
    const { from, to, preset } = request.qs()

    if (preset) {
      const now = DateTime.now()
      switch (preset) {
        case 'today':
          return { from: now.startOf('day'), to: now.endOf('day') }
        case 'week':
          return { from: now.startOf('week'), to: now.endOf('week') }
        case 'month':
          return { from: now.startOf('month'), to: now.endOf('month') }
        case 'quarter':
          return { from: now.startOf('quarter'), to: now.endOf('quarter') }
        case 'year':
          return { from: now.startOf('year'), to: now.endOf('year') }
        case 'last30days':
          return { from: now.minus({ days: 30 }), to: now }
        case 'last90days':
          return { from: now.minus({ days: 90 }), to: now }
        case 'last12months':
          return { from: now.minus({ months: 12 }), to: now }
        default:
          return { from: now.minus({ months: 12 }), to: now }
      }
    }

    const fromDate = from ? DateTime.fromISO(from) : DateTime.now().minus({ months: 12 })
    const toDate = to ? DateTime.fromISO(to) : DateTime.now()

    return { from: fromDate, to: toDate }
  }

  /**
   * Get dashboard overview statistics
   */
  public async overview({ auth, params, request, response }: HttpContextContract) {
    try {
      await auth.use('api').authenticate()
      const user = auth.user!
      const organizationId = await this.resolveOrganizationId(user, params)

      if (!organizationId) {
        return response.notFound({ error: { message: 'Organization not found for user' } })
      }

      // Check access
      const access = await this.checkAccess(user, organizationId)
      if (!access.hasAccess) {
        return response.unauthorized({ error: { message: access.message } })
      }

      // Verify organization exists
      const organization = await Organization.find(organizationId)
      if (!organization) {
        return response.notFound({ error: { message: 'Organization not found' } })
      }

      const dateRange = this.parseDateRange(request)

      const stats = await OrganizationAnalyticsService.getOverviewStats(organizationId, dateRange)

      return response.ok({
        organization: {
          id: organization.id,
          name: organization.name
        },
        dateRange: {
          from: dateRange.from.toISODate(),
          to: dateRange.to.toISODate()
        },
        stats
      })
    } catch (error) {
      Logger.error('Dashboard overview error: %o', error)
      return response.internalServerError({
        error: { message: 'Failed to load dashboard overview' }
      })
    }
  }

  /**
   * Get hours trend data
   */
  public async hoursTrend({ auth, params, request, response }: HttpContextContract) {
    try {
      await auth.use('api').authenticate()
      const user = auth.user!
      const organizationId = await this.resolveOrganizationId(user, params)

      if (!organizationId) {
        return response.notFound({ error: { message: 'Organization not found for user' } })
      }

      const access = await this.checkAccess(user, organizationId)
      if (!access.hasAccess) {
        return response.unauthorized({ error: { message: access.message } })
      }

      const dateRange = this.parseDateRange(request)
      const { groupBy = 'week' } = request.qs()

      const trend = await OrganizationAnalyticsService.getHoursTrend(
        organizationId,
        dateRange,
        groupBy as 'day' | 'week' | 'month'
      )

      return response.ok({
        dateRange: {
          from: dateRange.from.toISODate(),
          to: dateRange.to.toISODate()
        },
        groupBy,
        data: trend
      })
    } catch (error) {
      Logger.error('Hours trend error: %o', error)
      return response.internalServerError({
        error: { message: 'Failed to load hours trend' }
      })
    }
  }

  /**
   * Get volunteer participation metrics
   */
  public async participation({ auth, params, request, response }: HttpContextContract) {
    try {
      await auth.use('api').authenticate()
      const user = auth.user!
      const organizationId = await this.resolveOrganizationId(user, params)

      if (!organizationId) {
        return response.notFound({ error: { message: 'Organization not found for user' } })
      }

      const access = await this.checkAccess(user, organizationId)
      if (!access.hasAccess) {
        return response.unauthorized({ error: { message: access.message } })
      }

      const dateRange = this.parseDateRange(request)

      const participation = await OrganizationAnalyticsService.getVolunteerParticipation(
        organizationId,
        dateRange
      )

      return response.ok({
        dateRange: {
          from: dateRange.from.toISODate(),
          to: dateRange.to.toISODate()
        },
        data: participation
      })
    } catch (error) {
      Logger.error('Participation error: %o', error)
      return response.internalServerError({
        error: { message: 'Failed to load participation metrics' }
      })
    }
  }

  /**
   * Get event performance data
   */
  public async events({ auth, params, request, response }: HttpContextContract) {
    try {
      await auth.use('api').authenticate()
      const user = auth.user!
      const organizationId = await this.resolveOrganizationId(user, params)

      if (!organizationId) {
        return response.notFound({ error: { message: 'Organization not found for user' } })
      }

      const access = await this.checkAccess(user, organizationId)
      if (!access.hasAccess) {
        return response.unauthorized({ error: { message: access.message } })
      }

      const dateRange = this.parseDateRange(request)
      const { limit = 20 } = request.qs()

      const events = await OrganizationAnalyticsService.getEventPerformance(
        organizationId,
        dateRange,
        Number(limit)
      )

      return response.ok({
        dateRange: {
          from: dateRange.from.toISODate(),
          to: dateRange.to.toISODate()
        },
        data: events
      })
    } catch (error) {
      Logger.error('Event performance error: %o', error)
      return response.internalServerError({
        error: { message: 'Failed to load event performance' }
      })
    }
  }

  /**
   * Get compliance status
   */
  public async compliance({ auth, params, response }: HttpContextContract) {
    try {
      await auth.use('api').authenticate()
      const user = auth.user!
      const organizationId = await this.resolveOrganizationId(user, params)

      if (!organizationId) {
        return response.notFound({ error: { message: 'Organization not found for user' } })
      }

      const access = await this.checkAccess(user, organizationId)
      if (!access.hasAccess) {
        return response.unauthorized({ error: { message: access.message } })
      }

      const compliance = await OrganizationAnalyticsService.getComplianceStatus(organizationId)

      return response.ok({ data: compliance })
    } catch (error) {
      Logger.error('Compliance status error: %o', error)
      return response.internalServerError({
        error: { message: 'Failed to load compliance status' }
      })
    }
  }

  /**
   * Get engagement metrics
   */
  public async engagement({ auth, params, request, response }: HttpContextContract) {
    try {
      await auth.use('api').authenticate()
      const user = auth.user!
      const organizationId = await this.resolveOrganizationId(user, params)

      if (!organizationId) {
        return response.notFound({ error: { message: 'Organization not found for user' } })
      }

      const access = await this.checkAccess(user, organizationId)
      if (!access.hasAccess) {
        return response.unauthorized({ error: { message: access.message } })
      }

      const dateRange = this.parseDateRange(request)

      const engagement = await OrganizationAnalyticsService.getEngagementMetrics(
        organizationId,
        dateRange
      )

      return response.ok({
        dateRange: {
          from: dateRange.from.toISODate(),
          to: dateRange.to.toISODate()
        },
        data: engagement
      })
    } catch (error) {
      Logger.error('Engagement metrics error: %o', error)
      return response.internalServerError({
        error: { message: 'Failed to load engagement metrics' }
      })
    }
  }

  /**
   * Get top volunteers leaderboard
   */
  public async topVolunteers({ auth, params, request, response }: HttpContextContract) {
    try {
      await auth.use('api').authenticate()
      const user = auth.user!
      const organizationId = await this.resolveOrganizationId(user, params)

      if (!organizationId) {
        return response.notFound({ error: { message: 'Organization not found for user' } })
      }

      const access = await this.checkAccess(user, organizationId)
      if (!access.hasAccess) {
        return response.unauthorized({ error: { message: access.message } })
      }

      const dateRange = this.parseDateRange(request)
      const { limit = 10 } = request.qs()

      const topVolunteers = await OrganizationAnalyticsService.getTopVolunteers(
        organizationId,
        dateRange,
        Number(limit)
      )

      return response.ok({
        dateRange: {
          from: dateRange.from.toISODate(),
          to: dateRange.to.toISODate()
        },
        data: topVolunteers
      })
    } catch (error) {
      Logger.error('Top volunteers error: %o', error)
      return response.internalServerError({
        error: { message: 'Failed to load top volunteers' }
      })
    }
  }

  /**
   * Get all dashboard data in one request (for initial page load)
   */
  public async all({ auth, params, request, response }: HttpContextContract) {
    try {
      await auth.use('api').authenticate()
      const user = auth.user!
      const organizationId = await this.resolveOrganizationId(user, params)

      if (!organizationId) {
        return response.notFound({ error: { message: 'Organization not found for user' } })
      }

      const access = await this.checkAccess(user, organizationId)
      if (!access.hasAccess) {
        return response.unauthorized({ error: { message: access.message } })
      }

      const organization = await Organization.find(organizationId)
      if (!organization) {
        return response.notFound({ error: { message: 'Organization not found' } })
      }

      const dateRange = this.parseDateRange(request)

      // Fetch all data in parallel
      const [overview, hoursTrend, participation, events, compliance, engagement, topVolunteers] =
        await Promise.all([
          OrganizationAnalyticsService.getOverviewStats(organizationId, dateRange),
          OrganizationAnalyticsService.getHoursTrend(organizationId, dateRange, 'week'),
          OrganizationAnalyticsService.getVolunteerParticipation(organizationId, dateRange),
          OrganizationAnalyticsService.getEventPerformance(organizationId, dateRange, 10),
          OrganizationAnalyticsService.getComplianceStatus(organizationId),
          OrganizationAnalyticsService.getEngagementMetrics(organizationId, dateRange),
          OrganizationAnalyticsService.getTopVolunteers(organizationId, dateRange, 10)
        ])

      return response.ok({
        organization: {
          id: organization.id,
          name: organization.name
        },
        dateRange: {
          from: dateRange.from.toISODate(),
          to: dateRange.to.toISODate()
        },
        overview,
        hoursTrend,
        participation,
        events,
        compliance,
        engagement,
        topVolunteers
      })
    } catch (error) {
      Logger.error('Dashboard all data error: %o', error)
      return response.internalServerError({
        error: { message: 'Failed to load dashboard data' }
      })
    }
  }
}
