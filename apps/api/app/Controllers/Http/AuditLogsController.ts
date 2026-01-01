import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { DateTime } from 'luxon'
import AuditLog from 'App/Models/AuditLog'
import AuditLogService from 'App/Services/AuditLogService'
import Logger from '@ioc:Adonis/Core/Logger'

export default class AuditLogsController {
  /**
   * Check if user is admin
   */
  private async requireAdmin(auth: HttpContextContract['auth']) {
    await auth.use('api').authenticate()
    const user = auth.user!
    if (!user.isAdmin) {
      throw new Error('Admin access required')
    }
    return user
  }

  /**
   * List audit logs with pagination
   */
  public async index({ auth, request, response }: HttpContextContract) {
    try {
      await this.requireAdmin(auth)

      const page = request.input('page', 1)
      const limit = request.input('limit', 20)

      const logs = await AuditLog.query()
        .preload('user')
        .orderBy('created_at', 'desc')
        .paginate(page, limit)

      return response.ok(logs)
    } catch (error) {
      Logger.error('Audit logs index error: %o', error)
      return response.unauthorized({ error: { message: error.message || 'Access denied' } })
    }
  }

  /**
   * Show single audit log
   */
  public async show({ auth, params, response }: HttpContextContract) {
    try {
      await this.requireAdmin(auth)

      const log = await AuditLog.query().where('id', params.id).preload('user').firstOrFail()

      return response.ok(log)
    } catch (error) {
      Logger.error('Audit log show error: %o', error)
      return response.notFound({ error: { message: 'Audit log not found' } })
    }
  }

  /**
   * Advanced search with filters
   */
  public async search({ auth, request, response }: HttpContextContract) {
    try {
      await this.requireAdmin(auth)

      const {
        from,
        to,
        userId,
        action,
        targetType,
        targetId,
        ipAddress,
        search,
        page = 1,
        limit = 50
      } = request.qs()

      const filters = {
        from: from ? DateTime.fromISO(from) : undefined,
        to: to ? DateTime.fromISO(to) : undefined,
        userId: userId ? Number(userId) : undefined,
        action,
        targetType,
        targetId: targetId ? Number(targetId) : undefined,
        ipAddress,
        search
      }

      const logs = await AuditLogService.searchLogs(filters, Number(page), Number(limit))

      return response.ok(logs)
    } catch (error) {
      Logger.error('Audit logs search error: %o', error)
      return response.unauthorized({ error: { message: error.message || 'Access denied' } })
    }
  }

  /**
   * Export audit logs
   */
  public async export({ auth, request, response }: HttpContextContract) {
    try {
      await this.requireAdmin(auth)

      const {
        from,
        to,
        userId,
        action,
        targetType,
        targetId,
        ipAddress,
        search,
        format = 'csv'
      } = request.qs()

      const filters = {
        from: from ? DateTime.fromISO(from) : undefined,
        to: to ? DateTime.fromISO(to) : undefined,
        userId: userId ? Number(userId) : undefined,
        action,
        targetType,
        targetId: targetId ? Number(targetId) : undefined,
        ipAddress,
        search
      }

      const exportData = await AuditLogService.exportLogs(filters, format as 'csv' | 'json')

      if (format === 'csv') {
        response.header('Content-Type', 'text/csv')
        response.header(
          'Content-Disposition',
          `attachment; filename="audit-logs-${Date.now()}.csv"`
        )
      } else {
        response.header('Content-Type', 'application/json')
        response.header(
          'Content-Disposition',
          `attachment; filename="audit-logs-${Date.now()}.json"`
        )
      }

      return response.send(exportData)
    } catch (error) {
      Logger.error('Audit logs export error: %o', error)
      return response.unauthorized({ error: { message: error.message || 'Access denied' } })
    }
  }

  /**
   * Get audit log statistics
   */
  public async statistics({ auth, request, response }: HttpContextContract) {
    try {
      await this.requireAdmin(auth)

      const { from, to } = request.qs()
      const dateRange =
        from && to
          ? {
              from: DateTime.fromISO(from),
              to: DateTime.fromISO(to)
            }
          : undefined

      const stats = await AuditLogService.getLogStatistics(dateRange)

      return response.ok(stats)
    } catch (error) {
      Logger.error('Audit log statistics error: %o', error)
      return response.unauthorized({ error: { message: error.message || 'Access denied' } })
    }
  }

  /**
   * Get security events
   */
  public async securityEvents({ auth, request, response }: HttpContextContract) {
    try {
      await this.requireAdmin(auth)

      const { from, to, limit = 100 } = request.qs()
      const dateRange =
        from && to
          ? {
              from: DateTime.fromISO(from),
              to: DateTime.fromISO(to)
            }
          : undefined

      const events = await AuditLogService.getSecurityEvents(dateRange, Number(limit))

      return response.ok({ events })
    } catch (error) {
      Logger.error('Security events error: %o', error)
      return response.unauthorized({ error: { message: error.message || 'Access denied' } })
    }
  }

  /**
   * Get available action types
   */
  public async actionTypes({ auth, response }: HttpContextContract) {
    try {
      await this.requireAdmin(auth)

      const actions = await AuditLogService.getActionTypes()

      return response.ok({ actions })
    } catch (error) {
      Logger.error('Action types error: %o', error)
      return response.unauthorized({ error: { message: error.message || 'Access denied' } })
    }
  }

  /**
   * Get available target types
   */
  public async targetTypes({ auth, response }: HttpContextContract) {
    try {
      await this.requireAdmin(auth)

      const types = await AuditLogService.getTargetTypes()

      return response.ok({ types })
    } catch (error) {
      Logger.error('Target types error: %o', error)
      return response.unauthorized({ error: { message: error.message || 'Access denied' } })
    }
  }
}
