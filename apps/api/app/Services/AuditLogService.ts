import Database from '@ioc:Adonis/Lucid/Database'
import { DateTime } from 'luxon'
import AuditLog from 'App/Models/AuditLog'

interface AuditLogFilters {
  from?: DateTime
  to?: DateTime
  userId?: number
  action?: string
  targetType?: string
  targetId?: number
  ipAddress?: string
  search?: string
}

interface AuditLogStatistics {
  totalLogs: number
  actionFrequency: {
    action: string
    count: number
  }[]
  topActors: {
    userId: number
    userName: string
    actionCount: number
  }[]
  activityByDay: {
    date: string
    count: number
  }[]
}

interface SecurityEvent {
  id: number
  userId: number | null
  action: string
  ipAddress: string | null
  createdAt: DateTime
  details: string | null
  metadata: string | null
}

export default class AuditLogService {
  /**
   * Search audit logs with advanced filters
   */
  public static async searchLogs(filters: AuditLogFilters, page: number = 1, limit: number = 50) {
    const query = AuditLog.query().preload('user')

    // Date range filter
    if (filters.from) {
      query.where('created_at', '>=', filters.from.toSQL()!)
    }
    if (filters.to) {
      query.where('created_at', '<=', filters.to.toSQL()!)
    }

    // User filter
    if (filters.userId) {
      query.where('user_id', filters.userId)
    }

    // Action filter
    if (filters.action) {
      query.where('action', filters.action)
    }

    // Target type filter
    if (filters.targetType) {
      query.where('target_type', filters.targetType)
    }

    // Target ID filter
    if (filters.targetId) {
      query.where('target_id', filters.targetId)
    }

    // IP address filter
    if (filters.ipAddress) {
      query.where('ip_address', 'LIKE', `%${filters.ipAddress}%`)
    }

    // Search filter (searches in action and details)
    if (filters.search) {
      query.where((builder) => {
        builder
          .where('action', 'LIKE', `%${filters.search}%`)
          .orWhere('details', 'LIKE', `%${filters.search}%`)
      })
    }

    query.orderBy('created_at', 'desc')

    return await query.paginate(page, limit)
  }

