import Database from '@ioc:Adonis/Lucid/Database'
import Logger from '@ioc:Adonis/Core/Logger'

interface BackgroundJobStatus {
  total: number
  running: number
  completed: number
  failed: number
  pending: number
  jobs: {
    id: number
    name: string
    type: string
    status: string
    runAt: string | null
    completedAt: string | null
    error: string | null
  }[]
}

interface ImportOperationStatus {
  total: number
  active: number
  completed: number
  failed: number
  operations: {
    id: number
    name: string
    type: string
    status: string
    progress: number
    totalRecords: number
    processedRecords: number
    failedRecords: number
    error: string | null
    createdAt: string
  }[]
}

interface NotificationDeliveryMetrics {
  totalSent: number
  successRate: number
  failedCount: number
  averageDeliveryTime: number
  byChannel: {
    channel: string
    sent: number
    failed: number
    successRate: number
  }[]
}

interface ErrorLogEntry {
  id: number
  severity: string
  message: string
  stackTrace: string | null
  context: string | null
  occurredAt: string
  count: number
}

interface SystemHealthStatus {
  healthy: boolean
  database: {
    connected: boolean
    responseTime: number
  }
  services: {
    name: string
    status: 'healthy' | 'degraded' | 'down'
    message?: string
  }[]
}

export default class SystemMonitoringService {
  /**
   * Get background jobs status
   */
  public static async getBackgroundJobsStatus(): Promise<BackgroundJobStatus> {
    try {
      const jobs = await Database.from('scheduled_jobs')
        .select('id', 'name', 'type', 'status', 'run_at', 'completed_at', 'error')
        .orderBy('run_at', 'desc')
        .limit(100)

      const stats = await Database.from('scheduled_jobs')
        .select('status')
        .count('* as count')
        .groupBy('status')

      const statusCounts = stats.reduce(
        (acc, row) => {
          acc[row.status.toLowerCase()] = Number(row.count || 0)
          return acc
        },
        {} as Record<string, number>
      )

      return {
        total: jobs.length,
        running: statusCounts['running'] || 0,
        completed: statusCounts['completed'] || 0,
        failed: statusCounts['failed'] || 0,
        pending: statusCounts['pending'] || statusCounts['scheduled'] || 0,
        jobs: jobs.map((job) => ({
          id: job.id,
          name: job.name,
          type: job.type,
          status: job.status,
          runAt: job.run_at,
          completedAt: job.completed_at,
          error: job.error
        }))
      }
    } catch (error) {
      Logger.error('Background jobs status error: %o', error)
      return {
        total: 0,
        running: 0,
        completed: 0,
        failed: 0,
        pending: 0,
        jobs: []
      }
    }
  }

  /**
   * Get import operations status
   */
  public static async getImportOperations(): Promise<ImportOperationStatus> {
    try {
      // Get import-related scheduled jobs
      const imports = await Database.from('scheduled_jobs')
        .where('type', 'like', '%import%')
        .select(
          'id',
          'name',
          'type',
          'status',
          'run_at as created_at',
          'completed_at',
          'error',
          'metadata'
        )
        .orderBy('run_at', 'desc')
        .limit(50)

      const operations = imports.map((imp) => {
        let metadata = {}
        try {
          metadata = imp.metadata ? JSON.parse(imp.metadata) : {}
        } catch {}

        const totalRecords = (metadata as any).totalRecords || 0
        const processedRecords = (metadata as any).processedRecords || 0
        const failedRecords = (metadata as any).failedRecords || 0
        const progress = totalRecords > 0 ? Math.round((processedRecords / totalRecords) * 100) : 0

        return {
          id: imp.id,
          name: imp.name,
          type: imp.type,
          status: imp.status,
          progress,
          totalRecords,
          processedRecords,
          failedRecords,
          error: imp.error,
          createdAt: imp.created_at
        }
      })

      const total = operations.length
      const active = operations.filter((op) => op.status === 'running').length
      const completed = operations.filter((op) => op.status === 'completed').length
      const failed = operations.filter((op) => op.status === 'failed').length

      return {
        total,
        active,
        completed,
        failed,
        operations
      }
    } catch (error) {
      Logger.error('Import operations status error: %o', error)
      return {
        total: 0,
        active: 0,
        completed: 0,
        failed: 0,
        operations: []
      }
    }
  }

