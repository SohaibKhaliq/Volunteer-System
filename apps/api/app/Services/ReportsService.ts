import Database from '@ioc:Adonis/Lucid/Database'
import { DateTime } from 'luxon'

export default class ReportsService {
  private rangeToDays(range: string | null) {
    switch (range) {
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

  private dateWindow(range: string | null) {
    const days = this.rangeToDays(range)
    const now = DateTime.now()
    if (!days) return { now: now.toISO(), start: null, prevStart: null, prevEnd: null }

    const start = now.minus({ days }).toISO()
    const prevStart = now.minus({ days: days * 2 }).toISO()
    const prevEnd = now.minus({ days }).toISO()
    return { now: now.toISO(), start, prevStart, prevEnd }
  }

  public async overview(range: string | null = '30days') {
    const { now, start, prevStart, prevEnd } = this.dateWindow(range)

    const usersRow: any = await Database.from('users').count('* as total')
    const eventsRow: any = await Database.from('events').count('* as total')
    const assignmentsCompletedRow: any = await Database.from('assignments')
      .where('status', 'completed')
      .count('* as total')

    const usersTotal = Number(usersRow?.[0]?.total || 0)
    const eventsTotal = Number(eventsRow?.[0]?.total || 0)
    const assignmentsCompleted = Number(assignmentsCompletedRow?.[0]?.total || 0)

    // Active vs inactive users
    let activeCount = 0
    let prevActiveCount = 0
    if (!start) {
      const activeRow: any = await Database.from('users')
        .where('volunteer_status', 'active')
        .count('* as total')
      activeCount = Number(activeRow?.[0]?.total || 0)
    } else {
      const thisActiveRow: any = await Database.from('users')
        .whereNotNull('last_active_at')
        .andWhere('last_active_at', '>=', start)
        .count('* as total')
      const prevActiveRow: any = await Database.from('users')
        .whereNotNull('last_active_at')
        .andWhere('last_active_at', '>=', prevStart)
        .andWhere('last_active_at', '<', prevEnd)
        .count('* as total')

      activeCount = Number(thisActiveRow?.[0]?.total || 0)
      prevActiveCount = Number(prevActiveRow?.[0]?.total || 0)
    }
    const inactiveCount = Math.max(usersTotal - activeCount, 0)
    const activeTrend = prevActiveCount
      ? Math.round(((activeCount - prevActiveCount) / prevActiveCount) * 100)
      : 0

    // Volunteer hours (in hours) using sum of TIMESTAMPDIFF / 3600 on tasks with completed assignments
    // Use knex sum with raw expression for portability
    const totalHoursRow: any = await Database.from('assignments as a')
      .join('tasks as t', 't.id', 'a.task_id')
      .where('a.status', 'completed')
      .whereNotNull('t.start_at')
      .whereNotNull('t.end_at')
      .select(
        Database.raw(
          'IFNULL(SUM(TIMESTAMPDIFF(SECOND, t.start_at, t.end_at))/3600, 0) AS total_hours'
        )
      )

    const totalHours = Number(totalHoursRow?.[0]?.total_hours || 0)

    let thisPeriodHours = 0
    let prevPeriodHours = 0
    if (!start) {
      thisPeriodHours = totalHours
    } else {
      const thisHRow: any = await Database.from('assignments as a')
        .join('tasks as t', 't.id', 'a.task_id')
        .where('a.status', 'completed')
        .whereNotNull('t.start_at')
        .whereNotNull('t.end_at')
        .andWhere('t.end_at', '>=', start)
        .andWhere('t.end_at', '<=', now)
        .select(
          Database.raw(
            'IFNULL(SUM(TIMESTAMPDIFF(SECOND, t.start_at, t.end_at))/3600, 0) AS total_hours'
          )
        )

      const prevHRow: any = await Database.from('assignments as a')
        .join('tasks as t', 't.id', 'a.task_id')
        .where('a.status', 'completed')
        .whereNotNull('t.start_at')
        .whereNotNull('t.end_at')
        .andWhere('t.end_at', '>=', prevStart)
        .andWhere('t.end_at', '<', prevEnd)
        .select(
          Database.raw(
            'IFNULL(SUM(TIMESTAMPDIFF(SECOND, t.start_at, t.end_at))/3600, 0) AS total_hours'
          )
        )

      thisPeriodHours = Number(thisHRow?.[0]?.total_hours || 0)
      prevPeriodHours = Number(prevHRow?.[0]?.total_hours || 0)
    }
    const hoursTrend = prevPeriodHours
      ? Math.round(((thisPeriodHours - prevPeriodHours) / prevPeriodHours) * 100)
      : 0

    // Top performers: users with most completed assignments
    const topPerformers: any = await Database.from('assignments as a')
      .join('users as u', 'u.id', 'a.user_id')
      .join('tasks as t', 't.id', 'a.task_id')
      .where('a.status', 'completed')
      .groupBy('u.id')
      .select('u.id', 'u.first_name', 'u.last_name')
      .select(Database.raw('COUNT(a.id) as completed'))
      .select(Database.raw('COUNT(DISTINCT t.event_id) as events'))
      .orderBy('completed', 'desc')
      .limit(5)

    const performers = (topPerformers || []).map((r: any) => ({
      name: `${r.first_name || ''} ${r.last_name || ''}`.trim() || 'Unknown',
      score: Number(r.completed || 0),
      events: Number(r.events || 0)
    }))

    // Compliance stats
    const compliantRow: any = await Database.from('compliance_documents')
      .where('status', 'compliant')
      .count('* as total')
    const pendingRow: any = await Database.from('compliance_documents')
      .where('status', 'pending')
      .count('* as total')
    const expiredRow: any = await Database.from('compliance_documents')
      .whereNotNull('expires_at')
      .andWhere('expires_at', '<', now)
      .count('* as total')

    const compliant = Number(compliantRow?.[0]?.total || 0)
    const pending = Number(pendingRow?.[0]?.total || 0)
    const expired = Number(expiredRow?.[0]?.total || 0)
    const adherenceRate =
      compliant + pending + expired
        ? Math.round((compliant / (compliant + pending + expired)) * 100)
        : 0

    return {
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
        volunteerDemand: { nextMonth: 0, confidence: 0 },
        noShowRate: 0,
        eventSuccessRate: 0
      }
    }
  }

  /**
   * Get events with per-event completion details.
   * A task is considered 'completed' if it has at least one assignment with status 'completed'.
   */
  public async eventsWithCompletion() {
    // fetch events with tasks and counts per event
    const events: any = await Database.from('events as e')
      .leftJoin('tasks as t', 't.event_id', 'e.id')
      .groupBy('e.id')
      .select('e.id', 'e.title', 'e.location')
      .select(Database.raw('COUNT(t.id) as total_tasks'))

    // fetch completed task counts (tasks that have at least one completed assignment)
    const completedTasksPerEvent: any = await Database.from('tasks as t')
      .join('assignments as a', 'a.task_id', 't.id')
      .where('a.status', 'completed')
      .groupBy('t.event_id')
      .select('t.event_id')
      .select(Database.raw('COUNT(DISTINCT t.id) as completed_tasks'))

    const completedMap = new Map<number, number>()
    for (const row of completedTasksPerEvent || []) {
      completedMap.set(Number(row.event_id), Number(row.completed_tasks))
    }

    return (events || []).map((e: any) => {
      const totalTasks = Number(e.total_tasks || 0)
      const completedTasks = Number(completedMap.get(Number(e.id)) || 0)
      const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0
      return {
        id: e.id,
        title: e.title,
        location: e.location,
        totalTasks,
        completedTasks,
        completionRate,
        fullyCompleted: totalTasks > 0 ? completedTasks === totalTasks : false
      }
    })
  }
}