  /**
   * Export audit logs to CSV or JSON
   */
  public static async exportLogs(
    filters: AuditLogFilters,
    format: 'csv' | 'json' = 'csv'
  ): Promise<string> {
    const query = AuditLog.query().preload('user')

    // Apply same filters as searchLogs
    if (filters.from) query.where('created_at', '>=', filters.from.toSQL()!)
    if (filters.to) query.where('created_at', '<=', filters.to.toSQL()!)
    if (filters.userId) query.where('user_id', filters.userId)
    if (filters.action) query.where('action', filters.action)
    if (filters.targetType) query.where('target_type', filters.targetType)
    if (filters.targetId) query.where('target_id', filters.targetId)
    if (filters.ipAddress) query.where('ip_address', 'LIKE', `%${filters.ipAddress}%`)
    if (filters.search) {
      query.where((builder) => {
        builder
          .where('action', 'LIKE', `%${filters.search}%`)
          .orWhere('details', 'LIKE', `%${filters.search}%`)
      })
    }

    query.orderBy('created_at', 'desc').limit(10000) // Limit exports to 10k records

    const logs = await query

    if (format === 'json') {
      return JSON.stringify(
        logs.map((log) => ({
          id: log.id,
          userId: log.userId,
          userName: log.user ? `${log.user.firstName} ${log.user.lastName}` : 'Unknown',
          action: log.action,
          targetType: log.targetType,
          targetId: log.targetId,
          ipAddress: log.ipAddress,
          details: log.details,
          metadata: log.metadata,
          createdAt: log.createdAt.toISO()
        })),
        null,
        2
      )
    }

    // CSV format
    const csvRows = [
      'ID,User ID,User Name,Action,Target Type,Target ID,IP Address,Details,Created At'
    ]

    for (const log of logs) {
      const userName = log.user ? `${log.user.firstName} ${log.user.lastName}` : 'Unknown'
      const details = (log.details || '').replace(/"/g, '""') // Escape quotes
      csvRows.push(
        `${log.id},${log.userId || ''},"${userName}","${log.action}","${log.targetType || ''}",${
          log.targetId || ''
        },"${log.ipAddress || ''}","${details}","${log.createdAt.toISO()}"`
      )
    }

    return csvRows.join('\n')
  }

  /**
   * Get audit log statistics
   */
  public static async getLogStatistics(dateRange?: {
    from: DateTime
    to: DateTime
  }): Promise<AuditLogStatistics> {
    const from = dateRange?.from || DateTime.now().minus({ days: 30 })
    const to = dateRange?.to || DateTime.now()

    // Total logs
    const totalLogsResult = await AuditLog.query()
      .whereBetween('created_at', [from.toSQL()!, to.toSQL()!])
      .count('* as total')
    const totalLogs = Number(totalLogsResult[0].$extras.total || 0)

    // Action frequency
    const actionFrequencyResults = await Database.from('audit_logs')
      .select('action')
      .count('* as count')
      .whereBetween('created_at', [from.toSQL()!, to.toSQL()!])
      .groupBy('action')
      .orderBy('count', 'desc')
      .limit(10)

    const actionFrequency = actionFrequencyResults.map((row) => ({
      action: row.action,
      count: Number(row.count || 0)
    }))

    // Top actors
    const topActorsResults = await Database.from('audit_logs as al')
      .join('users as u', 'al.user_id', 'u.id')
      .select('u.id as user_id', 'u.first_name', 'u.last_name')
      .count('* as action_count')
      .whereBetween('al.created_at', [from.toSQL()!, to.toSQL()!])
      .groupBy('u.id', 'u.first_name', 'u.last_name')
      .orderBy('action_count', 'desc')
      .limit(10)

    const topActors = topActorsResults.map((row) => ({
      userId: row.user_id,
      userName: `${row.first_name} ${row.last_name}`,
      actionCount: Number(row.action_count || 0)
    }))

    // Activity by day
    const activityByDayResults = await Database.from('audit_logs')
      .select(Database.raw('DATE(created_at) as date'))
      .count('* as count')
      .whereBetween('created_at', [from.toSQL()!, to.toSQL()!])
      .groupByRaw('DATE(created_at)')
      .orderBy('date', 'asc')

    const activityByDay = activityByDayResults.map((row) => ({
      date: row.date,
      count: Number(row.count || 0)
    }))

    return {
      totalLogs,
      actionFrequency,
      topActors,
      activityByDay
    }
  }

  /**
   * Get security-related events (failed logins, suspicious activity)
   */
  public static async getSecurityEvents(
    dateRange?: { from: DateTime; to: DateTime },
    limit: number = 100
  ): Promise<SecurityEvent[]> {
    const from = dateRange?.from || DateTime.now().minus({ days: 7 })
    const to = dateRange?.to || DateTime.now()

    const securityActions = [
      'login_failed',
      'login_success',
      'logout',
      'password_change',
      'user_disabled',
      'user_enabled',
      'role_change',
      'permission_override'
    ]

    const events = await AuditLog.query()
      .whereIn('action', securityActions)
      .whereBetween('created_at', [from.toSQL()!, to.toSQL()!])
      .orderBy('created_at', 'desc')
      .limit(limit)

    return events.map((event) => ({
      id: event.id,
      userId: event.userId,
      action: event.action,
      ipAddress: event.ipAddress,
      createdAt: event.createdAt,
      details: event.details,
      metadata: event.metadata
    }))
  }

  /**
   * Get unique action types
   */
  public static async getActionTypes(): Promise<string[]> {
    const results = await Database.from('audit_logs')
      .select('action')
      .distinct()
      .orderBy('action', 'asc')

    return results.map((row) => row.action)
  }

  /**
   * Get unique target types
   */
  public static async getTargetTypes(): Promise<string[]> {
    const results = await Database.from('audit_logs')
      .select('target_type')
      .whereNotNull('target_type')
      .distinct()
      .orderBy('target_type', 'asc')

    return results.map((row) => row.target_type)
  }
}
