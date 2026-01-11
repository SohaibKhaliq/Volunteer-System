import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import OrganizationTeamMember from 'App/Models/OrganizationTeamMember'
import Database from '@ioc:Adonis/Lucid/Database'
import { DateTime } from 'luxon'

export default class OrganizationReportsController {
  /**
   * Get comprehensive organization analytics summary
   */
  public async summary({ auth, request, response }: HttpContextContract) {
    const user = auth.user!
    const memberRecord = await OrganizationTeamMember.query().where('user_id', user.id).first()

    if (!memberRecord) {
      return response.notFound({ message: 'User is not part of any organization' })
    }

    const orgId = memberRecord.organizationId
    const { startDate, endDate } = request.qs()

    const start = startDate ? DateTime.fromISO(startDate) : DateTime.now().minus({ months: 1 })
    const end = endDate ? DateTime.fromISO(endDate) : DateTime.now()

    // Volunteer stats
    const totalVolunteers = await Database.from('organization_volunteers')
      .where('organization_id', orgId)
      .count('* as total')

    const activeVolunteers = await Database.from('organization_volunteers')
      .where('organization_id', orgId)
      .where('status', 'Active')
      .count('* as total')

    const newVolunteers = await Database.from('organization_volunteers')
      .where('organization_id', orgId)
      .where('created_at', '>=', start.toSQL())
      .where('created_at', '<=', end.toSQL())
      .count('* as total')

    // Hours stats
    const totalHours = await Database.from('volunteer_hours')
      .join('organization_volunteers', 'volunteer_hours.user_id', 'organization_volunteers.user_id')
      .where('organization_volunteers.organization_id', orgId)
      .where('volunteer_hours.status', 'approved')
      .sum('volunteer_hours.hours as total')

    const periodHours = await Database.from('volunteer_hours')
      .join('organization_volunteers', 'volunteer_hours.user_id', 'organization_volunteers.user_id')
      .where('organization_volunteers.organization_id', orgId)
      .where('volunteer_hours.status', 'approved')
      .where('volunteer_hours.date', '>=', start.toSQLDate())
      .where('volunteer_hours.date', '<=', end.toSQLDate())
      .sum('volunteer_hours.hours as total')

    // Opportunities stats
    const totalOpportunities = await Database.from('opportunities')
      .where('organization_id', orgId)
      .count('* as total')

    const publishedOpportunities = await Database.from('opportunities')
      .where('organization_id', orgId)
      .where('status', 'published')
      .count('* as total')

    const upcomingOpportunities = await Database.from('opportunities')
      .where('organization_id', orgId)
      .where('status', 'published')
      .where('start_at', '>=', DateTime.now().toSQL())
      .count('* as total')

    // Applications stats
    const totalApplications = await Database.from('applications')
      .join('opportunities', 'applications.opportunity_id', 'opportunities.id')
      .where('opportunities.organization_id', orgId)
      .count('* as total')

    const applicationsByStatus = await Database.from('applications')
      .join('opportunities', 'applications.opportunity_id', 'opportunities.id')
      .where('opportunities.organization_id', orgId)
      .select('applications.status')
      .count('* as count')
      .groupBy('applications.status')

    // Attendance stats
    const totalAttendances = await Database.from('attendances')
      .join('opportunities', 'attendances.opportunity_id', 'opportunities.id')
      .where('opportunities.organization_id', orgId)
      .count('* as total')

    const attendancesByMethod = await Database.from('attendances')
      .join('opportunities', 'attendances.opportunity_id', 'opportunities.id')
      .where('opportunities.organization_id', orgId)
      .select('attendances.method')
      .count('* as count')
      .groupBy('attendances.method')

    // Team stats
    const totalTeams = await Database.from('teams').where('organization_id', orgId).count('* as total')

    const teamResources = await Database.from('resource_assignments')
      .join('teams', 'resource_assignments.related_id', 'teams.id')
      .where('teams.organization_id', orgId)
      .where('resource_assignments.assignment_type', 'team')
      .whereIn('resource_assignments.status', ['assigned', 'in_use'])
      .count('* as total')

    return response.ok({
      period: {
        start: start.toISODate(),
        end: end.toISODate()
      },
      volunteers: {
        total: totalVolunteers[0]?.total || 0,
        active: activeVolunteers[0]?.total || 0,
        newInPeriod: newVolunteers[0]?.total || 0,
        retentionRate:
          totalVolunteers[0]?.total > 0
            ? Math.round((activeVolunteers[0]?.total / totalVolunteers[0]?.total) * 100)
            : 0
      },
      hours: {
        total: Math.round(totalHours[0]?.total || 0),
        inPeriod: Math.round(periodHours[0]?.total || 0)
      },
      opportunities: {
        total: totalOpportunities[0]?.total || 0,
        published: publishedOpportunities[0]?.total || 0,
        upcoming: upcomingOpportunities[0]?.total || 0
      },
      applications: {
        total: totalApplications[0]?.total || 0,
        byStatus: applicationsByStatus.reduce((acc, s) => {
          acc[s.status] = s.count
          return acc
        }, {})
      },
      attendances: {
        total: totalAttendances[0]?.total || 0,
        byMethod: attendancesByMethod.reduce((acc, m) => {
          acc[m.method || 'unknown'] = m.count
          return acc
        }, {})
      },
      teams: {
        total: totalTeams[0]?.total || 0,
        resourcesAssigned: teamResources[0]?.total || 0,
        complianceRate: 0 // Placeholder for complex calculation
      }
    })
  }

