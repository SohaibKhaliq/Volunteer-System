import Database from '@ioc:Adonis/Lucid/Database'
import { DateTime } from 'luxon'
import Application from '@ioc:Adonis/Core/Application'
import { promises as fs } from 'fs'
import * as path from 'path'

interface ReportData {
  headers: string[]
  rows: any[][]
  title?: string
  dateRange?: {
    from: string
    to: string
  }
}

interface ExportOptions {
  filename?: string
  includeTimestamp?: boolean
}

export default class ReportGenerationService {
  /**
   * Export data to CSV format
   */
  public static async exportToCSV(
    data: ReportData,
    options: ExportOptions = {}
  ): Promise<{ filePath: string; filename: string }> {
    const { filename = 'report', includeTimestamp = true } = options

    // Generate filename
    const timestamp = includeTimestamp ? `_${DateTime.now().toFormat('yyyyMMdd_HHmmss')}` : ''
    const csvFilename = `${filename}${timestamp}.csv`

    // Create exports directory if it doesn't exist
    const exportsDir = Application.tmpPath('exports')
    await fs.mkdir(exportsDir, { recursive: true })

    const filePath = path.join(exportsDir, csvFilename)

    // Build CSV content
    let csvContent = ''

    // Add title if provided
    if (data.title) {
      csvContent += `"${data.title}"\n\n`
    }

    // Add date range if provided
    if (data.dateRange) {
      csvContent += `"Date Range: ${data.dateRange.from} to ${data.dateRange.to}"\n\n`
    }

    // Add headers
    csvContent += data.headers.map((h) => `"${h}"`).join(',') + '\n'

    // Add rows
    for (const row of data.rows) {
      csvContent +=
        row
          .map((cell) => {
            if (cell === null || cell === undefined) {
              return '""'
            }
            // Escape quotes and wrap in quotes
            const cellStr = String(cell).replace(/"/g, '""')
            return `"${cellStr}"`
          })
          .join(',') + '\n'
    }

    // Write to file
    await fs.writeFile(filePath, csvContent, 'utf-8')

    return { filePath, filename: csvFilename }
  }

  /**
   * Generate volunteer hours report
   */
  public static async generateVolunteerHoursReport(
    organizationId: number,
    dateRange: { from: DateTime; to: DateTime }
  ): Promise<ReportData> {
    const results = await Database.from('volunteer_hours as vh')
      .join('users as u', 'vh.user_id', 'u.id')
      .leftJoin('events as e', 'vh.event_id', 'e.id')
      .where('vh.organization_id', organizationId)
      .where('vh.status', 'Approved')
      .whereBetween('vh.date', [dateRange.from.toSQLDate()!, dateRange.to.toSQLDate()!])
      .select(
        'u.first_name',
        'u.last_name',
        'u.email',
        'e.title as event_title',
        'vh.date',
        'vh.hours',
        'vh.status',
        'vh.notes'
      )
      .orderBy('vh.date', 'desc')

    const headers = ['Volunteer Name', 'Email', 'Event', 'Date', 'Hours', 'Status', 'Notes']

    const rows = results.map((row) => [
      `${row.first_name} ${row.last_name}`,
      row.email,
      row.event_title || 'N/A',
      row.date,
      row.hours,
      row.status,
      row.notes || ''
    ])

    return {
      title: 'Volunteer Hours Report',
      dateRange: {
        from: dateRange.from.toISODate()!,
        to: dateRange.to.toISODate()!
      },
      headers,
      rows
    }
  }

  /**
   * Generate volunteer summary report
   */
  public static async generateVolunteerSummaryReport(
    organizationId: number,
    dateRange: { from: DateTime; to: DateTime }
  ): Promise<ReportData> {
    const results = await Database.from('volunteer_hours as vh')
      .join('users as u', 'vh.user_id', 'u.id')
      .where('vh.organization_id', organizationId)
      .where('vh.status', 'Approved')
      .whereBetween('vh.date', [dateRange.from.toSQLDate()!, dateRange.to.toSQLDate()!])
      .select('u.id', 'u.first_name', 'u.last_name', 'u.email')
      .sum('vh.hours as total_hours')
      .count('* as total_entries')
      .groupBy('u.id', 'u.first_name', 'u.last_name', 'u.email')
      .orderBy('total_hours', 'desc')

    const headers = ['Volunteer Name', 'Email', 'Total Hours', 'Total Entries', 'Average Hours']

    const rows = results.map((row) => {
      const totalHours = Number(row.total_hours || 0)
      const totalEntries = Number(row.total_entries || 0)
      const avgHours = totalEntries > 0 ? totalHours / totalEntries : 0

      return [
        `${row.first_name} ${row.last_name}`,
        row.email,
        totalHours.toFixed(1),
        totalEntries,
        avgHours.toFixed(1)
      ]
    })

    return {
      title: 'Volunteer Summary Report',
      dateRange: {
        from: dateRange.from.toISODate()!,
        to: dateRange.to.toISODate()!
      },
      headers,
      rows
    }
  }

  /**
   * Generate event performance report
   */
  public static async generateEventPerformanceReport(
    organizationId: number,
    dateRange: { from: DateTime; to: DateTime }
  ): Promise<ReportData> {
    const events = await Database.from('opportunities as o')
      .where('o.organization_id', organizationId)
      .whereBetween('o.start_at', [dateRange.from.toSQL()!, dateRange.to.toSQL()!])
      .select('o.id', 'o.title', 'o.start_at', 'o.capacity')
      .orderBy('o.start_at', 'desc')

    const headers = [
      'Event Title',
      'Date',
      'Capacity',
      'Registered',
      'Attended',
      'Attendance Rate',
      'Total Hours'
    ]

    const rows: any[][] = []

    for (const event of events) {
      // Get registered count
      const registeredResult = await Database.from('applications')
        .where('opportunity_id', event.id)
        .where('status', 'accepted')
        .count('* as total')
      const registered = Number(registeredResult[0].total || 0)

      // Get attended count
      const attendedResult = await Database.from('attendances')
        .where('opportunity_id', event.id)
        .where('status', 'Present')
        .count('* as total')
      const attended = Number(attendedResult[0].total || 0)

      // Get total hours
      const hoursResult = await Database.from('volunteer_hours')
        .where('event_id', event.id)
        .where('status', 'Approved')
        .sum('hours as total')
      const totalHours = Number(hoursResult[0].total || 0)

      const attendanceRate = registered > 0 ? ((attended / registered) * 100).toFixed(1) : '0.0'

      rows.push([
        event.title,
        DateTime.fromJSDate(event.start_at).toISODate(),
        event.capacity || 0,
        registered,
        attended,
        `${attendanceRate}%`,
        totalHours.toFixed(1)
      ])
    }

    return {
      title: 'Event Performance Report',
      dateRange: {
        from: dateRange.from.toISODate()!,
        to: dateRange.to.toISODate()!
      },
      headers,
      rows
    }
  }

  /**
   * Generate compliance report
   */
  public static async generateComplianceReport(organizationId: number): Promise<ReportData> {
    // Get all volunteers
    const volunteers = await Database.from('organization_volunteers as ov')
      .join('users as u', 'ov.user_id', 'u.id')
      .where('ov.organization_id', organizationId)
      .where('ov.status', 'active')
      .select('u.id', 'u.first_name', 'u.last_name', 'u.email')

    // Get required document types
    const requirements = await Database.from('compliance_requirements')
      .where('organization_id', organizationId)
      .where('is_mandatory', true)
      .select('doc_type', 'name')

    const headers = ['Volunteer Name', 'Email', ...requirements.map((r) => r.name), 'Overall Status']

    const rows: any[][] = []

    for (const volunteer of volunteers) {
      const row: any[] = [`${volunteer.first_name} ${volunteer.last_name}`, volunteer.email]

      let compliantCount = 0

      for (const req of requirements) {
        const doc = await Database.from('compliance_documents')
          .where('user_id', volunteer.id)
          .where('doc_type', req.doc_type)
          .where('status', 'Valid')
          .where((query) => {
            query.whereNull('expires_at').orWhere('expires_at', '>', DateTime.now().toSQL()!)
          })
          .first()

        if (doc) {
          row.push('✓ Valid')
          compliantCount++
        } else {
          // Check if expired
          const expiredDoc = await Database.from('compliance_documents')
            .where('user_id', volunteer.id)
            .where('doc_type', req.doc_type)
            .where('expires_at', '<=', DateTime.now().toSQL()!)
            .first()

          if (expiredDoc) {
            row.push('✗ Expired')
          } else {
            row.push('✗ Missing')
          }
        }
      }

      const overallStatus =
        compliantCount === requirements.length
          ? 'Compliant'
          : `${compliantCount}/${requirements.length}`
      row.push(overallStatus)

      rows.push(row)
    }

    return {
      title: 'Compliance Status Report',
      headers,
      rows
    }
  }

  /**
   * Clean up old export files
   */
  public static async cleanupOldExports(olderThanDays: number = 7): Promise<number> {
    const exportsDir = Application.tmpPath('exports')

    try {
      const files = await fs.readdir(exportsDir)
      const cutoffDate = DateTime.now().minus({ days: olderThanDays })

      let deletedCount = 0

      for (const file of files) {
        const filePath = path.join(exportsDir, file)
        const stats = await fs.stat(filePath)

        if (DateTime.fromJSDate(stats.mtime) < cutoffDate) {
          await fs.unlink(filePath)
          deletedCount++
        }
      }

      return deletedCount
    } catch (error) {
      // Directory doesn't exist or other error
      return 0
    }
  }
}
