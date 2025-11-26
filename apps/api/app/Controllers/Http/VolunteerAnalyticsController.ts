import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import OrganizationTeamMember from 'App/Models/OrganizationTeamMember'
import { DateTime } from 'luxon'

export default class VolunteerAnalyticsController {
  /**
   * Get comprehensive volunteer analytics
   */
  public async volunteers({ auth, request, response }: HttpContextContract) {
    const user = auth.user!
    const memberRecord = await OrganizationTeamMember.query().where('user_id', user.id).first()

    if (!memberRecord) {
      return response.notFound({ message: 'User is not part of any organization' })
    }

    const orgId = memberRecord.organizationId

    // Total volunteers
    const totalVolunteers = await Database.from('organization_volunteers')
      .where('organization_id', orgId)
      .count('* as total')

    // Active volunteers (participated in last 30 days)
    const thirtyDaysAgo = DateTime.now().minus({ days: 30 }).toSQLDate()
    const activeVolunteers = await Database.from('organization_volunteers')
      .join('volunteer_hours', 'organization_volunteers.user_id', 'volunteer_hours.user_id')
      .where('organization_volunteers.organization_id', orgId)
      .where('volunteer_hours.date', '>=', thirtyDaysAgo)
      .distinct('organization_volunteers.user_id')
      .count('* as total')

    // Retention rate
    const retentionRate =
      totalVolunteers[0].total > 0
        ? Math.round((activeVolunteers[0].total / totalVolunteers[0].total) * 100)
        : 0

    // Average hours per volunteer
    const avgHoursResult = await Database.from('volunteer_hours')
      .join('organization_volunteers', 'volunteer_hours.user_id', 'organization_volunteers.user_id')
      .where('organization_volunteers.organization_id', orgId)
      .where('volunteer_hours.status', 'approved')
      .avg('volunteer_hours.hours as avg_hours')

    // Volunteer growth over last 12 months
    // MySQL-friendly: use DATE_FORMAT to bucket by month
    const volunteerGrowth = await Database.from('organization_volunteers')
      .where('organization_id', orgId)
      .select(Database.raw("DATE_FORMAT(joined_at, '%Y-%m-01') as month"))
      .count('* as count')
      .groupByRaw("DATE_FORMAT(joined_at, '%Y-%m-01')")
      .orderBy('month', 'desc')
      .limit(12)

    // Status distribution
    const statusDistribution = await Database.from('organization_volunteers')
      .where('organization_id', orgId)
      .select('status')
      .count('* as count')
      .groupBy('status')

    return response.ok({
      total_volunteers: totalVolunteers[0].total,
      active_volunteers: activeVolunteers[0].total,
      retention_rate: retentionRate,
      avg_hours_per_volunteer: Math.round(avgHoursResult[0].avg_hours || 0),
      volunteer_growth: volunteerGrowth,
      status_distribution: statusDistribution
    })
  }

  /**
   * Get volunteer leaderboard (top performers)
   */
  public async leaderboard({ auth, request, response }: HttpContextContract) {
    const user = auth.user!
    const memberRecord = await OrganizationTeamMember.query().where('user_id', user.id).first()

    if (!memberRecord) {
      return response.notFound({ message: 'User is not part of any organization' })
    }

    const orgId = memberRecord.organizationId
    const { metric = 'hours', limit = 10, startDate, endDate } = request.qs()

    let query = Database
      .from('volunteer_hours')
      .join('organization_volunteers', 'volunteer_hours.user_id', 'organization_volunteers.user_id')
      .join('users', 'users.id', 'volunteer_hours.user_id')
      .where('organization_volunteers.organization_id', orgId)
      .where('volunteer_hours.status', 'approved')
      .select(
        'users.id',
        'users.first_name',
        'users.last_name',
        'users.email'
      )

    if (startDate) {
      query = query.where('volunteer_hours.date', '>=', startDate)
    }
    if (endDate) {
      query = query.where('volunteer_hours.date', '<=', endDate)
    }

    if (metric === 'hours') {
      query = query
        .sum('volunteer_hours.hours as total_hours')
        .groupBy('users.id', 'users.first_name', 'users.last_name', 'users.email')
        .orderBy('total_hours', 'desc')
    } else if (metric === 'events') {
      query = query
        .countDistinct('volunteer_hours.event_id as event_count')
        .groupBy('users.id', 'users.first_name', 'users.last_name', 'users.email')
        .orderBy('event_count', 'desc')
    }

    const leaderboard = await query.limit(limit)

    return response.ok(leaderboard)
  }

