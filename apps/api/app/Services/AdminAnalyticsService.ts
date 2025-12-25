import Database from '@ioc:Adonis/Lucid/Database'
import { DateTime } from 'luxon'
import User from 'App/Models/User'
import Organization from 'App/Models/Organization'
import VolunteerHour from 'App/Models/VolunteerHour'
import Opportunity from 'App/Models/Opportunity'
import SystemMetric from 'App/Models/SystemMetric'

interface DateRange {
  from: DateTime
  to: DateTime
}

interface PlatformOverview {
  totalUsers: number
  activeUsers: number
  totalOrganizations: number
  activeOrganizations: number
  totalVolunteerHours: number
  totalOpportunities: number
  completedOpportunities: number
  platformComplianceRate: number
}

interface GrowthTrendPoint {
  date: string
  count: number
}

interface ComplianceRateData {
  overallRate: number
  byDocumentType: {
    docType: string
    rate: number
    total: number
    valid: number
  }[]
}

interface TopOrganization {
  id: number
  name: string
  totalHours: number
  totalVolunteers: number
  totalOpportunities: number
  rank: number
}

interface EngagementMetrics {
  averageHoursPerUser: number
  averageOpportunitiesPerUser: number
  userRetentionRate: number
  organizationRetentionRate: number
  monthlyActiveUsers: number
}

export default class AdminAnalyticsService {
  /**
   * Get platform-wide overview statistics
   */
  public static async getPlatformOverview(dateRange?: DateRange): Promise<PlatformOverview> {
    const from = dateRange?.from || DateTime.now().minus({ months: 12 })
    const to = dateRange?.to || DateTime.now()

    // Total users
    const totalUsersResult = await User.query().count('* as total')
    const totalUsers = Number(totalUsersResult[0].$extras.total || 0)

    // Active users (with verified email)
    const activeUsersResult = await User.query()
      .whereNotNull('email_verified_at')
      .count('* as total')
    const activeUsers = Number(activeUsersResult[0].$extras.total || 0)

    // Total organizations
    const totalOrgsResult = await Organization.query().count('* as total')
    const totalOrganizations = Number(totalOrgsResult[0].$extras.total || 0)

    // Active organizations
    const activeOrgsResult = await Organization.query()
      .where('status', 'active')
      .count('* as total')
    const activeOrganizations = Number(activeOrgsResult[0].$extras.total || 0)

    // Total volunteer hours (approved)
    const totalHoursResult = await VolunteerHour.query()
      .where('status', 'Approved')
      .whereBetween('date', [from.toSQLDate()!, to.toSQLDate()!])
      .sum('hours as total')
    const totalVolunteerHours = Number(totalHoursResult[0].$extras.total || 0)

    // Total opportunities
    const totalOpportunitiesResult = await Opportunity.query()
      .whereBetween('start_at', [from.toSQL()!, to.toSQL()!])
      .count('* as total')
    const totalOpportunities = Number(totalOpportunitiesResult[0].$extras.total || 0)

    // Completed opportunities
    const completedOpportunitiesResult = await Opportunity.query()
      .whereBetween('start_at', [from.toSQL()!, to.toSQL()!])
      .where('end_at', '<', DateTime.now().toSQL()!)
      .count('* as total')
    const completedOpportunities = Number(completedOpportunitiesResult[0].$extras.total || 0)

    // Platform compliance rate
    const platformComplianceRate = await this.calculatePlatformComplianceRate()

    return {
      totalUsers,
      activeUsers,
      totalOrganizations,
      activeOrganizations,
      totalVolunteerHours: Math.round(totalVolunteerHours * 10) / 10,
      totalOpportunities,
      completedOpportunities,
      platformComplianceRate: Math.round(platformComplianceRate * 10) / 10
    }
  }

  /**
   * Get user growth trend over time
   */
  public static async getUserGrowthTrend(dateRange: DateRange): Promise<GrowthTrendPoint[]> {
    const from = dateRange.from
    const to = dateRange.to

    const results = await Database.from('users')
      .select(Database.raw('DATE(created_at) as date'))
      .count('* as count')
      .whereBetween('created_at', [from.toSQL()!, to.toSQL()!])
      .groupByRaw('DATE(created_at)')
      .orderBy('date', 'asc')

    return results.map((row) => ({
      date: row.date,
      count: Number(row.count || 0)
    }))
  }

  /**
   * Get organization growth trend over time
   */
  public static async getOrganizationGrowthTrend(
    dateRange: DateRange
  ): Promise<GrowthTrendPoint[]> {
    const from = dateRange.from
    const to = dateRange.to

    const results = await Database.from('organizations')
      .select(Database.raw('DATE(created_at) as date'))
      .count('* as count')
      .whereBetween('created_at', [from.toSQL()!, to.toSQL()!])
      .groupByRaw('DATE(created_at)')
      .orderBy('date', 'asc')

    return results.map((row) => ({
      date: row.date,
      count: Number(row.count || 0)
    }))
  }

