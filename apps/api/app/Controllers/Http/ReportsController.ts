import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Logger from '@ioc:Adonis/Core/Logger'
import ReportsService from 'App/Services/ReportsService'
import User from 'App/Models/User'
import Event from 'App/Models/Event'
import Organization from 'App/Models/Organization'
import VolunteerHour from 'App/Models/VolunteerHour'
import ComplianceDocument from 'App/Models/ComplianceDocument'
import Database from '@ioc:Adonis/Lucid/Database'

export default class ReportsController {
  private reportsService = new ReportsService()

  /**
   * Get comprehensive analytics based on time range
   */
  public async index({ request, response }: HttpContextContract) {
    try {
      const { range = '30days', startDate, endDate } = request.qs()
      
      const data = await this.reportsService.overview(range)
      return response.ok(data)
    } catch (error) {
      Logger.error('Failed to fetch reports: %o', error)
      return response.badRequest({ error: { message: 'Unable to fetch reports' } })
    }
  }

  /**
   * Get volunteer participation statistics
   */
  public async volunteerStats({ request, response }: HttpContextContract) {
    try {
      const { range = '30days' } = request.qs()
      const daysAgo = range === '30days' ? 30 : range === '7days' ? 7 : 365

      const totalVolunteers = await User.query().count('* as total')
      const activeVolunteers = await User.query()
        .whereNotNull('emailVerifiedAt')
        .count('* as total')

      const newVolunteers = await User.query()
        .where('createdAt', '>=', Database.raw(`date('now', '-${daysAgo} days')`))
        .count('* as total')

      // Participation rate
      const volunteersWithHours = await Database.from('volunteer_hours')
        .distinct('user_id')
        .count('* as total')

      return response.ok({
        total: totalVolunteers[0].$extras.total,
        active: activeVolunteers[0].$extras.total,
        newSignups: newVolunteers[0].$extras.total,
        participationRate: totalVolunteers[0].$extras.total > 0
          ? Math.round((volunteersWithHours[0].total / totalVolunteers[0].$extras.total) * 100)
          : 0
      })
    } catch (error) {
      Logger.error('Failed to fetch volunteer stats: %o', error)
      return response.badRequest({ error: { message: 'Unable to fetch volunteer statistics' } })
    }
  }

  /**
   * Get event completion statistics
   */
  public async eventStats({ request, response }: HttpContextContract) {
    try {
      const { range = '30days' } = request.qs()
      const daysAgo = range === '30days' ? 30 : range === '7days' ? 7 : 365

      const eventsByStatus = await Event.query()
        .where('createdAt', '>=', Database.raw(`date('now', '-${daysAgo} days')`))
        .select('status')
        .count('* as count')
        .groupBy('status')

      const totalEvents = await Event.query()
        .where('createdAt', '>=', Database.raw(`date('now', '-${daysAgo} days')`))
        .count('* as total')

      // Calculate completion rate
      const completedEvents = eventsByStatus.find((e: any) => e.status === 'completed')
      const completionRate = totalEvents[0].$extras.total > 0
        ? Math.round(((completedEvents?.count || 0) / totalEvents[0].$extras.total) * 100)
        : 0

      return response.ok({
        total: totalEvents[0].$extras.total,
        byStatus: eventsByStatus,
        completionRate
      })
    } catch (error) {
      Logger.error('Failed to fetch event stats: %o', error)
      return response.badRequest({ error: { message: 'Unable to fetch event statistics' } })
    }
  }

