import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Communication from 'App/Models/Communication'
import CommunicationLog from 'App/Models/CommunicationLog'
import ScheduledJob from 'App/Models/ScheduledJob'
import Task from 'App/Models/Task'
import Assignment from 'App/Models/Assignment'
import { DateTime } from 'luxon'

export default class MonitoringController {
  public async stats({}: HttpContextContract) {
    // Communications counts by status
    const commCountsRaw = await Communication.query()
      .select('status')
      .count('* as count')
      .groupBy('status')
    const commCounts: Record<string, number> = {}
    commCountsRaw.forEach(
      (r: any) => (commCounts[r.status || 'unknown'] = Number(r.$extras.count || r.count || 0))
    )

    // Communication logs: failed count
    const failedLogs = await CommunicationLog.query().where('status', 'Failed').count('* as count')
    const failedLogsCount = Number(
      (failedLogs[0] && (failedLogs[0].$extras?.count || failedLogs[0].count)) || 0
    )

    // Scheduled jobs stats
    const scheduledRaw = await ScheduledJob.query()
      .select('status')
      .count('* as count')
      .groupBy('status')
    const scheduledCounts: Record<string, number> = {}
    scheduledRaw.forEach(
      (r: any) => (scheduledCounts[r.status || 'unknown'] = Number(r.$extras.count || r.count || 0))
    )

    // Tasks and assignments
    const tasksCountRaw = await Task.query().count('* as count')
    const tasksCount = Number(
      (tasksCountRaw[0] && (tasksCountRaw[0].$extras?.count || tasksCountRaw[0].count)) || 0
    )
    const assignmentsCountRaw = await Assignment.query().count('* as count')
    const assignmentsCount = Number(
      (assignmentsCountRaw[0] &&
        (assignmentsCountRaw[0].$extras?.count || assignmentsCountRaw[0].count)) ||
        0
    )

    return {
      communications: {
        byStatus: commCounts,
        failedLogs: failedLogsCount
      },
      scheduledJobs: scheduledCounts,
      tasks: {
        total: tasksCount,
        assignments: assignmentsCount
      },
      asOf: DateTime.local().toISO()
    }
  }

  public async recent({}: HttpContextContract) {
    const recentCommunications = await Communication.query().orderBy('created_at', 'desc').limit(10)
    const recentJobs = await ScheduledJob.query().orderBy('created_at', 'desc').limit(10)
    const recentFailedLogs = await CommunicationLog.query()
      .where('status', 'Failed')
      .orderBy('created_at', 'desc')
      .limit(10)

    return {
      communications: recentCommunications,
      scheduledJobs: recentJobs,
      failedLogs: recentFailedLogs
    }
  }
}
