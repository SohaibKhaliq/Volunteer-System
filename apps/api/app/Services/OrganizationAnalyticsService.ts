import Database from '@ioc:Adonis/Lucid/Database'
import { DateTime } from 'luxon'
import VolunteerHour from 'App/Models/VolunteerHour'
import Attendance from 'App/Models/Attendance'
import ComplianceDocument from 'App/Models/ComplianceDocument'
import User from 'App/Models/User'
import Opportunity from 'App/Models/Opportunity'

interface DateRange {
  from: DateTime
  to: DateTime
}

interface OverviewStats {
  totalHours: number
  totalVolunteers: number
  activeVolunteers: number
  totalEvents: number
  completedEvents: number
  complianceRate: number
  averageHoursPerVolunteer: number
}

interface HoursTrendPoint {
  date: string
  hours: number
  volunteers: number
}

interface VolunteerParticipation {
  activeVolunteers: number
  inactiveVolunteers: number
  newVolunteers: number
  participationRate: number
  volunteersByHours: {
    range: string
    count: number
  }[]
}

interface EventPerformance {
  eventId: number
  title: string
  date: DateTime
  capacity: number
  registered: number
  attended: number
  attendanceRate: number
  totalHours: number
}

interface ComplianceStatus {
  overallRate: number
  byDocType: {
    docType: string
    total: number
    valid: number
    expired: number
    missing: number
  }[]
  expiringDocuments: {
    userId: number
    userName: string
    docType: string
    expiresAt: DateTime
  }[]
}

interface EngagementMetrics {
  retentionRate: number
  averageHoursPerVolunteer: number
  averageEventsPerVolunteer: number
  monthlyActiveVolunteers: number
  volunteerGrowthRate: number
}

interface TopVolunteer {
  userId: number
  name: string
  email: string
  totalHours: number
  totalEvents: number
  rank: number
}

export default class OrganizationAnalyticsService {
  /**
   * Get overview statistics for an organization
   */
  public static async getOverviewStats(
    organizationId: number,
    dateRange?: DateRange
  ): Promise<OverviewStats> {
    const from = dateRange?.from || DateTime.now().minus({ months: 12 })
    const to = dateRange?.to || DateTime.now()

    // Total approved hours
    let hoursQuery = VolunteerHour.query()
      .where('organization_id', organizationId)
      .where('status', 'Approved')
      .whereBetween('date', [from.toSQLDate()!, to.toSQLDate()!])

    const hoursResult = await hoursQuery.sum('hours as total')
    const totalHours = Number(hoursResult[0].$extras.total || 0)

    // Total volunteers (ever associated with organization)
    const totalVolunteersResult = await Database.from('organization_volunteers')
      .where('organization_id', organizationId)
      .countDistinct('user_id as count')
    const totalVolunteers = Number(totalVolunteersResult[0].count || 0)

    // Active volunteers (with hours in date range)
    const activeVolunteersResult = await VolunteerHour.query()
      .where('organization_id', organizationId)
      .where('status', 'Approved')
      .whereBetween('date', [from.toSQLDate()!, to.toSQLDate()!])
      .countDistinct('user_id as count')
    const activeVolunteers = Number(activeVolunteersResult[0].$extras.count || 0)

    // Total events in date range
    const totalEventsResult = await Opportunity.query()
      .where('organization_id', organizationId)
      .whereBetween('start_at', [from.toSQL()!, to.toSQL()!])
      .count('* as total')
    const totalEvents = Number(totalEventsResult[0].$extras.total || 0)

    // Completed events (past end date)
    const completedEventsResult = await Opportunity.query()
      .where('organization_id', organizationId)
      .whereBetween('start_at', [from.toSQL()!, to.toSQL()!])
      .where('end_at', '<', DateTime.now().toSQL()!)
      .count('* as total')
    const completedEvents = Number(completedEventsResult[0].$extras.total || 0)

    // Compliance rate
    const complianceRate = await this.calculateComplianceRate(organizationId)

    // Average hours per volunteer
    const averageHoursPerVolunteer =
      activeVolunteers > 0 ? totalHours / activeVolunteers : 0

    return {
      totalHours: Math.round(totalHours * 10) / 10,
      totalVolunteers,
      activeVolunteers,
      totalEvents,
      completedEvents,
      complianceRate: Math.round(complianceRate * 100) / 100,
      averageHoursPerVolunteer: Math.round(averageHoursPerVolunteer * 10) / 10
    }
  }