  /**
   * Get volunteer hours report with breakdown
   */
  public async volunteerHours({ auth, request, response }: HttpContextContract) {
    const user = auth.user!
    const memberRecord = await OrganizationTeamMember.query().where('user_id', user.id).first()

    if (!memberRecord) {
      return response.notFound({ message: 'User is not part of any organization' })
    }

    const orgId = memberRecord.organizationId
    const { startDate, endDate, groupBy = 'month' } = request.qs()

    const start = startDate ? DateTime.fromISO(startDate) : DateTime.now().minus({ months: 6 })
    const end = endDate ? DateTime.fromISO(endDate) : DateTime.now()

    let dateFormat: string
    if (groupBy === 'week') {
      dateFormat = '%Y-Week-%v'
    } else if (groupBy === 'day') {
      dateFormat = '%Y-%m-%d'
    } else {
      dateFormat = '%Y-%m-01'
    }

    const hoursTrend = await Database.from('volunteer_hours')
      .join('organization_volunteers', 'volunteer_hours.user_id', 'organization_volunteers.user_id')
      .where('organization_volunteers.organization_id', orgId)
      .where('volunteer_hours.status', 'approved')
      .where('volunteer_hours.date', '>=', start.toSQLDate())
      .where('volunteer_hours.date', '<=', end.toSQLDate())
      .select(Database.raw(`DATE_FORMAT(volunteer_hours.date, '${dateFormat}') as period`))
      .sum('volunteer_hours.hours as total_hours')
      .countDistinct('volunteer_hours.user_id as volunteer_count')
      .count('volunteer_hours.id as log_count')
      .groupByRaw(`DATE_FORMAT(volunteer_hours.date, '${dateFormat}')`)
      .orderBy('period', 'asc')

    // Top volunteers
    const topVolunteers = await Database.from('volunteer_hours')
      .join('organization_volunteers', 'volunteer_hours.user_id', 'organization_volunteers.user_id')
      .join('users', 'volunteer_hours.user_id', 'users.id')
      .where('organization_volunteers.organization_id', orgId)
      .where('volunteer_hours.status', 'approved')
      .where('volunteer_hours.date', '>=', start.toSQLDate())
      .where('volunteer_hours.date', '<=', end.toSQLDate())
      .select('users.id', 'users.first_name', 'users.last_name', 'users.email')
      .sum('volunteer_hours.hours as total_hours')
      .count('volunteer_hours.id as log_count')
      .groupBy('users.id', 'users.first_name', 'users.last_name', 'users.email')
      .orderBy('total_hours', 'desc')
      .limit(10)

    return response.ok({
      period: {
        start: start.toISODate(),
        end: end.toISODate(),
        groupBy
      },
      trend: hoursTrend,
      topVolunteers
    })
  }

