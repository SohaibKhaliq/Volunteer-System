import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Assignment from 'App/Models/Assignment'
import Event from 'App/Models/Event'
import User from 'App/Models/User'
import Database from '@ioc:Adonis/Lucid/Database'
import { DateTime } from 'luxon'

export default class ReportsController {
  public async index({ request, response }: HttpContextContract) {
    // basic set of reports, extendable via query param `type`
    // default to overview so the frontend receives a nested object by default
    const type = request.input('type', 'overview')
    const range = request.input('range', '30days')

    // helper to convert range param into days window (null === all time)
    const rangeToDays = (r: string | null) => {
      switch (r) {
        case '7days':
          return 7
        case '30days':
          return 30
        case '90days':
          return 90
        case 'year':
          return 365
        case 'all':
          return null
        default:
          return 30
      }
    }
    const windowDays = rangeToDays(range)
    const now = DateTime.now()
    const thisPeriodStart = windowDays ? now.minus({ days: windowDays }).toISO() : null
    const prevPeriodStart = windowDays ? now.minus({ days: windowDays * 2 }).toISO() : null
    const prevPeriodEnd = windowDays ? now.minus({ days: windowDays }).toISO() : null

    if (type === 'participation') {
      // volunteer participation: counts of completed assignments per user
      const rows = await Assignment.query()
        .select('user_id')
        .count('* as hours')
        .where('status', 'completed')
        .groupBy('user_id')

      return response.ok(rows)
    }

    if (type === 'events') {
      const events = await Event.query().preload('tasks')
      return response.ok(events)
    }

    // default / overview: compute richer, predictable object so frontend receives a stable shape
    const usersRow = (await User.query().count('* as total')) as any
    const eventsRow = (await Event.query().count('* as total')) as any
    const assignmentsCompletedRow = (await Assignment.query()
      .where('status', 'completed')
      .count('* as total')) as any

    const usersTotal = Number(usersRow?.[0]?.total || 0)
    const eventsTotal = Number(eventsRow?.[0]?.total || 0)
    const assignmentsCompleted = Number(assignmentsCompletedRow?.[0]?.total || 0)

    // Active vs inactive users — use last_active_at if available and range is time-bounded
    let activeCount = 0
    let prevActiveCount = 0
    if (!windowDays) {
      // all-time: treat as count of users with volunteer_status = 'active'
      const activeRow = (await User.query()
        .where('volunteer_status', 'active')
        .count('* as total')) as any
      activeCount = Number(activeRow?.[0]?.total || 0)
      prevActiveCount = 0
    } else {
      // this period (e.g. last 30 days) use last_active_at
      const thisActiveRow = (await User.query()
        .whereNotNull('last_active_at')
        .andWhere('last_active_at', '>=', thisPeriodStart)
        .count('* as total')) as any
      activeCount = Number(thisActiveRow?.[0]?.total || 0)

      // previous period
      const prevActiveRow = (await User.query()
        .whereNotNull('last_active_at')
        .andWhere('last_active_at', '>=', prevPeriodStart)
        .andWhere('last_active_at', '<', prevPeriodEnd)
        .count('* as total')) as any
      prevActiveCount = Number(prevActiveRow?.[0]?.total || 0)
    }

    const inactiveCount = Math.max(usersTotal - activeCount, 0)
    const activeTrend = prevActiveCount
      ? Math.round(((activeCount - prevActiveCount) / prevActiveCount) * 100)
      : 0

    // Volunteer hours: total, thisPeriod and prevPeriod (based on task start/end durations)
    // We'll compute using raw SQL; SQL expression uses TIMESTAMPDIFF to get seconds then divide by 3600
    const totalHoursRows: any = await Database.rawQuery(
      "SELECT IFNULL(SUM(TIMESTAMPDIFF(SECOND, t.start_at, t.end_at))/3600, 0) AS total_hours FROM assignments a JOIN tasks t ON t.id = a.task_id WHERE a.status = 'completed' AND t.start_at IS NOT NULL AND t.end_at IS NOT NULL"
    )
    const totalHours = Number(totalHoursRows?.[0]?.total_hours || 0)

    let thisPeriodHours = 0
    let prevPeriodHours = 0
    if (!windowDays) {
      thisPeriodHours = totalHours
    } else {
      const thisHRows: any = await Database.rawQuery(
        "SELECT IFNULL(SUM(TIMESTAMPDIFF(SECOND, t.start_at, t.end_at))/3600, 0) AS total_hours FROM assignments a JOIN tasks t ON t.id = a.task_id WHERE a.status = 'completed' AND t.start_at IS NOT NULL AND t.end_at IS NOT NULL AND t.end_at >= ? AND t.end_at <= ?",
        [thisPeriodStart, now.toISO()]
      )
      const prevHRows: any = await Database.rawQuery(
        "SELECT IFNULL(SUM(TIMESTAMPDIFF(SECOND, t.start_at, t.end_at))/3600, 0) AS total_hours FROM assignments a JOIN tasks t ON t.id = a.task_id WHERE a.status = 'completed' AND t.start_at IS NOT NULL AND t.end_at IS NOT NULL AND t.end_at >= ? AND t.end_at < ?",
        [prevPeriodStart, prevPeriodEnd]
      )

      thisPeriodHours = Number(thisHRows?.[0]?.total_hours || 0)
      prevPeriodHours = Number(prevHRows?.[0]?.total_hours || 0)
    }
    const hoursTrend = prevPeriodHours
      ? Math.round(((thisPeriodHours - prevPeriodHours) / prevPeriodHours) * 100)
      : 0

    // Top performing users: most completed assignments (include their completed assignments and distinct event count)
    const topPerformers: any = await Database.rawQuery(
      `SELECT u.id, u.first_name, u.last_name, COUNT(a.id) AS completed, COUNT(DISTINCT t.event_id) AS events
       FROM assignments a
       JOIN users u ON u.id = a.user_id
       JOIN tasks t ON t.id = a.task_id
       WHERE a.status = 'completed'
       GROUP BY u.id
       ORDER BY completed DESC
       LIMIT 5`
    )

    const performers = (topPerformers || []).map((r: any) => ({
      name: `${r.first_name || ''} ${r.last_name || ''}`.trim() || 'Unknown',
      score: Number(r.completed || 0),
      events: Number(r.events || 0)
    }))

    // Compliance stats
    const compliantRow: any = await Database.query()
      .from('compliance_documents')
      .where('status', 'compliant')
      .count('* as total')
    const pendingRow: any = await Database.query()
      .from('compliance_documents')
      .where('status', 'pending')
      .count('* as total')
    const expiredRow: any = await Database.query()
      .from('compliance_documents')
      .whereNotNull('expires_at')
      .andWhere('expires_at', '<', now.toISO())
      .count('* as total')

    const compliant = Number(compliantRow?.[0]?.total || 0)
    const pending = Number(pendingRow?.[0]?.total || 0)
    const expired = Number(expiredRow?.[0]?.total || 0)
    const adherenceRate =
      compliant + pending + expired
        ? Math.round((compliant / (compliant + pending + expired)) * 100)
        : 0

    const overview = {
      volunteerParticipation: {
        total: usersTotal,
        active: activeCount,
        inactive: inactiveCount,
        trend: activeTrend
      },
      eventCompletion: {
        total: eventsTotal,
        completed: assignmentsCompleted,
        ongoing: 0,
        cancelled: 0,
        completionRate: eventsTotal ? Math.round((assignmentsCompleted / eventsTotal) * 100) : 0
      },
      volunteerHours: {
        total: Math.round(totalHours),
        thisMonth: Math.round(thisPeriodHours),
        lastMonth: Math.round(prevPeriodHours),
        trend: hoursTrend
      },
      organizationPerformance: {
        topPerformers: performers,
        averageScore: performers.length
          ? Math.round(performers.reduce((s: number, p: any) => s + p.score, 0) / performers.length)
          : 0
      },
      complianceAdherence: {
        compliant,
        pending,
        expired,
        adherenceRate
      },
      predictions: {
        volunteerDemand: {
          nextMonth: 0,
          confidence: 0
        },
        noShowRate: 0,
        eventSuccessRate: 0
      }
    }

    return response.ok(overview)
  }
}
