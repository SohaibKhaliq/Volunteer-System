import fs from 'fs'
import * as XLSX from 'xlsx'
import DataOperation from 'App/Models/DataOperation'
import Database from '@ioc:Adonis/Lucid/Database'
import Logger from '@ioc:Adonis/Core/Logger'
import Application from '@ioc:Adonis/Core/Application'
import { DateTime } from 'luxon'

interface ExportResult {
  success: boolean
  filePath: string
  recordCount: number
}

export default class ExportService {
  /**
   * Generate CSV export
   */
  public static generateCSV(headers: string[], rows: any[][]): string {
    const csvRows = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => this.escapeCsv(String(cell))).join(','))
    ]
    return csvRows.join('\n')
  }

  /**
   * Generate Excel export
   */
  public static generateExcel(headers: string[], rows: any[][]): Buffer {
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows])
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Export')

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
  }

  /**
   * Process export operation in background
   */
  public static async processExport(operationId: number): Promise<void> {
    const operation = await DataOperation.find(operationId)

    if (!operation) {
      Logger.error(`Export operation ${operationId} not found`)
      return
    }

    try {
      // Update status to processing
      operation.status = 'processing'
      operation.startedAt = DateTime.now()
      await operation.save()

      // Get filters
      const filters = operation.getFilters() || {}

      // Fetch data based on entity type
      let result: ExportResult

      switch (operation.entityType) {
        case 'volunteers':
          result = await this.exportVolunteers(operation.organizationId, filters, operation.format)
          break
        case 'opportunities':
          result = await this.exportOpportunities(
            operation.organizationId,
            filters,
            operation.format
          )
          break
        case 'hours':
          result = await this.exportHours(operation.organizationId, filters, operation.format)
          break
        case 'applications':
          result = await this.exportApplications(
            operation.organizationId,
            filters,
            operation.format
          )
          break
        case 'attendances':
          result = await this.exportAttendances(operation.organizationId, filters, operation.format)
          break
        default:
          throw new Error(`Unknown entity type: ${operation.entityType}`)
      }

      // Update operation with results
      operation.filePath = result.filePath
      operation.totalRecords = result.recordCount
      operation.processedRecords = result.recordCount
      operation.markCompleted()

      await operation.save()
    } catch (error) {
      Logger.error('Export processing error: %o', error)
      operation.markFailed(error.message)
      await operation.save()
    }
  }

  /**
   * Export volunteers
   */
  public static async exportVolunteers(
    organizationId: number | null,
    filters: any,
    format: 'csv' | 'xlsx'
  ): Promise<ExportResult> {
    let query = Database.from('organization_volunteers')
      .join('users', 'organization_volunteers.user_id', 'users.id')
      .select(
        'users.id',
        'users.email',
        'users.first_name',
        'users.last_name',
        'organization_volunteers.role',
        'organization_volunteers.status',
        'organization_volunteers.hours',
        'organization_volunteers.rating',
        'organization_volunteers.created_at as joined_at'
      )

    if (organizationId) {
      query = query.where('organization_volunteers.organization_id', organizationId)
    }

    if (filters.status) {
      query = query.where('organization_volunteers.status', filters.status)
    }

    if (filters.startDate) {
      query = query.where('organization_volunteers.created_at', '>=', filters.startDate)
    }

    if (filters.endDate) {
      query = query.where('organization_volunteers.created_at', '<=', filters.endDate)
    }

    const volunteers = await query.orderBy('organization_volunteers.created_at', 'desc')

    const headers = [
      'ID',
      'Email',
      'First Name',
      'Last Name',
      'Role',
      'Status',
      'Hours',
      'Rating',
      'Joined At'
    ]
    const rows = volunteers.map((v) => [
      v.id,
      v.email,
      v.first_name || '',
      v.last_name || '',
      v.role || '',
      v.status || '',
      v.hours || 0,
      v.rating || 0,
      v.joined_at ? new Date(v.joined_at).toISOString() : ''
    ])

    const fileName = `volunteers-export-${Date.now()}.${format}`
    const filePath = Application.tmpPath('exports', fileName)

    // Ensure exports directory exists
    const exportsDir = Application.tmpPath('exports')
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true })
    }

    if (format === 'csv') {
      const csv = this.generateCSV(headers, rows)
      fs.writeFileSync(filePath, csv)
    } else {
      const excel = this.generateExcel(headers, rows)
      fs.writeFileSync(filePath, excel)
    }

    return {
      success: true,
      filePath,
      recordCount: volunteers.length
    }
  }

  /**
   * Export opportunities
   */
  public static async exportOpportunities(
    organizationId: number | null,
    filters: any,
    format: 'csv' | 'xlsx'
  ): Promise<ExportResult> {
    let query = Database.from('opportunities').select(
      'id',
      'title',
      'description',
      'location',
      'type',
      'status',
      'visibility',
      'capacity',
      'start_at',
      'end_at',
      'created_at'
    )

    if (organizationId) {
      query = query.where('organization_id', organizationId)
    }

    if (filters.status) {
      query = query.where('status', filters.status)
    }

    if (filters.startDate) {
      query = query.where('start_at', '>=', filters.startDate)
    }

    if (filters.endDate) {
      query = query.where('start_at', '<=', filters.endDate)
    }

    const opportunities = await query.orderBy('start_at', 'desc')

    const headers = [
      'ID',
      'Title',
      'Description',
      'Location',
      'Type',
      'Status',
      'Visibility',
      'Capacity',
      'Start At',
      'End At'
    ]
    const rows = opportunities.map((o) => [
      o.id,
      o.title,
      o.description || '',
      o.location || '',
      o.type,
      o.status,
      o.visibility,
      o.capacity,
      o.start_at ? new Date(o.start_at).toISOString() : '',
      o.end_at ? new Date(o.end_at).toISOString() : ''
    ])

    const fileName = `opportunities-export-${Date.now()}.${format}`
    const filePath = Application.tmpPath('exports', fileName)

    const exportsDir = Application.tmpPath('exports')
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true })
    }

    if (format === 'csv') {
      const csv = this.generateCSV(headers, rows)
      fs.writeFileSync(filePath, csv)
    } else {
      const excel = this.generateExcel(headers, rows)
      fs.writeFileSync(filePath, excel)
    }

    return {
      success: true,
      filePath,
      recordCount: opportunities.length
    }
  }

  /**
   * Export volunteer hours
   */
  public static async exportHours(
    organizationId: number | null,
    filters: any,
    format: 'csv' | 'xlsx'
  ): Promise<ExportResult> {
    let query = Database.from('volunteer_hours')
      .join('users', 'volunteer_hours.user_id', 'users.id')
      .select(
        'volunteer_hours.id',
        'users.email',
        'users.first_name',
        'users.last_name',
        'volunteer_hours.hours',
        'volunteer_hours.date',
        'volunteer_hours.description',
        'volunteer_hours.status'
      )

    if (organizationId) {
      query = query.where('volunteer_hours.organization_id', organizationId)
    }

    if (filters.status) {
      query = query.where('volunteer_hours.status', filters.status)
    }

    if (filters.startDate) {
      query = query.where('volunteer_hours.date', '>=', filters.startDate)
    }

    if (filters.endDate) {
      query = query.where('volunteer_hours.date', '<=', filters.endDate)
    }

    const hours = await query.orderBy('volunteer_hours.date', 'desc')

    const headers = [
      'ID',
      'Email',
      'First Name',
      'Last Name',
      'Hours',
      'Date',
      'Description',
      'Status'
    ]
    const rows = hours.map((h) => [
      h.id,
      h.email,
      h.first_name || '',
      h.last_name || '',
      h.hours,
      h.date ? new Date(h.date).toISOString().split('T')[0] : '',
      h.description || '',
      h.status || ''
    ])

    const fileName = `hours-export-${Date.now()}.${format}`
    const filePath = Application.tmpPath('exports', fileName)

    const exportsDir = Application.tmpPath('exports')
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true })
    }

    if (format === 'csv') {
      const csv = this.generateCSV(headers, rows)
      fs.writeFileSync(filePath, csv)
    } else {
      const excel = this.generateExcel(headers, rows)
      fs.writeFileSync(filePath, excel)
    }

    return {
      success: true,
      filePath,
      recordCount: hours.length
    }
  }

  /**
   * Export applications
   */
  public static async exportApplications(
    organizationId: number | null,
    filters: any,
    format: 'csv' | 'xlsx'
  ): Promise<ExportResult> {
    let query = Database.from('applications')
      .join('opportunities', 'applications.opportunity_id', 'opportunities.id')
      .join('users', 'applications.user_id', 'users.id')
      .select(
        'applications.id',
        'opportunities.title as opportunity_title',
        'users.email',
        'users.first_name',
        'users.last_name',
        'applications.status',
        'applications.applied_at'
      )

    if (organizationId) {
      query = query.where('opportunities.organization_id', organizationId)
    }

    if (filters.status) {
      query = query.where('applications.status', filters.status)
    }

    const applications = await query.orderBy('applications.applied_at', 'desc')

    const headers = [
      'ID',
      'Opportunity',
      'Email',
      'First Name',
      'Last Name',
      'Status',
      'Applied At'
    ]
    const rows = applications.map((a) => [
      a.id,
      a.opportunity_title,
      a.email,
      a.first_name || '',
      a.last_name || '',
      a.status,
      a.applied_at ? new Date(a.applied_at).toISOString() : ''
    ])

    const fileName = `applications-export-${Date.now()}.${format}`
    const filePath = Application.tmpPath('exports', fileName)

    const exportsDir = Application.tmpPath('exports')
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true })
    }

    if (format === 'csv') {
      const csv = this.generateCSV(headers, rows)
      fs.writeFileSync(filePath, csv)
    } else {
      const excel = this.generateExcel(headers, rows)
      fs.writeFileSync(filePath, excel)
    }

    return {
      success: true,
      filePath,
      recordCount: applications.length
    }
  }

  /**
   * Export attendances
   */
  public static async exportAttendances(
    organizationId: number | null,
    filters: any,
    format: 'csv' | 'xlsx'
  ): Promise<ExportResult> {
    let query = Database.from('attendances')
      .join('opportunities', 'attendances.opportunity_id', 'opportunities.id')
      .join('users', 'attendances.user_id', 'users.id')
      .select(
        'attendances.id',
        'opportunities.title as opportunity_title',
        'users.email',
        'users.first_name',
        'users.last_name',
        'attendances.check_in_at',
        'attendances.check_out_at',
        'attendances.method'
      )

    if (organizationId) {
      query = query.where('opportunities.organization_id', organizationId)
    }

    const attendances = await query.orderBy('attendances.check_in_at', 'desc')

    const headers = [
      'ID',
      'Opportunity',
      'Email',
      'First Name',
      'Last Name',
      'Check-in At',
      'Check-out At',
      'Method',
      'Duration (hours)'
    ]
    const rows = attendances.map((a) => {
      const checkIn = a.check_in_at ? new Date(a.check_in_at) : null
      const checkOut = a.check_out_at ? new Date(a.check_out_at) : null
      const durationHours =
        checkIn && checkOut
          ? Math.round(((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60)) * 100) / 100
          : ''

      return [
        a.id,
        a.opportunity_title,
        a.email,
        a.first_name || '',
        a.last_name || '',
        checkIn?.toISOString() || '',
        checkOut?.toISOString() || '',
        a.method || '',
        durationHours
      ]
    })

    const fileName = `attendances-export-${Date.now()}.${format}`
    const filePath = Application.tmpPath('exports', fileName)

    const exportsDir = Application.tmpPath('exports')
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true })
    }

    if (format === 'csv') {
      const csv = this.generateCSV(headers, rows)
      fs.writeFileSync(filePath, csv)
    } else {
      const excel = this.generateExcel(headers, rows)
      fs.writeFileSync(filePath, excel)
    }

    return {
      success: true,
      filePath,
      recordCount: attendances.length
    }
  }

  /**
   * Escape CSV value
   */
  private static escapeCsv(value: string): string {
    if (!value) return ''
    // If contains comma, newline, or quote, wrap in quotes and escape existing quotes
    if (value.includes(',') || value.includes('\n') || value.includes('"')) {
      return `"${value.replace(/"/g, '""')}"`
    }
    return value
  }
}

export { ExportResult }