  /**
   * Get opportunity performance report
   */
  public async opportunityPerformance({ auth, request, response }: HttpContextContract) {
    const user = auth.user!
    const memberRecord = await OrganizationTeamMember.query().where('user_id', user.id).first()

    if (!memberRecord) {
      return response.notFound({ message: 'User is not part of any organization' })
    }

    const orgId = memberRecord.organizationId
    const { startDate, endDate, limit = 20 } = request.qs()

    const start = startDate ? DateTime.fromISO(startDate) : DateTime.now().minus({ months: 3 })
    const end = endDate ? DateTime.fromISO(endDate) : DateTime.now()

    // Get opportunities with stats
    const opportunities = await Database.from('opportunities')
      .leftJoin('applications', 'opportunities.id', 'applications.opportunity_id')
      .leftJoin('attendances', 'opportunities.id', 'attendances.opportunity_id')
      .where('opportunities.organization_id', orgId)
      .where('opportunities.start_at', '>=', start.toSQL())
      .where('opportunities.start_at', '<=', end.toSQL())
      .select(
        'opportunities.id',
        'opportunities.title',
        'opportunities.capacity',
        'opportunities.start_at',
        'opportunities.status'
      )
      // Use countDistinct to avoid the query builder wrapping the whole
      // expression in backticks (which causes `DISTINCT applications.id` to
      // be treated as an identifier). For the CASE WHEN expression we use
      // a raw select so the SQL is emitted verbatim.
      .countDistinct('applications.id as application_count')
      .select(
        Database.raw(
          "count(DISTINCT CASE WHEN applications.status = 'accepted' THEN applications.id END) as accepted_count"
        )
      )
      .countDistinct('attendances.id as attendance_count')
      .groupBy(
        'opportunities.id',
        'opportunities.title',
        'opportunities.capacity',
        'opportunities.start_at',
        'opportunities.status'
      )
      .orderBy('opportunities.start_at', 'desc')
      .limit(limit)

    return response.ok({
      period: {
        start: start.toISODate(),
        end: end.toISODate()
      },
      opportunities: opportunities.map((o) => ({
        ...o,
        fillRate: o.capacity > 0 ? Math.round((o.accepted_count / o.capacity) * 100) : 0,
        showUpRate:
          o.accepted_count > 0 ? Math.round((o.attendance_count / o.accepted_count) * 100) : 0
      }))
    })
  }

  /**
   * Get volunteer retention analysis
   */
  public async volunteerRetention({ auth, request, response }: HttpContextContract) {
    const user = auth.user!
    const memberRecord = await OrganizationTeamMember.query().where('user_id', user.id).first()

    if (!memberRecord) {
      return response.notFound({ message: 'User is not part of any organization' })
    }

    const orgId = memberRecord.organizationId

    // Volunteers by join month (cohort analysis)
    const cohorts = await Database.from('organization_volunteers')
      .where('organization_id', orgId)
      .select(
        Database.raw("DATE_FORMAT(COALESCE(joined_at, created_at), '%Y-%m-01') as cohort_month")
      )
      .count('* as cohort_size')
      .groupByRaw("DATE_FORMAT(COALESCE(joined_at, created_at), '%Y-%m-01')")
      .orderBy('cohort_month', 'desc')
      .limit(12)

    // Active volunteers per cohort (activity in last 30 days)
    const thirtyDaysAgo = DateTime.now().minus({ days: 30 }).toSQLDate()
    const activeByCohort = await Database.from('organization_volunteers')
      .join('volunteer_hours', 'organization_volunteers.user_id', 'volunteer_hours.user_id')
      .where('organization_volunteers.organization_id', orgId)
      .where('volunteer_hours.date', '>=', thirtyDaysAgo)
      .select(
        Database.raw(
          "DATE_FORMAT(COALESCE(organization_volunteers.joined_at, organization_volunteers.created_at), '%Y-%m-01') as cohort_month"
        )
      )
      .countDistinct('organization_volunteers.user_id as active_count')
      .groupByRaw(
        "DATE_FORMAT(COALESCE(organization_volunteers.joined_at, organization_volunteers.created_at), '%Y-%m-01')"
      )

    const activeMap = activeByCohort.reduce((acc, c) => {
      acc[c.cohort_month] = c.active_count
      return acc
    }, {})

    return response.ok({
      cohorts: cohorts.map((c) => ({
        month: c.cohort_month,
        cohortSize: c.cohort_size,
        stillActive: activeMap[c.cohort_month] || 0,
        retentionRate:
          c.cohort_size > 0
            ? Math.round(((activeMap[c.cohort_month] || 0) / c.cohort_size) * 100)
            : 0
      }))
    })
  }
}
