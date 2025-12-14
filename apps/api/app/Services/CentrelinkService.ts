import { DateTime } from 'luxon'

/**
 * Centrelink Service
 * Handles Mutual Obligation reporting for Australian Centrelink recipients
 */
export default class CentrelinkService {
  /**
   * Calculate fortnight periods based on user's start date
   * Centrelink uses 14-day reporting periods specific to each recipient
   */
  public static calculateFortnights(
    startDate: Date,
    endDate: Date
  ): Array<{ start: Date; end: Date; period: number }> {
    const fortnights: Array<{ start: Date; end: Date; period: number }> = []
    let currentStart = DateTime.fromJSDate(startDate).startOf('day')
    const finalEnd = DateTime.fromJSDate(endDate).endOf('day')
    let periodNumber = 1

    while (currentStart < finalEnd) {
      const currentEnd = currentStart.plus({ days: 13 }).endOf('day')

      fortnights.push({
        start: currentStart.toJSDate(),
        end: currentEnd.toJSDate(),
        period: periodNumber
      })

      currentStart = currentEnd.plus({ days: 1 }).startOf('day')
      periodNumber++
    }

    return fortnights
  }

  /**
   * Get current fortnight for a user based on their start date
   */
  public static getCurrentFortnight(userStartDate: Date): {
    start: Date
    end: Date
    period: number
  } {
    const now = DateTime.now()
    const start = DateTime.fromJSDate(userStartDate).startOf('day')

    // Calculate days since start
    const daysSinceStart = Math.floor(now.diff(start, 'days').days)

    // Calculate which fortnight we're in
    const fortnightNumber = Math.floor(daysSinceStart / 14)
    const fortnightStart = start.plus({ days: fortnightNumber * 14 })
    const fortnightEnd = fortnightStart.plus({ days: 13 }).endOf('day')

    return {
      start: fortnightStart.toJSDate(),
      end: fortnightEnd.toJSDate(),
      period: fortnightNumber + 1
    }
  }

  /**
   * Calculate total hours for a fortnight period
   */
  public static calculateFortnightHours(
    hours: Array<{ date: Date; hours: number; approved: boolean }>,
    fortnightStart: Date,
    fortnightEnd: Date
  ): {
    totalHours: number
    approvedHours: number
    pendingHours: number
    activities: number
  } {
    const start = DateTime.fromJSDate(fortnightStart).startOf('day')
    const end = DateTime.fromJSDate(fortnightEnd).endOf('day')

    const relevantHours = hours.filter((h) => {
      const date = DateTime.fromJSDate(h.date)
      return date >= start && date <= end
    })

    return {
      totalHours: relevantHours.reduce((sum, h) => sum + h.hours, 0),
      approvedHours: relevantHours.filter((h) => h.approved).reduce((sum, h) => sum + h.hours, 0),
      pendingHours: relevantHours.filter((h) => !h.approved).reduce((sum, h) => sum + h.hours, 0),
      activities: relevantHours.length
    }
  }

  /**
   * Generate SU462 form data for Centrelink reporting
   */
  public static generateSU462Data(data: {
    organization: {
      name: string
      abn: string
      address: string
      phone: string
      supervisorName: string
      supervisorEmail: string
      supervisorPhone: string
    }
    volunteer: {
      firstName: string
      lastName: string
      dateOfBirth?: Date
      customerReferenceNumber?: string
    }
    fortnight: {
      start: Date
      end: Date
      period: number
    }
    hours: number
    activities: Array<{
      date: Date
      description: string
      hours: number
    }>
  }): Record<string, any> {
    const startDate = DateTime.fromJSDate(data.fortnight.start)
    const endDate = DateTime.fromJSDate(data.fortnight.end)

    return {
      // Part A: Organisation Details
      organisationName: data.organization.name,
      abn: data.organization.abn,
      organisationAddress: data.organization.address,
      organisationPhone: data.organization.phone,
      supervisorName: data.organization.supervisorName,
      supervisorEmail: data.organization.supervisorEmail,
      supervisorPhone: data.organization.supervisorPhone,

      // Part B: Volunteer Details
      volunteerFirstName: data.volunteer.firstName,
      volunteerLastName: data.volunteer.lastName,
      volunteerDOB: data.volunteer.dateOfBirth
        ? DateTime.fromJSDate(data.volunteer.dateOfBirth).toFormat('dd/MM/yyyy')
        : null,
      customerReferenceNumber: data.volunteer.customerReferenceNumber || null,

      // Part C: Activity Period
      periodStart: startDate.toFormat('dd/MM/yyyy'),
      periodEnd: endDate.toFormat('dd/MM/yyyy'),
      fortnightNumber: data.fortnight.period,

      // Part D: Hours Summary
      totalHours: data.hours,
      activitiesCount: data.activities.length,

      // Part E: Activity Details
      activities: data.activities.map((activity) => ({
        date: DateTime.fromJSDate(activity.date).toFormat('dd/MM/yyyy'),
        description: activity.description,
        hours: activity.hours
      })),

      // Part F: Declaration
      declarationText:
        'I declare that the information provided is true and correct. Paid positions are not being replaced by the use of volunteers.',
      declarationDate: DateTime.now().toFormat('dd/MM/yyyy'),

      // Metadata
      generatedAt: new Date().toISOString(),
      formVersion: 'SU462 - Approved Activity'
    }
  }