  /**
   * Get volunteer hours trend over time
   */
  public static async getVolunteerHoursTrend(dateRange: DateRange): Promise<GrowthTrendPoint[]> {
    const from = dateRange.from
    const to = dateRange.to

    const results = await Database.from('volunteer_hours')
      .select(Database.raw('DATE(date) as date'))
      .sum('hours as count')
      .where('status', 'Approved')
      .whereBetween('date', [from.toSQLDate()!, to.toSQLDate()!])
      .groupByRaw('DATE(date)')
      .orderBy('date', 'asc')

    return results.map((row) => ({
      date: row.date,
      count: Math.round(Number(row.count || 0) * 10) / 10
    }))
  }

  /**
   * Get platform-wide compliance rates
   */
  public static async getComplianceRates(): Promise<ComplianceRateData> {
    // Get all active volunteers across all organizations
    const activeVolunteersResult = await Database.from('organization_volunteers')
      .where('status', 'active')
      .countDistinct('user_id as count')
    const totalVolunteers = Number(activeVolunteersResult[0].count || 0)

    if (totalVolunteers === 0) {
      return {
        overallRate: 100,
        byDocumentType: []
      }
    }

    // Get all mandatory compliance requirements across all organizations
    const requirements = await Database.from('compliance_requirements')
      .where('is_mandatory', true)
      .select('doc_type')
      .groupBy('doc_type')

    const byDocumentType: ComplianceRateData['byDocumentType'] = []
    let totalCompliant = 0
    let totalRequired = 0

    for (const req of requirements) {
      // Count volunteers who need this document type
      const volunteersNeedingDoc = await Database.rawQuery(
        `
        SELECT COUNT(DISTINCT ov.user_id) as count
        FROM organization_volunteers ov
        INNER JOIN compliance_requirements cr ON cr.organization_id = ov.organization_id
        WHERE ov.status = 'active'
          AND cr.doc_type = ?
          AND cr.is_mandatory = true
      `,
        [req.doc_type]
      )
      const total = Number(volunteersNeedingDoc[0][0].count || 0)

      // Count volunteers with valid documents
      const validDocsResult = await Database.rawQuery(
        `
        SELECT COUNT(DISTINCT cd.user_id) as count
        FROM compliance_documents cd
        INNER JOIN organization_volunteers ov ON ov.user_id = cd.user_id
        INNER JOIN compliance_requirements cr ON cr.organization_id = ov.organization_id
        WHERE ov.status = 'active'
          AND cd.doc_type = ?
          AND cd.status = 'Valid'
          AND (cd.expires_at IS NULL OR cd.expires_at > NOW())
          AND cr.doc_type = ?
          AND cr.is_mandatory = true
      `,
        [req.doc_type, req.doc_type]
      )
      const valid = Number(validDocsResult[0][0].count || 0)

      const rate = total > 0 ? (valid / total) * 100 : 100

      byDocumentType.push({
        docType: req.doc_type,
        rate: Math.round(rate * 10) / 10,
        total,
        valid
      })

      totalCompliant += valid
      totalRequired += total
    }

    const overallRate = totalRequired > 0 ? (totalCompliant / totalRequired) * 100 : 100

    return {
      overallRate: Math.round(overallRate * 10) / 10,
      byDocumentType
    }
  }

  /**
   * Get top organizations by activity
   */
  public static async getTopOrganizations(limit: number = 10): Promise<TopOrganization[]> {
    const results = await Database.from('organizations as o')
      .leftJoin('volunteer_hours as vh', function () {
        this.on('vh.organization_id', 'o.id').andOnVal('vh.status', '=', 'Approved')
      })
      .leftJoin('organization_volunteers as ov', function () {
        this.on('ov.organization_id', 'o.id').andOnVal('ov.status', '=', 'active')
      })
      .leftJoin('opportunities as op', 'op.organization_id', 'o.id')
      .where('o.status', 'active')
      .select('o.id', 'o.name')
      .sum('vh.hours as total_hours')
      .countDistinct('ov.user_id as total_volunteers')
      .count('op.id as total_opportunities')
      .groupBy('o.id', 'o.name')
      .orderBy('total_hours', 'desc')
      .limit(limit)

    return results.map((row, index) => ({
      id: row.id,
      name: row.name,
      totalHours: Math.round(Number(row.total_hours || 0) * 10) / 10,
      totalVolunteers: Number(row.total_volunteers || 0),
      totalOpportunities: Number(row.total_opportunities || 0),
      rank: index + 1
    }))
  }

