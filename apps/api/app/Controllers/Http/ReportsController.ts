import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Assignment from 'App/Models/Assignment'
import Event from 'App/Models/Event'
import User from 'App/Models/User'

export default class ReportsController {
  public async index({ request, response }: HttpContextContract) {
    // basic set of reports, extendable via query param `type`
    const type = request.input('type', 'participation')

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

    // default / overview: return a structured object so frontend receives a predictable shape
    const usersRow = (await User.query().count('* as total')) as any
    const eventsRow = (await Event.query().count('* as total')) as any
    const assignmentsCompletedRow = (await Assignment.query()
      .where('status', 'completed')
      .count('* as total')) as any

    const usersTotal = Number(usersRow?.[0]?.total || 0)
    const eventsTotal = Number(eventsRow?.[0]?.total || 0)
    // assignmentsTotal not used currently, can be added later if needed
    const assignmentsCompleted = Number(assignmentsCompletedRow?.[0]?.total || 0)

    const overview = {
      volunteerParticipation: {
        total: usersTotal,
        // best-effort values; more precise calculations can be added later
        active: usersTotal, // assume all users are active for now
        inactive: 0,
        trend: 0
      },
      eventCompletion: {
        total: eventsTotal,
        completed: assignmentsCompleted,
        ongoing: 0,
        cancelled: 0,
        completionRate: eventsTotal ? Math.round((assignmentsCompleted / eventsTotal) * 100) : 0
      },
      volunteerHours: {
        total: 0,
        thisMonth: 0,
        lastMonth: 0,
        trend: 0
      },
      organizationPerformance: {
        topPerformers: [],
        averageScore: 0
      },
      complianceAdherence: {
        compliant: 0,
        pending: 0,
        expired: 0,
        adherenceRate: 0
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
