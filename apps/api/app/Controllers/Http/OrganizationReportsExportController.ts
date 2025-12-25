import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import ReportGenerationService from 'App/Services/ReportGenerationService'
import Organization from 'App/Models/Organization'
import Database from '@ioc:Adonis/Lucid/Database'
import User from 'App/Models/User'
import Logger from '@ioc:Adonis/Core/Logger'
import { DateTime } from 'luxon'

export default class OrganizationReportsExportController {
  /**
   * Check if user has access to organization reports
   */
  private async checkAccess(
    user: User,
    organizationId: number
  ): Promise<{ hasAccess: boolean; message?: string }> {
    if (user.isAdmin) {
      return { hasAccess: true }
    }

    const membership = await Database.from('organization_volunteers')
      .where('user_id', user.id)
      .where('organization_id', organizationId)
      .where('role', 'admin')
      .where('status', 'active')
      .first()

    if (!membership) {
      return {
        hasAccess: false,
        message: 'You do not have permission to access organization reports'
      }
    }

    return { hasAccess: true }
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
          return { from: now.minus({ months: 1 }), to: now }
      }
    }

    const fromDate = from ? DateTime.fromISO(from) : DateTime.now().minus({ months: 1 })
    const toDate = to ? DateTime.fromISO(to) : DateTime.now()

    return { from: fromDate, to: toDate }
  }

  /**
   * Generate and download volunteer hours report
   */
  public async volunteerHoursReport({ auth, params, request, response }: HttpContextContract) {
    try {
      await auth.use('api').authenticate()
      const user = auth.user!
      const organizationId = Number(params.id)

      const access = await this.checkAccess(user, organizationId)
      if (!access.hasAccess) {
        return response.unauthorized({ error: { message: access.message } })
      }

      const organization = await Organization.find(organizationId)
      if (!organization) {
        return response.notFound({ error: { message: 'Organization not found' } })
      }

      const dateRange = this.parseDateRange(request)
      const { format = 'csv' } = request.qs()

      const reportData = await ReportGenerationService.generateVolunteerHoursReport(
        organizationId,
        dateRange
      )

      if (format === 'csv') {
        const { filePath } = await ReportGenerationService.exportToCSV(reportData, {
          filename: `volunteer_hours_${organization.name.replace(/\s+/g, '_')}`
        })

        return response.download(filePath)
      }

      return response.ok(reportData)
    } catch (error) {
      Logger.error('Volunteer hours report error: %o', error)
      return response.internalServerError({
        error: { message: 'Failed to generate volunteer hours report' }
      })
    }
  }

  /**
   * Generate and download volunteer summary report
   */
  public async volunteerSummaryReport({ auth, params, request, response }: HttpContextContract) {
    try {
      await auth.use('api').authenticate()
      const user = auth.user!
      const organizationId = Number(params.id)

      const access = await this.checkAccess(user, organizationId)
      if (!access.hasAccess) {
        return response.unauthorized({ error: { message: access.message } })
      }

      const organization = await Organization.find(organizationId)
      if (!organization) {
        return response.notFound({ error: { message: 'Organization not found' } })
      }

      const dateRange = this.parseDateRange(request)
      const { format = 'csv' } = request.qs()

      const reportData = await ReportGenerationService.generateVolunteerSummaryReport(
        organizationId,
        dateRange
      )

      if (format === 'csv') {
        const { filePath } = await ReportGenerationService.exportToCSV(reportData, {
          filename: `volunteer_summary_${organization.name.replace(/\s+/g, '_')}`
        })

        return response.download(filePath)
      }

      return response.ok(reportData)
    } catch (error) {
      Logger.error('Volunteer summary report error: %o', error)
      return response.internalServerError({
        error: { message: 'Failed to generate volunteer summary report' }
      })
    }
  }

  /**
   * Generate and download event performance report
   */
  public async eventPerformanceReport({ auth, params, request, response }: HttpContextContract) {
    try {
      await auth.use('api').authenticate()
      const user = auth.user!
      const organizationId = Number(params.id)

      const access = await this.checkAccess(user, organizationId)
      if (!access.hasAccess) {
        return response.unauthorized({ error: { message: access.message } })
      }

      const organization = await Organization.find(organizationId)
      if (!organization) {
        return response.notFound({ error: { message: 'Organization not found' } })
      }

      const dateRange = this.parseDateRange(request)
      const { format = 'csv' } = request.qs()

      const reportData = await ReportGenerationService.generateEventPerformanceReport(
        organizationId,
        dateRange
      )

      if (format === 'csv') {
        const { filePath } = await ReportGenerationService.exportToCSV(reportData, {
          filename: `event_performance_${organization.name.replace(/\s+/g, '_')}`
        })

        return response.download(filePath)
      }

      return response.ok(reportData)
    } catch (error) {
      Logger.error('Event performance report error: %o', error)
      return response.internalServerError({
        error: { message: 'Failed to generate event performance report' }
      })
    }
  }

  /**
   * Generate and download compliance report
   */
  public async complianceReport({ auth, params, request, response }: HttpContextContract) {
    try {
      await auth.use('api').authenticate()
      const user = auth.user!
      const organizationId = Number(params.id)

      const access = await this.checkAccess(user, organizationId)
      if (!access.hasAccess) {
        return response.unauthorized({ error: { message: access.message } })
      }

      const organization = await Organization.find(organizationId)
      if (!organization) {
        return response.notFound({ error: { message: 'Organization not found' } })
      }

      const { format = 'csv' } = request.qs()

      const reportData = await ReportGenerationService.generateComplianceReport(organizationId)

      if (format === 'csv') {
        const { filePath } = await ReportGenerationService.exportToCSV(reportData, {
          filename: `compliance_${organization.name.replace(/\s+/g, '_')}`
        })

        return response.download(filePath)
      }

      return response.ok(reportData)
    } catch (error) {
      Logger.error('Compliance report error: %o', error)
      return response.internalServerError({
        error: { message: 'Failed to generate compliance report' }
      })
    }
  }

  /**
   * List available report types
   */
  public async listReports({ auth, params, response }: HttpContextContract) {
    try {
      await auth.use('api').authenticate()
      const user = auth.user!
      const organizationId = Number(params.id)

      const access = await this.checkAccess(user, organizationId)
      if (!access.hasAccess) {
        return response.unauthorized({ error: { message: access.message } })
      }

      const reports = [
        {
          id: 'volunteer-hours',
          name: 'Volunteer Hours Report',
          description: 'Detailed breakdown of volunteer hours by volunteer and event',
          endpoint: `/organizations/${organizationId}/reports/volunteer-hours-export`,
          supportsDateRange: true,
          formats: ['csv', 'json']
        },
        {
          id: 'volunteer-summary',
          name: 'Volunteer Summary Report',
          description: 'Summary of total hours and entries per volunteer',
          endpoint: `/organizations/${organizationId}/reports/volunteer-summary-export`,
          supportsDateRange: true,
          formats: ['csv', 'json']
        },
        {
          id: 'event-performance',
          name: 'Event Performance Report',
          description: 'Event attendance rates and volunteer hours by event',
          endpoint: `/organizations/${organizationId}/reports/event-performance-export`,
          supportsDateRange: true,
          formats: ['csv', 'json']
        },
        {
          id: 'compliance',
          name: 'Compliance Status Report',
          description: 'Volunteer compliance status for all required documents',
          endpoint: `/organizations/${organizationId}/reports/compliance-export`,
          supportsDateRange: false,
          formats: ['csv', 'json']
        }
      ]

      return response.ok({ reports })
    } catch (error) {
      Logger.error('List reports error: %o', error)
      return response.internalServerError({
        error: { message: 'Failed to list reports' }
      })
    }
  }
}