  /**
   * Get hours trend over time
   */
  public static async getHoursTrend(
    organizationId: number,
    dateRange: DateRange,
    groupBy: 'day' | 'week' | 'month' = 'week'
  ): Promise<HoursTrendPoint[]> {
    const from = dateRange.from
    const to = dateRange.to

    let dateFormat: string
    switch (groupBy) {
      case 'day':
        dateFormat = '%Y-%m-%d'
        break
      case 'week':
        dateFormat = '%Y-%u' // Year-Week
        break
      case 'month':
        dateFormat = '%Y-%m'
        break
    }

    const results = await Database.from('volunteer_hours')
      .select(Database.raw(`DATE_FORMAT(date, '${dateFormat}') as period`))
      .sum('hours as total_hours')
      .countDistinct('user_id as volunteer_count')
      .where('organization_id', organizationId)
      .where('status', 'Approved')
      .whereBetween('date', [from.toSQLDate()!, to.toSQLDate()!])
      .groupByRaw(`DATE_FORMAT(date, '${dateFormat}')`)
      .orderBy('period', 'asc')

    return results.map((row) => ({
      date: row.period,
      hours: Math.round(Number(row.total_hours || 0) * 10) / 10,
      volunteers: Number(row.volunteer_count || 0)
    }))
  }

  /**
   * Get volunteer participation metrics
   */
  public static async getVolunteerParticipation(
    organizationId: number,
    dateRange: DateRange
  ): Promise<VolunteerParticipation> {
    const from = dateRange.from
    const to = dateRange.to

    // Active volunteers (with hours in range)
    const activeResult = await VolunteerHour.query()
      .where('organization_id', organizationId)
      .where('status', 'Approved')
      .whereBetween('date', [from.toSQLDate()!, to.toSQLDate()!])
      .countDistinct('user_id as count')
    const activeVolunteers = Number(activeResult[0].$extras.count || 0)

    // Total volunteers in organization
    const totalResult = await Database.from('organization_volunteers')
      .where('organization_id', organizationId)
      .where('status', 'active')
      .countDistinct('user_id as count')
    const totalVolunteers = Number(totalResult[0].count || 0)

    const inactiveVolunteers = totalVolunteers - activeVolunteers

    // New volunteers (joined in date range)
    const newResult = await Database.from('organization_volunteers')
      .where('organization_id', organizationId)
      .whereBetween('joined_at', [from.toSQL()!, to.toSQL()!])
      .countDistinct('user_id as count')
    const newVolunteers = Number(newResult[0].count || 0)

    // Participation rate
    const participationRate = totalVolunteers > 0 ? (activeVolunteers / totalVolunteers) * 100 : 0

    // Volunteers by hours ranges
    const hourRanges = await Database.rawQuery(
      `
      SELECT 
        CASE 
          WHEN total_hours < 10 THEN '0-10 hours'
          WHEN total_hours < 25 THEN '10-25 hours'
          WHEN total_hours < 50 THEN '25-50 hours'
          WHEN total_hours < 100 THEN '50-100 hours'
          ELSE '100+ hours'
        END as range,
        COUNT(*) as count
      FROM (
        SELECT user_id, SUM(hours) as total_hours
        FROM volunteer_hours
        WHERE organization_id = ?
          AND status = 'Approved'
          AND date BETWEEN ? AND ?
        GROUP BY user_id
      ) as user_hours
      GROUP BY range
      ORDER BY 
        CASE range
          WHEN '0-10 hours' THEN 1
          WHEN '10-25 hours' THEN 2
          WHEN '25-50 hours' THEN 3
          WHEN '50-100 hours' THEN 4
          ELSE 5
        END
    `,
      [organizationId, from.toSQLDate(), to.toSQLDate()]
    )

    const volunteersByHours = hourRanges[0].map((row: any) => ({
      range: row.range,
      count: Number(row.count)
    }))

    return {
      activeVolunteers,
      inactiveVolunteers,
      newVolunteers,
      participationRate: Math.round(participationRate * 10) / 10,
      volunteersByHours
    }
  }