  /**
   * Get engagement metrics
   */
  public static async getEngagementMetrics(dateRange?: DateRange): Promise<EngagementMetrics> {
    const from = dateRange?.from || DateTime.now().minus({ months: 1 })
    const to = dateRange?.to || DateTime.now()

    // Average hours per user
    const hoursStats = await Database.from('volunteer_hours')
      .where('status', 'Approved')
      .whereBetween('date', [from.toSQLDate()!, to.toSQLDate()!])
      .sum('hours as total_hours')
      .countDistinct('user_id as total_users')

    const totalHours = Number(hoursStats[0].total_hours || 0)
    const totalUsers = Number(hoursStats[0].total_users || 0)
    const averageHoursPerUser = totalUsers > 0 ? totalHours / totalUsers : 0

    // Average opportunities per user
    const opportunityStats = await Database.from('applications')
      .where('status', 'accepted')
      .whereBetween('created_at', [from.toSQL()!, to.toSQL()!])
      .count('* as total_applications')
      .countDistinct('user_id as total_users')

    const totalApplications = Number(opportunityStats[0].total_applications || 0)
    const usersWithApplications = Number(opportunityStats[0].total_users || 0)
    const averageOpportunitiesPerUser =
      usersWithApplications > 0 ? totalApplications / usersWithApplications : 0

    // Monthly active users
    const monthStart = DateTime.now().startOf('month')
    const monthlyActiveResult = await VolunteerHour.query()
      .where('status', 'Approved')
      .where('date', '>=', monthStart.toSQLDate()!)
      .countDistinct('user_id as count')
    const monthlyActiveUsers = Number(monthlyActiveResult[0].$extras.count || 0)

    // User retention rate (users active in both first and last month of range)
    const firstMonthStart = from.startOf('month')
    const firstMonthEnd = from.endOf('month')
    const lastMonthStart = to.startOf('month')

    const firstMonthUsers = await VolunteerHour.query()
      .where('status', 'Approved')
      .whereBetween('date', [firstMonthStart.toSQLDate()!, firstMonthEnd.toSQLDate()!])
      .select('user_id')
      .distinct()

    const firstMonthIds = firstMonthUsers.map((v) => v.userId)

    let userRetentionRate = 0
    if (firstMonthIds.length > 0) {
      const retainedResult = await VolunteerHour.query()
        .where('status', 'Approved')
        .where('date', '>=', lastMonthStart.toSQLDate()!)
        .whereIn('user_id', firstMonthIds)
        .countDistinct('user_id as count')
      const retained = Number(retainedResult[0].$extras.count || 0)
      userRetentionRate = (retained / firstMonthIds.length) * 100
    }

    // Organization retention rate
    const firstMonthOrgs = await Database.from('organizations')
      .whereBetween('created_at', [firstMonthStart.toSQL()!, firstMonthEnd.toSQL()!])
      .select('id')

    const firstMonthOrgIds = firstMonthOrgs.map((o) => o.id)

    let organizationRetentionRate = 0
    if (firstMonthOrgIds.length > 0) {
      const activeOrgsResult = await Organization.query()
        .whereIn('id', firstMonthOrgIds)
        .where('status', 'active')
        .count('* as total')
      const activeOrgs = Number(activeOrgsResult[0].$extras.total || 0)
      organizationRetentionRate = (activeOrgs / firstMonthOrgIds.length) * 100
    }

    return {
      averageHoursPerUser: Math.round(averageHoursPerUser * 10) / 10,
      averageOpportunitiesPerUser: Math.round(averageOpportunitiesPerUser * 10) / 10,
      userRetentionRate: Math.round(userRetentionRate * 10) / 10,
      organizationRetentionRate: Math.round(organizationRetentionRate * 10) / 10,
      monthlyActiveUsers
    }
  }

  /**
   * Calculate platform-wide compliance rate
   */
  private static async calculatePlatformComplianceRate(): Promise<number> {
    const activeVolunteersResult = await Database.from('organization_volunteers')
      .where('status', 'active')
      .countDistinct('user_id as count')
    const totalVolunteers = Number(activeVolunteersResult[0].count || 0)

    if (totalVolunteers === 0) {
      return 100
    }

    // Count total required documents
    const totalRequiredResult = await Database.rawQuery(
      `
      SELECT COUNT(*) as count
      FROM organization_volunteers ov
      INNER JOIN compliance_requirements cr ON cr.organization_id = ov.organization_id
      WHERE ov.status = 'active'
        AND cr.is_mandatory = true
    `,
      []
    )
    const totalRequired = Number(totalRequiredResult[0][0].count || 0)

    if (totalRequired === 0) {
      return 100
    }

    // Count valid documents
    const validDocsResult = await Database.rawQuery(
      `
      SELECT COUNT(*) as count
      FROM compliance_documents cd
      INNER JOIN organization_volunteers ov ON ov.user_id = cd.user_id
      INNER JOIN compliance_requirements cr ON cr.organization_id = ov.organization_id AND cr.doc_type = cd.doc_type
      WHERE ov.status = 'active'
        AND cr.is_mandatory = true
        AND cd.status = 'Valid'
        AND (cd.expires_at IS NULL OR cd.expires_at > NOW())
    `,
      []
    )
    const validCount = Number(validDocsResult[0][0].count || 0)

    return (validCount / totalRequired) * 100
  }

  /**
   * Store metric for historical tracking
   */
  public static async storeMetric(
    metricType: string,
    metricDate: DateTime,
    metricValue: number,
    metadata?: Record<string, any>
  ): Promise<SystemMetric> {
    const metric = new SystemMetric()
    metric.metricType = metricType
    metric.metricDate = metricDate
    metric.metricValue = metricValue
    if (metadata) {
      metric.setMetadata(metadata)
    }
    await metric.save()
    return metric
  }
}