  /**
   * Get trends (hours, volunteers over time)
   */
  public async trends({ auth, request, response }: HttpContextContract) {
    const user = auth.user!
    const memberRecord = await OrganizationTeamMember.query().where('user_id', user.id).first()

    if (!memberRecord) {
      return response.notFound({ message: 'User is not part of any organization' })
    }

    const orgId = memberRecord.organizationId
    const { startDate, endDate, interval = 'month' } = request.qs()

    const start = startDate ? DateTime.fromISO(startDate) : DateTime.now().minus({ months: 6 })
    const end = endDate ? DateTime.fromISO(endDate) : DateTime.now()

    // Hours trend
    let hoursTrendQuery = Database
      .from('volunteer_hours')
      .join('organization_volunteers', 'volunteer_hours.user_id', 'organization_volunteers.user_id')
      .where('organization_volunteers.organization_id', orgId)
      .where('volunteer_hours.status', 'approved')

    if (interval === 'month') {
      // bucket by month using DATE_FORMAT
      hoursTrendQuery = hoursTrendQuery
        .select(Database.raw("DATE_FORMAT(volunteer_hours.date, '%Y-%m-01') as period"))
        .sum('volunteer_hours.hours as total_hours')
        .count('volunteer_hours.id as log_count')
        .countDistinct('volunteer_hours.user_id as volunteer_count')
        .groupByRaw("DATE_FORMAT(volunteer_hours.date, '%Y-%m-01')")
    } else if (interval === 'week') {
      // Use YEAR-WEEK (ISO) representation for week buckets
      hoursTrendQuery = hoursTrendQuery
        .select(Database.raw("DATE_FORMAT(volunteer_hours.date, '%x-Week-%v') as period"))
        .sum('volunteer_hours.hours as total_hours')
        .count('volunteer_hours.id as log_count')
        .countDistinct('volunteer_hours.user_id as volunteer_count')
        .groupByRaw("DATE_FORMAT(volunteer_hours.date, '%x-Week-%v')")
    }

    hoursTrendQuery = hoursTrendQuery
      .where('volunteer_hours.date', '>=', start.toSQLDate())
      .where('volunteer_hours.date', '<=', end.toSQLDate())
      .orderBy('period', 'asc')

    const hoursTrend = await hoursTrendQuery

    // Events trend
    let eventsTrendQuery = Database.from('events').where('organization_id', orgId)

    if (interval === 'month') {
      eventsTrendQuery = eventsTrendQuery
        .select(Database.raw("DATE_FORMAT(start_at, '%Y-%m-01') as period"))
        .count('* as event_count')
        .groupByRaw("DATE_FORMAT(start_at, '%Y-%m-01')")
    } else if (interval === 'week') {
      eventsTrendQuery = eventsTrendQuery
        .select(Database.raw("DATE_FORMAT(start_at, '%x-Week-%v') as period"))
        .count('* as event_count')
        .groupByRaw("DATE_FORMAT(start_at, '%x-Week-%v')")
    }

    eventsTrendQuery = eventsTrendQuery
      .where('start_at', '>=', start.toSQL())
      .where('start_at', '<=', end.toSQL())
      .orderBy('period', 'asc')

    const eventsTrend = await eventsTrendQuery

    return response.ok({
      hours_trend: hoursTrend,
      events_trend: eventsTrend,
      interval,
      start_date: start.toISODate(),
      end_date: end.toISODate()
    })
  }
}