  /**
   * Get event performance metrics
   */
  public static async getEventPerformance(
    organizationId: number,
    dateRange: DateRange,
    limit: number = 20
  ): Promise<EventPerformance[]> {
    const from = dateRange.from
    const to = dateRange.to

    const events = await Opportunity.query()
      .where('organization_id', organizationId)
      .whereBetween('start_at', [from.toSQL()!, to.toSQL()!])
      .orderBy('start_at', 'desc')
      .limit(limit)

    const performance: EventPerformance[] = []

    for (const event of events) {
      // Count registered (accepted applications)
      const registeredResult = await Database.from('applications')
        .where('opportunity_id', event.id)
        .where('status', 'accepted')
        .count('* as total')
      const registered = Number(registeredResult[0].total || 0)

      // Count attended (present attendance)
      const attendedResult = await Attendance.query()
        .where('opportunity_id', event.id)
        .where('status', 'Present')
        .count('* as total')
      const attended = Number(attendedResult[0].$extras.total || 0)

      // Total hours for this event
      const hoursResult = await VolunteerHour.query()
        .where('event_id', event.id)
        .where('status', 'Approved')
        .sum('hours as total')
      const totalHours = Number(hoursResult[0].$extras.total || 0)

      const attendanceRate = registered > 0 ? (attended / registered) * 100 : 0

      performance.push({
        eventId: event.id,
        title: event.title,
        date: event.startAt,
        capacity: event.capacity || 0,
        registered,
        attended,
        attendanceRate: Math.round(attendanceRate * 10) / 10,
        totalHours: Math.round(totalHours * 10) / 10
      })
    }

    return performance
  }

  /**
   * Get compliance status
   */
  public static async getComplianceStatus(organizationId: number): Promise<ComplianceStatus> {
    // Get all volunteers in organization
    const volunteers = await Database.from('organization_volunteers')
      .where('organization_id', organizationId)
      .where('status', 'active')
      .select('user_id')

    const volunteerIds = volunteers.map((v) => v.user_id)

    if (volunteerIds.length === 0) {
      return {
        overallRate: 100,
        byDocType: [],
        expiringDocuments: []
      }
    }

    // Get required document types for this organization
    const requirements = await Database.from('compliance_requirements')
      .where('organization_id', organizationId)
      .where('is_mandatory', true)
      .select('doc_type', 'name')

    const byDocType: ComplianceStatus['byDocType'] = []
    let totalCompliant = 0
    let totalRequired = 0

    for (const req of requirements) {
      const total = volunteerIds.length
      totalRequired += total

      // Count valid documents
      const validResult = await ComplianceDocument.query()
        .whereIn('user_id', volunteerIds)
        .where('doc_type', req.doc_type)
        .where('status', 'Valid')
        .where((query) => {
          query.whereNull('expires_at').orWhere('expires_at', '>', DateTime.now().toSQL()!)
        })
        .countDistinct('user_id as count')
      const valid = Number(validResult[0].$extras.count || 0)

      // Count expired documents
      const expiredResult = await ComplianceDocument.query()
        .whereIn('user_id', volunteerIds)
        .where('doc_type', req.doc_type)
        .where('expires_at', '<=', DateTime.now().toSQL()!)
        .countDistinct('user_id as count')
      const expired = Number(expiredResult[0].$extras.count || 0)

      const missing = total - valid - expired
      totalCompliant += valid

      byDocType.push({
        docType: req.doc_type,
        total,
        valid,
        expired,
        missing
      })
    }

    const overallRate =
      totalRequired > 0 ? Math.round((totalCompliant / totalRequired) * 100 * 10) / 10 : 100

    // Get documents expiring in next 30 days
    const expiringDocs = await ComplianceDocument.query()
      .whereIn('user_id', volunteerIds)
      .where('status', 'Valid')
      .whereBetween('expires_at', [
        DateTime.now().toSQL()!,
        DateTime.now().plus({ days: 30 }).toSQL()!
      ])
      .preload('user')
      .orderBy('expires_at', 'asc')
      .limit(10)

    const expiringDocuments = expiringDocs.map((doc) => ({
      userId: doc.userId,
      userName: `${doc.user.firstName} ${doc.user.lastName}`,
      docType: doc.docType,
      expiresAt: doc.expiresAt!
    }))

    return {
      overallRate,
      byDocType,
      expiringDocuments
    }
  }