  /**
   * Get volunteer hours analytics
   */
  public async hoursStats({ request, response }: HttpContextContract) {
    try {
      const { range = '30days' } = request.qs()
      const daysAgo = range === '30days' ? 30 : range === '7days' ? 7 : 365

      const totalHours = await VolunteerHour.query()
        .where('date', '>=', Database.raw(`date('now', '-${daysAgo} days')`))
        .sum('hours as total')

      const approvedHours = await VolunteerHour.query()
        .where('date', '>=', Database.raw(`date('now', '-${daysAgo} days')`))
        .where('status', 'Approved')
        .sum('hours as total')

      const hoursByStatus = await VolunteerHour.query()
        .where('date', '>=', Database.raw(`date('now', '-${daysAgo} days')`))
        .select('status')
        .sum('hours as total')
        .groupBy('status')

      // Top volunteers by hours
      const topVolunteers = await VolunteerHour.query()
        .where('date', '>=', Database.raw(`date('now', '-${daysAgo} days')`))
        .where('status', 'Approved')
        .select('user_id')
        .sum('hours as totalHours')
        .groupBy('user_id')
        .orderBy('totalHours', 'desc')
        .limit(10)

      return response.ok({
        total: totalHours[0].$extras.total || 0,
        approved: approvedHours[0].$extras.total || 0,
        byStatus: hoursByStatus,
        topVolunteers
      })
    } catch (error) {
      Logger.error('Failed to fetch hours stats: %o', error)
      return response.badRequest({ error: { message: 'Unable to fetch hours statistics' } })
    }
  }

  /**
   * Get organization performance metrics
   */
  public async organizationStats({ response }: HttpContextContract) {
    try {
      const orgs = await Organization.query()
        .select('id', 'name')
        .withCount('events')
        .withCount('volunteers', (query) => {
          query.as('volunteer_count')
        })

      const topPerformers = orgs
        .sort((a, b) => (b.$extras.events_count || 0) - (a.$extras.events_count || 0))
        .slice(0, 10)

      return response.ok({
        total: orgs.length,
        topPerformers: topPerformers.map((org) => ({
          id: org.id,
          name: org.name,
          eventsCount: org.$extras.events_count || 0,
          volunteersCount: org.$extras.volunteer_count || 0
        }))
      })
    } catch (error) {
      Logger.error('Failed to fetch organization stats: %o', error)
      return response.badRequest({ error: { message: 'Unable to fetch organization statistics' } })
    }
  }

  /**
   * Get compliance adherence statistics
   */
  public async complianceStats({ response }: HttpContextContract) {
    try {
      const totalDocs = await ComplianceDocument.query().count('* as total')
      const approvedDocs = await ComplianceDocument.query()
        .where('status', 'approved')
        .count('* as total')

      const expiredDocs = await ComplianceDocument.query()
        .where('expiresAt', '<', new Date())
        .count('* as total')

      const expiringSoon = await ComplianceDocument.query()
        .whereBetween('expiresAt', [
          new Date(),
          Database.raw("date('now', '+30 days')")
        ])
        .count('* as total')

      const adherenceRate = totalDocs[0].$extras.total > 0
        ? Math.round((approvedDocs[0].$extras.total / totalDocs[0].$extras.total) * 100)
        : 0

      return response.ok({
        total: totalDocs[0].$extras.total,
        approved: approvedDocs[0].$extras.total,
        expired: expiredDocs[0].$extras.total,
        expiringSoon: expiringSoon[0].$extras.total,
        adherenceRate
      })
    } catch (error) {
      Logger.error('Failed to fetch compliance stats: %o', error)
      return response.badRequest({ error: { message: 'Unable to fetch compliance statistics' } })
    }
  }

  /**
   * Export report data as CSV or JSON
   */
  public async export({ request, response }: HttpContextContract) {
    try {
      const { type = 'json', reportType = 'overview' } = request.qs()

      let data
      switch (reportType) {
        case 'volunteers':
          data = await this.volunteerStats({ request, response } as any)
          break
        case 'events':
          data = await this.eventStats({ request, response } as any)
          break
        case 'hours':
          data = await this.hoursStats({ request, response } as any)
          break
        default:
          data = await this.reportsService.overview('30days')
      }

      if (type === 'csv') {
        // TODO: Implement CSV conversion
        return response.header('Content-Type', 'text/csv').send('CSV export coming soon')
      }

      return response.ok(data)
    } catch (error) {
      Logger.error('Failed to export report: %o', error)
      return response.badRequest({ error: { message: 'Unable to export report' } })
    }
  }
}