  /**
   * Get notification delivery metrics
   */
  public static async getNotificationDeliveryMetrics(): Promise<NotificationDeliveryMetrics> {
    try {
      // Get communication logs for the last 7 days
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const logs = await Database.from('communication_logs')
        .where('created_at', '>=', sevenDaysAgo.toISOString())
        .select('status', 'channel', 'sent_at', 'created_at')

      const totalSent = logs.length
      const failed = logs.filter((log) => log.status === 'failed').length
      const successRate = totalSent > 0 ? ((totalSent - failed) / totalSent) * 100 : 100

      // Calculate average delivery time
      const deliveredLogs = logs.filter((log) => log.sent_at && log.created_at)
      let totalDeliveryTime = 0
      for (const log of deliveredLogs) {
        const created = new Date(log.created_at).getTime()
        const sent = new Date(log.sent_at).getTime()
        totalDeliveryTime += sent - created
      }
      const averageDeliveryTime =
        deliveredLogs.length > 0 ? totalDeliveryTime / deliveredLogs.length / 1000 : 0 // in seconds

      // Group by channel
      const byChannelMap = logs.reduce(
        (acc, log) => {
          const channel = log.channel || 'unknown'
          if (!acc[channel]) {
            acc[channel] = { sent: 0, failed: 0 }
          }
          acc[channel].sent++
          if (log.status === 'failed') {
            acc[channel].failed++
          }
          return acc
        },
        {} as Record<string, { sent: number; failed: number }>
      )

      const byChannel = Object.entries(byChannelMap).map(([channel, stats]) => ({
        channel,
        sent: stats.sent,
        failed: stats.failed,
        successRate: stats.sent > 0 ? ((stats.sent - stats.failed) / stats.sent) * 100 : 100
      }))

      return {
        totalSent,
        successRate: Math.round(successRate * 10) / 10,
        failedCount: failed,
        averageDeliveryTime: Math.round(averageDeliveryTime * 10) / 10,
        byChannel
      }
    } catch (error) {
      Logger.error('Notification delivery metrics error: %o', error)
      return {
        totalSent: 0,
        successRate: 100,
        failedCount: 0,
        averageDeliveryTime: 0,
        byChannel: []
      }
    }
  }

  /**
   * Get recent error logs
   */
  public static async getErrorLogs(limit: number = 50): Promise<ErrorLogEntry[]> {
    try {
      // Get errors from scheduled_jobs and communication_logs
      const jobErrors = await Database.from('scheduled_jobs')
        .whereNotNull('error')
        .where('status', 'failed')
        .select('id', 'error', 'completed_at as occurred_at')
        .orderBy('completed_at', 'desc')
        .limit(limit)

      const commErrors = await Database.from('communication_logs')
        .where('status', 'failed')
        .whereNotNull('error')
        .select('id', 'error', 'updated_at as occurred_at')
        .orderBy('updated_at', 'desc')
        .limit(limit)

      const allErrors = [...jobErrors, ...commErrors]
        .sort((a, b) => {
          const dateA = new Date(a.occurred_at || 0).getTime()
          const dateB = new Date(b.occurred_at || 0).getTime()
          return dateB - dateA
        })
        .slice(0, limit)

      return allErrors.map((err, index) => ({
        id: index + 1,
        severity: 'error',
        message: err.error || 'Unknown error',
        stackTrace: null,
        context: null,
        occurredAt: err.occurred_at,
        count: 1
      }))
    } catch (error) {
      Logger.error('Error logs retrieval error: %o', error)
      return []
    }
  }

  /**
   * Get system health status
   */
  public static async getSystemHealth(): Promise<SystemHealthStatus> {
    const services: SystemHealthStatus['services'] = []

    // Check database connection
    let dbConnected = false
    let dbResponseTime = 0
    try {
      const start = Date.now()
      await Database.rawQuery('SELECT 1')
      dbResponseTime = Date.now() - start
      dbConnected = true
    } catch (error) {
      Logger.error('Database health check failed: %o', error)
    }

    // Check scheduled jobs service
    try {
      const recentJobs = await Database.from('scheduled_jobs')
        .where('status', 'failed')
        .where('completed_at', '>=', new Date(Date.now() - 3600000).toISOString()) // Last hour
        .count('* as count')

      const failedCount = Number(recentJobs[0].count || 0)
      services.push({
        name: 'Background Jobs',
        status: failedCount > 10 ? 'degraded' : 'healthy',
        message: failedCount > 10 ? `${failedCount} jobs failed in the last hour` : undefined
      })
    } catch (error) {
      services.push({
        name: 'Background Jobs',
        status: 'down',
        message: 'Unable to check job status'
      })
    }

    // Check communications service
    try {
      const recentComms = await Database.from('communication_logs')
        .where('status', 'failed')
        .where('created_at', '>=', new Date(Date.now() - 3600000).toISOString())
        .count('* as count')

      const failedCount = Number(recentComms[0].count || 0)
      services.push({
        name: 'Communications',
        status: failedCount > 20 ? 'degraded' : 'healthy',
        message:
          failedCount > 20 ? `${failedCount} communications failed in the last hour` : undefined
      })
    } catch (error) {
      services.push({
        name: 'Communications',
        status: 'down',
        message: 'Unable to check communications status'
      })
    }

    const healthy = dbConnected && services.every((s) => s.status !== 'down')

    return {
      healthy,
      database: {
        connected: dbConnected,
        responseTime: dbResponseTime
      },
      services
    }
  }
}