  /**
   * Get engagement metrics
   */
  public static async getEngagementMetrics(
    organizationId: number,
    dateRange: DateRange
  ): Promise<EngagementMetrics> {
    const from = dateRange.from
    const to = dateRange.to

    // Monthly active volunteers (in current month)
    const currentMonthStart = DateTime.now().startOf('month')
    const monthlyActiveResult = await VolunteerHour.query()
      .where('organization_id', organizationId)
      .where('status', 'Approved')
      .where('date', '>=', currentMonthStart.toSQLDate()!)
      .countDistinct('user_id as count')
    const monthlyActiveVolunteers = Number(monthlyActiveResult[0].$extras.count || 0)

    // Average hours per volunteer
    const stats = await this.getOverviewStats(organizationId, dateRange)
    const averageHoursPerVolunteer = stats.averageHoursPerVolunteer

    // Average events per volunteer
    const eventsResult = await Attendance.query()
      .whereHas('opportunity', (query) => {
        query.where('organization_id', organizationId)
      })
      .where('status', 'Present')
      .whereBetween('check_in_at', [from.toSQL()!, to.toSQL()!])
      .countDistinct('user_id as volunteers')
      .count('* as total_attendances')

    const volunteers = Number(eventsResult[0].$extras.volunteers || 0)
    const totalAttendances = Number(eventsResult[0].$extras.total_attendances || 0)
    const averageEventsPerVolunteer =
      volunteers > 0 ? Math.round((totalAttendances / volunteers) * 10) / 10 : 0

    // Retention rate (volunteers active in both first and last month of range)
    const firstMonthStart = from.startOf('month')
    const firstMonthEnd = from.endOf('month')
    const lastMonthStart = to.startOf('month')

    const firstMonthVolunteers = await VolunteerHour.query()
      .where('organization_id', organizationId)
      .where('status', 'Approved')
      .whereBetween('date', [firstMonthStart.toSQLDate()!, firstMonthEnd.toSQLDate()!])
      .select('user_id')
      .distinct()

    const firstMonthIds = firstMonthVolunteers.map((v) => v.userId)

    if (firstMonthIds.length === 0) {
      return {
        retentionRate: 0,
        averageHoursPerVolunteer,
        averageEventsPerVolunteer,
        monthlyActiveVolunteers,
        volunteerGrowthRate: 0
      }
    }

    const retainedResult = await VolunteerHour.query()
      .where('organization_id', organizationId)
      .where('status', 'Approved')
      .where('date', '>=', lastMonthStart.toSQLDate()!)
      .whereIn('user_id', firstMonthIds)
      .countDistinct('user_id as count')
    const retained = Number(retainedResult[0].$extras.count || 0)

    const retentionRate = Math.round((retained / firstMonthIds.length) * 100 * 10) / 10

    // Volunteer growth rate
    const previousPeriodFrom = from.minus({ months: 1 })
    const previousPeriodTo = to.minus({ months: 1 })

    const previousActiveResult = await VolunteerHour.query()
      .where('organization_id', organizationId)
      .where('status', 'Approved')
      .whereBetween('date', [previousPeriodFrom.toSQLDate()!, previousPeriodTo.toSQLDate()!])
      .countDistinct('user_id as count')
    const previousActive = Number(previousActiveResult[0].$extras.count || 0)

    const volunteerGrowthRate =
      previousActive > 0
        ? Math.round(((stats.activeVolunteers - previousActive) / previousActive) * 100 * 10) / 10
        : 0

    return {
      retentionRate,
      averageHoursPerVolunteer,
      averageEventsPerVolunteer,
      monthlyActiveVolunteers,
      volunteerGrowthRate
    }
  }

