import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Logger from '@ioc:Adonis/Core/Logger'
import { DateTime } from 'luxon'
import AdminAnalyticsService from 'App/Services/AdminAnalyticsService'
import AuditLogService from 'App/Services/AuditLogService'
import SystemMonitoringService from 'App/Services/SystemMonitoringService'

export default class SystemMonitoringController {
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
   * Get background jobs status
   */
  public async backgroundJobsStatus({ auth, response }: HttpContextContract) {
    try {
      await this.requireSuperAdmin(auth)

      const status = await SystemMonitoringService.getBackgroundJobsStatus()

      return response.ok(status)
    } catch (error) {
      Logger.error('Background jobs status error: %o', error)
      return response.unauthorized({ error: { message: error.message || 'Access denied' } })
    }
  }

  /**
   * Get import operations status
   */
  public async importOperations({ auth, response }: HttpContextContract) {
    try {
      await this.requireSuperAdmin(auth)

      const operations = await SystemMonitoringService.getImportOperations()

      return response.ok(operations)
    } catch (error) {
      Logger.error('Import operations error: %o', error)
      return response.unauthorized({ error: { message: error.message || 'Access denied' } })
    }
  }

  /**
   * Get notification delivery metrics
   */
  public async notificationDelivery({ auth, response }: HttpContextContract) {
    try {
      await this.requireSuperAdmin(auth)

      const metrics = await SystemMonitoringService.getNotificationDeliveryMetrics()

      return response.ok(metrics)
    } catch (error) {
      Logger.error('Notification delivery metrics error: %o', error)
      return response.unauthorized({ error: { message: error.message || 'Access denied' } })
    }
  }

  /**
   * Get error logs
   */
  public async errorLogs({ auth, request, response }: HttpContextContract) {
    try {
      await this.requireSuperAdmin(auth)

      const { limit = 50 } = request.qs()

      const errors = await SystemMonitoringService.getErrorLogs(Number(limit))

      return response.ok({ errors })
    } catch (error) {
      Logger.error('Error logs retrieval error: %o', error)
      return response.unauthorized({ error: { message: error.message || 'Access denied' } })
    }
  }

  /**
   * Get system health status
   */
  public async systemHealth({ auth, response }: HttpContextContract) {
    try {
      await this.requireSuperAdmin(auth)

      const health = await SystemMonitoringService.getSystemHealth()

      return response.ok(health)
    } catch (error) {
      Logger.error('System health check error: %o', error)
      return response.unauthorized({ error: { message: error.message || 'Access denied' } })
    }
  }
}
