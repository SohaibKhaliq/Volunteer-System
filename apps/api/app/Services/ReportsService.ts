import Event from 'App/Models/Event'
import User from 'App/Models/User'
import ComplianceDocument from 'App/Models/ComplianceDocument'
import VolunteerHour from 'App/Models/VolunteerHour'

export default class ReportsService {
  public async overview(_range: string) {
    // "range" would be used to filter createdAt dates
    // For chart data, we need 6 months trend regardless of range usually, or we adapt.
    // Let's generate a 6-month trend for volunteer hours.

    const totalVolunteers = await User.query().count('* as total').first()
    const totalEvents = await Event.query().count('* as total').first()
    const totalHours = await VolunteerHour.query().sum('hours as total').first()
    
    // Calculate compliance rate
    const totalDocs = await ComplianceDocument.query().count('* as total').first()
    const validDocs = await ComplianceDocument.query().where('status', 'approved').count('* as total').first()
    const complianceRate = totalDocs?.$extras.total > 0 
      ? Math.round((validDocs?.$extras.total / totalDocs?.$extras.total) * 100) 
      : 0

    // Active volunteers (users with hours in last 30 days)
    const activeVolunteersCount = await VolunteerHour.query()
      .where('date', '>=', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .distinct('user_id')
      .count('* as total')
      .first()

    // Event stats
    const completedEvents = await Event.query().where('status', 'completed').count('* as total').first()
    const ongoingEvents = await Event.query().where('status', 'ongoing').count('* as total').first()
    const cancelledEvents = await Event.query().where('status', 'cancelled').count('* as total').first()

    // 6-month trend for hours
    const trend: { month: string; hours: number; volunteers: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthName = date.toLocaleString('default', { month: 'short' })
      const year = date.getFullYear()
      const month = date.getMonth() + 1

      // Start of month
      const startOfMonth = new Date(year, month - 1, 1)
      // End of month
      const endOfMonth = new Date(year, month, 0)

      const hoursInMonth = await VolunteerHour.query()
        .whereBetween('date', [startOfMonth, endOfMonth])
        .sum('hours as total')
        .first()
      
      const volunteersInMonth = await VolunteerHour.query()
        .whereBetween('date', [startOfMonth, endOfMonth])
        .distinct('user_id')
        .count('* as total')
        .first()

      trend.push({
        month: monthName,
        hours: hoursInMonth?.$extras.total || 0,
        volunteers: volunteersInMonth?.$extras.total || 0
      })
    }

    return {
      volunteerParticipation: {
        total: totalVolunteers?.$extras.total || 0,
        active: activeVolunteersCount?.$extras.total || 0,
        inactive: (totalVolunteers?.$extras.total || 0) - (activeVolunteersCount?.$extras.total || 0),
        trend: 0 // Placeholder
      },
      eventCompletion: {
        total: totalEvents?.$extras.total || 0,
        completed: completedEvents?.$extras.total || 0,
        ongoing: ongoingEvents?.$extras.total || 0,
        cancelled: cancelledEvents?.$extras.total || 0,
        completionRate: totalEvents?.$extras.total > 0 
          ? Math.round((completedEvents?.$extras.total / totalEvents?.$extras.total) * 100) 
          : 0
      },
      volunteerHours: {
        total: totalHours?.$extras.total || 0,
        thisMonth: trend[trend.length - 1].hours,
        lastMonth: trend[trend.length - 2]?.hours || 0,
        trend: trend // Return array for chart
      },
      organizationPerformance: {
        topPerformers: [],
        averageScore: 0
      },
      complianceAdherence: {
        compliant: validDocs?.$extras.total || 0,
        pending: (totalDocs?.$extras.total || 0) - (validDocs?.$extras.total || 0),
        expired: 0, // Need logic
        adherenceRate: complianceRate
      },
      predictions: {
        volunteerDemand: { nextMonth: 150, confidence: 85 },
        noShowRate: 12,
        eventSuccessRate: 94
      }
    }
  }

  public async eventsWithCompletion() {
    const events = await Event.query().preload('tasks', (taskQuery) => {
      taskQuery.preload('assignments')
    })
    return events
  }
}