  /**
   * Get top volunteers leaderboard
   */
  public static async getTopVolunteers(
    organizationId: number,
    dateRange: DateRange,
    limit: number = 10
  ): Promise<TopVolunteer[]> {
    const from = dateRange.from
    const to = dateRange.to

    const results = await Database.from('volunteer_hours as vh')
      .join('users as u', 'vh.user_id', 'u.id')
      .where('vh.organization_id', organizationId)
      .where('vh.status', 'Approved')
      .whereBetween('vh.date', [from.toSQLDate()!, to.toSQLDate()!])
      .select('u.id as user_id', 'u.first_name', 'u.last_name', 'u.email')
      .sum('vh.hours as total_hours')
      .groupBy('u.id', 'u.first_name', 'u.last_name', 'u.email')
      .orderBy('total_hours', 'desc')
      .limit(limit)

    const topVolunteers: TopVolunteer[] = []

    for (let i = 0; i < results.length; i++) {
      const row = results[i]

      // Count events attended
      const eventsResult = await Attendance.query()
        .whereHas('opportunity', (query) => {
          query.where('organization_id', organizationId)
        })
        .where('user_id', row.user_id)
        .where('status', 'Present')
        .whereBetween('check_in_at', [from.toSQL()!, to.toSQL()!])
        .count('* as total')
      const totalEvents = Number(eventsResult[0].$extras.total || 0)

      topVolunteers.push({
        userId: row.user_id,
        name: `${row.first_name} ${row.last_name}`,
        email: row.email,
        totalHours: Math.round(Number(row.total_hours || 0) * 10) / 10,
        totalEvents,
        rank: i + 1
      })
    }

    return topVolunteers
  }

  /**
   * Calculate overall compliance rate for organization
   */
  private static async calculateComplianceRate(organizationId: number): Promise<number> {
    const volunteers = await Database.from('organization_volunteers')
      .where('organization_id', organizationId)
      .where('status', 'active')
      .select('user_id')

    const volunteerIds = volunteers.map((v) => v.user_id)

    if (volunteerIds.length === 0) {
      return 100
    }

    const requirements = await Database.from('compliance_requirements')
      .where('organization_id', organizationId)
      .where('is_mandatory', true)
      .count('* as total')

    const requiredDocsPerVolunteer = Number(requirements[0].total || 0)

    if (requiredDocsPerVolunteer === 0) {
      return 100
    }

    const totalRequired = volunteerIds.length * requiredDocsPerVolunteer

    // Count valid documents
    const validDocs = await Database.rawQuery(
      `
      SELECT COUNT(DISTINCT CONCAT(user_id, '-', doc_type)) as count
      FROM compliance_documents
      WHERE user_id IN (?)
        AND status = 'Valid'
        AND (expires_at IS NULL OR expires_at > NOW())
        AND doc_type IN (
          SELECT doc_type FROM compliance_requirements
          WHERE organization_id = ? AND is_mandatory = true
        )
    `,
      [volunteerIds, organizationId]
    )

    const validCount = Number(validDocs[0][0].count || 0)

    return (validCount / totalRequired) * 100
  }
}
