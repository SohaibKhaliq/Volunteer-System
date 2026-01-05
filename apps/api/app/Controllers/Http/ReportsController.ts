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
      // Return safe empty overview so dashboard doesn't break
      return response.ok({
        volunteerParticipation: { total: 0, active: 0, inactive: 0, trend: [] },
        eventCompletion: { total: 0, completed: 0, ongoing: 0, cancelled: 0, completionRate: 0 },
        volunteerHours: { total: 0, thisMonth: 0, lastMonth: 0, trend: [] },
        organizationPerformance: { topPerformers: [], averageScore: 0 },
        complianceAdherence: { compliant: 0, pending: 0, expired: 0, adherenceRate: 0 },
        predictions: {
          volunteerDemand: { nextMonth: 0, confidence: 0 },
          noShowRate: 0,
          eventSuccessRate: 0
        },
        error: { message: 'Unable to fetch reports', details: error?.message ?? String(error) }
      })
    }
  }

  /**
   * Get volunteer participation statistics
   */
  public async volunteerStats({ request, response }: HttpContextContract) {
    try {
      const data = await this.buildVolunteerStats(request.qs())
      return response.ok(data)
    } catch (error) {
      Logger.error('Failed to fetch volunteer stats: %o', error)
      return response.ok({
        total: 0,
        active: 0,
        newSignups: 0,
        participationRate: 0,
        error: error?.message ?? String(error)
      })
    }
  }

  // Extracted helper so callers (including export) can obtain raw data without
  // sending an HTTP response directly.
  private async buildVolunteerStats(qs: Record<string, any>) {
    const { range = '30days' } = qs || {}
    const daysAgo = range === '30days' ? 30 : range === '7days' ? 7 : 365

    const since = new Date()
    since.setDate(since.getDate() - daysAgo)

    const totalVolunteers = await User.query().count('* as total')
    const activeVolunteers = await User.query()
      .whereNotNull('email_verified_at')
      .count('* as total')

    const newVolunteers = await User.query()
      .where('created_at', '>=', since.toISOString())
      .count('* as total')

    // Participation rate
    const volunteersWithHours = await Database.from('volunteer_hours')
      .distinct('user_id')
      .count('* as total')

    return {
      total: totalVolunteers[0].$extras.total || 0,
      active: activeVolunteers[0].$extras.total || 0,
      newSignups: newVolunteers[0].$extras.total || 0,
      participationRate:
        totalVolunteers[0].$extras.total > 0
          ? Math.round((volunteersWithHours[0].total / totalVolunteers[0].$extras.total) * 100)
          : 0
    }
  }

  /**
   * Get event completion statistics
   */
  public async eventStats({ request, response }: HttpContextContract) {
    try {
      const data = await this.buildEventStats(request.qs())
      return response.ok(data)
    } catch (error) {
      Logger.error('Failed to fetch event stats: %o', error)
      return response.ok({
        total: 0,
        byStatus: [],
        completionRate: 0,
        error: error?.message ?? String(error)
      })
    }
  }

  private async buildEventStats(qs: Record<string, any>) {
    const { range = '30days' } = qs || {}
    const daysAgo = range === '30days' ? 30 : range === '7days' ? 7 : 365

    const since = new Date()
    since.setDate(since.getDate() - daysAgo)

    // Fetch all events in the date range
    const events = await Event.query().where('created_at', '>=', since.toISOString())

    const now = new Date()
    const statusCounts = {
      upcoming: 0,
      ongoing: 0,
      completed: 0,
    }

    // Calculate status based on event dates
    events.forEach((event) => {
      const startAt = event.startAt ? event.startAt.toJSDate() : null
      const endAt = event.endAt ? event.endAt.toJSDate() : null

      if (!startAt) {
        // If no start date, consider it upcoming
        statusCounts.upcoming++
      } else if (now < startAt) {
        // Event hasn't started yet
        statusCounts.upcoming++
      } else if (endAt && now > endAt) {
        // Event has ended
        statusCounts.completed++
      } else {
        // Event is currently ongoing
        statusCounts.ongoing++
      }
    })

    // Format for frontend: array of {status, count}
    const byStatus = [
      { status: 'Upcoming', count: statusCounts.upcoming },
      { status: 'Ongoing', count: statusCounts.ongoing },
      { status: 'Completed', count: statusCounts.completed },
    ].filter((item) => item.count > 0) // Only include statuses with events

    const totalEvents = events.length
    const completionRate =
      totalEvents > 0 ? Math.round((statusCounts.completed / totalEvents) * 100) : 0

    return {
      total: totalEvents,
      byStatus,
      completionRate,
    }
  }

  /**
   * Get volunteer hours analytics
   */
  public async hoursStats({ request, response }: HttpContextContract) {
    try {
      const data = await this.buildHoursStats(request.qs())
      return response.ok(data)
    } catch (error) {
      Logger.error('Failed to fetch hours stats: %o', error)
      return response.ok({
        total: 0,
        approved: 0,
        byStatus: [],
        topVolunteers: [],
        error: error?.message ?? String(error)
      })
    }
  }

  private async buildHoursStats(qs: Record<string, any>) {
    const { range = '30days' } = qs || {}
    const daysAgo = range === '30days' ? 30 : range === '7days' ? 7 : 365

    const since = new Date()
    since.setDate(since.getDate() - daysAgo)

    const totalHours = await VolunteerHour.query()
      .where('date', '>=', since.toISOString())
      .sum('hours as total')

    const approvedHours = await VolunteerHour.query()
      .where('date', '>=', since.toISOString())
      .where('status', 'approved')
      .sum('hours as total')

    const hoursByStatus = await VolunteerHour.query()
      .where('date', '>=', since.toISOString())
      .select('status')
      .sum('hours as total')
      .groupBy('status')

    const topVolunteers = await VolunteerHour.query()
      .where('date', '>=', since.toISOString())
      .where('status', 'approved')
      .select('user_id')
      .sum('hours as totalHours')
      .groupBy('user_id')
      .orderBy('totalHours', 'desc')
      .limit(10)

    return {
      total: totalHours[0].$extras.total || 0,
      approved: approvedHours[0].$extras.total || 0,
      byStatus: hoursByStatus,
      topVolunteers
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
        .withCount('volunteers' as any, (query) => {
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
      return response.ok({
        total: 0,
        topPerformers: [],
        error: error?.message ?? String(error)
      })
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

      const now = new Date()
      const in30 = new Date()
      in30.setDate(in30.getDate() + 30)

      const expiredDocs = await ComplianceDocument.query()
        .where('expires_at', '<', now.toISOString())
        .count('* as total')

      const expiringSoon = await ComplianceDocument.query()
        .whereBetween('expires_at', [now.toISOString(), in30.toISOString()])
        .count('* as total')

      const adherenceRate =
        totalDocs[0].$extras.total > 0
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
      return response.ok({
        total: 0,
        approved: 0,
        expired: 0,
        expiringSoon: 0,
        adherenceRate: 0,
        error: error?.message ?? String(error)
      })
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
          data = await this.buildVolunteerStats(request.qs())
          break
        case 'events':
          data = await this.buildEventStats(request.qs())
          break
        case 'hours':
          data = await this.buildHoursStats(request.qs())
          break
        default:
          data = await this.reportsService.overview('30days')
      }

      if (type === 'pdf') {
        try {
          const pdfBuffer = await this.reportsService.generatePdf(String(reportType || 'report'))
          response.header('Content-Type', 'application/pdf')
          response.header(
            'Content-Disposition',
            `attachment; filename="${reportType}-${Date.now()}.pdf"`
          )
          response.header('Content-Length', pdfBuffer.length)
          return response.send(pdfBuffer)
        } catch (e) {
          Logger.error('PDF Generation failed: %s', e.message)
          Logger.error('Stack: %s', e.stack)
          console.error('Full Error Object:', e)
          return response.status(500).send('Failed to generate PDF: ' + e.message)
        }
      }

      if (type === 'csv') {
        // Support CSV exports for some report types
        if (reportType === 'communications') {
          const rows = await (await import('App/Models/Communication')).default
            .query()
            .orderBy('created_at', 'desc')
          const cols = [
            'id',
            'subject',
            'type',
            'status',
            'sendAt',
            'sentAt',
            'targetAudience',
            'createdAt'
          ]
          const csv = [cols.join(',')]
            .concat(
              rows.map((r: any) =>
                cols
                  .map((c) => {
                    const v = r[c] ?? r[c === 'sendAt' ? 'send_at' : c]
                    if (v === null || v === undefined) return ''
                    return String(v).replace(/"/g, '""')
                  })
                  .join(',')
              )
            )
            .join('\n')

          response.header('Content-Type', 'text/csv')
          response.header(
            'Content-Disposition',
            `attachment; filename="communications-${Date.now()}.csv"`
          )
          return response.send(csv)
        }

        if (reportType === 'scheduled_jobs') {
          const rows = await (await import('App/Models/ScheduledJob')).default
            .query()
            .orderBy('created_at', 'desc')
          const cols = [
            'id',
            'name',
            'type',
            'status',
            'attempts',
            'runAt',
            'lastError',
            'createdAt'
          ]
          const csv = [cols.join(',')]
            .concat(
              rows.map((r: any) =>
                cols
                  .map((c) => {
                    const v = r[c] ?? (c === 'runAt' ? r.run_at : r[c])
                    if (v === null || v === undefined) return ''
                    return String(v).replace(/"/g, '""')
                  })
                  .join(',')
              )
            )
            .join('\n')

          response.header('Content-Type', 'text/csv')
          response.header(
            'Content-Disposition',
            `attachment; filename="scheduled-jobs-${Date.now()}.csv"`
          )
          return response.send(csv)
        }

        // Fallback message
        return response
          .header('Content-Type', 'text/csv')
          .send('CSV export not available for this report type')
      }

      return response.ok(data)
    } catch (error) {
      Logger.error('Failed to export report: %o', error)
      return response.ok({
        error: { message: 'Unable to export report', details: error?.message ?? String(error) }
      })
    }
  }
}