  /**
   * Generate CSV export for SU462
   */
  public static generateSU462CSV(su462Data: Record<string, any>): string {
    const lines: string[] = []

    // Header
    lines.push('Centrelink Form SU462 - Approved Activity')
    lines.push('')

    // Organisation Details
    lines.push('PART A: ORGANISATION DETAILS')
    lines.push(`Organisation Name,${su462Data.organisationName}`)
    lines.push(`ABN,${su462Data.abn}`)
    lines.push(`Address,${su462Data.organisationAddress}`)
    lines.push(`Phone,${su462Data.organisationPhone}`)
    lines.push(`Supervisor Name,${su462Data.supervisorName}`)
    lines.push(`Supervisor Email,${su462Data.supervisorEmail}`)
    lines.push(`Supervisor Phone,${su462Data.supervisorPhone}`)
    lines.push('')

    // Volunteer Details
    lines.push('PART B: VOLUNTEER DETAILS')
    lines.push(`Name,${su462Data.volunteerFirstName} ${su462Data.volunteerLastName}`)
    if (su462Data.volunteerDOB) {
      lines.push(`Date of Birth,${su462Data.volunteerDOB}`)
    }
    if (su462Data.customerReferenceNumber) {
      lines.push(`CRN,${su462Data.customerReferenceNumber}`)
    }
    lines.push('')

    // Activity Period
    lines.push('PART C: REPORTING PERIOD')
    lines.push(`Period,${su462Data.periodStart} to ${su462Data.periodEnd}`)
    lines.push(`Fortnight Number,${su462Data.fortnightNumber}`)
    lines.push('')

    // Hours Summary
    lines.push('PART D: HOURS SUMMARY')
    lines.push(`Total Hours,${su462Data.totalHours}`)
    lines.push(`Number of Activities,${su462Data.activitiesCount}`)
    lines.push('')

    // Activity Details
    lines.push('PART E: ACTIVITY DETAILS')
    lines.push('Date,Description,Hours')
    su462Data.activities.forEach((activity: any) => {
      lines.push(`${activity.date},"${activity.description}",${activity.hours}`)
    })
    lines.push('')

    // Declaration
    lines.push('PART F: DECLARATION')
    lines.push(`"${su462Data.declarationText}"`)
    lines.push(`Declaration Date,${su462Data.declarationDate}`)
    lines.push('')

    lines.push(`Generated,${su462Data.generatedAt}`)

    return lines.join('\n')
  }

  /**
   * Validate fortnight hours meet minimum requirements
   * Centrelink typically requires evidence of job search/volunteer hours
   */
  public static validateFortnightCompliance(
    hours: number,
    requiredMinimum: number = 0
  ): {
    compliant: boolean
    message: string
  } {
    if (hours >= requiredMinimum) {
      return {
        compliant: true,
        message: `Meets requirement (${hours} hours recorded)`
      }
    }

    return {
      compliant: false,
      message: `Below requirement (${hours} of ${requiredMinimum} hours required)`
    }
  }

  /**
   * Format fortnight period for display
   */
  public static formatFortnightPeriod(start: Date, end: Date, period: number): string {
    const startStr = DateTime.fromJSDate(start).toFormat('dd LLL')
    const endStr = DateTime.fromJSDate(end).toFormat('dd LLL yyyy')
    return `Fortnight ${period}: ${startStr} - ${endStr}`
  }

  /**
   * Check if date falls within a fortnight period
   */
  public static isDateInFortnight(date: Date, fortnightStart: Date, fortnightEnd: Date): boolean {
    const dateTime = DateTime.fromJSDate(date)
    const start = DateTime.fromJSDate(fortnightStart).startOf('day')
    const end = DateTime.fromJSDate(fortnightEnd).endOf('day')

    return dateTime >= start && dateTime <= end
  }
}
