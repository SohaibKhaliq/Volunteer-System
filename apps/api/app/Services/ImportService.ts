import fs from 'fs'
import { parse } from 'csv-parse/sync'
import * as XLSX from 'xlsx'
import DataOperation from 'App/Models/DataOperation'
import User from 'App/Models/User'
import OrganizationVolunteer from 'App/Models/OrganizationVolunteer'
import Opportunity from 'App/Models/Opportunity'
import VolunteerHour from 'App/Models/VolunteerHour'
import DataValidationService, { BatchValidationResult } from './DataValidationService'
import Logger from '@ioc:Adonis/Core/Logger'
import crypto from 'crypto'
import { DateTime } from 'luxon'

interface ImportResult {
  success: boolean
  imported: number
  skipped: number
  failed: number
  errors: string[]
}

export default class ImportService {
  /**
   * Parse CSV or Excel file
   */
  public static async parseFile(
    filePath: string,
    format: 'csv' | 'xlsx'
  ): Promise<Record<string, any>[]> {
    if (format === 'csv') {
      return this.parseCSV(filePath)
    } else {
      return this.parseExcel(filePath)
    }
  }

  /**
   * Parse CSV file
   */
  private static parseCSV(filePath: string): Record<string, any>[] {
    const fileContent = fs.readFileSync(filePath, 'utf-8')

    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    }) as Record<string, string>[]

    // Normalize column names (lowercase and replace spaces with underscores)
    return records.map((record) => {
      const normalized: Record<string, string> = {}
      for (const [key, value] of Object.entries(record)) {
        const normalizedKey = key.toLowerCase().replace(/\s+/g, '_')
        normalized[normalizedKey] = value
      }
      return normalized
    })
  }

  /**
   * Parse Excel file
   */
  private static parseExcel(filePath: string): Record<string, any>[] {
    const workbook = XLSX.readFile(filePath)
    const sheetName = workbook.SheetNames[0] // Use first sheet
    const worksheet = workbook.Sheets[sheetName]

    // Convert to JSON with header row
    const records = XLSX.utils.sheet_to_json(worksheet, { defval: '' })

    // Normalize column names
    return records.map((record: any) => {
      const normalized: Record<string, any> = {}
      for (const [key, value] of Object.entries(record)) {
        const normalizedKey = String(key).toLowerCase().replace(/\s+/g, '_')
        normalized[normalizedKey] = value
      }
      return normalized
    })
  }

  /**
   * Validate records before import
   */
  public static async validateRecords(
    entityType: string,
    records: any[]
  ): Promise<BatchValidationResult> {
    return DataValidationService.validateBatch(entityType, records)
  }

  /**
   * Process import operation in background
   */
  public static async processImport(operationId: number): Promise<void> {
    const operation = await DataOperation.find(operationId)

    if (!operation) {
      Logger.error(`Import operation ${operationId} not found`)
      return
    }

    try {
      // Update status to processing
      operation.status = 'processing'
      operation.startedAt = DateTime.now()
      await operation.save()

      // Parse file
      const records = await this.parseFile(operation.filePath!, operation.format)

      // Validate
      const validation = await this.validateRecords(operation.entityType, records)

      if (!validation.valid) {
        // Store validation errors
        validation.errors.forEach((error) => {
          operation.addError(`Row ${error.row}, ${error.field}: ${error.message}`)
        })
        await operation.save()
      }

      // Process records based on entity type
      let result: ImportResult

      switch (operation.entityType) {
        case 'volunteers':
          result = await this.importVolunteers(operation.organizationId!, records, operation)
          break
        case 'opportunities':
          result = await this.importOpportunities(operation.organizationId!, records, operation)
          break
        case 'hours':
          result = await this.importHours(operation.organizationId!, records, operation)
          break
        default:
          throw new Error(`Unknown entity type: ${operation.entityType}`)
      }

      // Update operation with results
      operation.totalRecords = records.length
      operation.processedRecords = result.imported + result.skipped
      operation.failedRecords = result.failed
      operation.markCompleted()

      // Cleanup file
      if (fs.existsSync(operation.filePath!)) {
        fs.unlinkSync(operation.filePath!)
      }

      await operation.save()
    } catch (error) {
      Logger.error('Import processing error: %o', error)
      operation.markFailed(error.message)
      await operation.save()

      // Cleanup file on error
      if (operation.filePath && fs.existsSync(operation.filePath)) {
        fs.unlinkSync(operation.filePath)
      }
    }
  }

  /**
   * Import volunteers
   */
  public static async importVolunteers(
    organizationId: number,
    records: any[],
    operation?: DataOperation
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: true,
      imported: 0,
      skipped: 0,
      failed: 0,
      errors: []
    }

    for (let i = 0; i < records.length; i++) {
      const record = records[i]

      try {
        const email = record.email

        if (!email || !email.includes('@')) {
          result.errors.push(`Row ${i + 2}: Invalid email`)
          result.failed++
          continue
        }

        // Check if user exists
        let volunteerUser = await User.findBy('email', email)

        if (!volunteerUser) {
          // Create new user
          volunteerUser = await User.create({
            email,
            firstName: record.first_name || undefined,
            lastName: record.last_name || undefined,
            password: crypto.randomBytes(16).toString('hex')
          })
        }

        // Check if already a volunteer
        const existing = await OrganizationVolunteer.query()
          .where('organization_id', organizationId)
          .where('user_id', volunteerUser.id)
          .first()

        if (existing) {
          result.skipped++
          continue
        }

        // Add as volunteer
        await OrganizationVolunteer.create({
          organizationId,
          userId: volunteerUser.id,
          role: record.role || 'Volunteer',
          status: record.status || 'active',
          hours: 0,
          rating: 0
        })

        result.imported++

        // Update progress
        if (operation) {
          operation.updateProgress(i + 1, records.length)
          await operation.save()
        }
      } catch (err) {
        result.errors.push(`Row ${i + 2}: ${String(err)}`)
        result.failed++
      }
    }

    return result
  }

  /**
   * Import opportunities
   */
  public static async importOpportunities(
    organizationId: number,
    records: any[],
    operation?: DataOperation
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: true,
      imported: 0,
      skipped: 0,
      failed: 0,
      errors: []
    }

    for (let i = 0; i < records.length; i++) {
      const record = records[i]

      try {
        const title = record.title
        const startAtStr = record.start_at

        if (!title) {
          result.errors.push(`Row ${i + 2}: Title is required`)
          result.failed++
          continue
        }

        const startAt = DateTime.fromISO(startAtStr)
        if (!startAt.isValid) {
          result.errors.push(`Row ${i + 2}: Invalid start_at date format`)
          result.failed++
          continue
        }

        await Opportunity.create({
          organizationId,
          title,
          slug: Opportunity.generateSlug(title),
          description: record.description || undefined,
          location: record.location || undefined,
          capacity: record.capacity ? parseInt(record.capacity, 10) || 0 : 0,
          type: record.type || 'event',
          startAt,
          endAt: record.end_at ? DateTime.fromISO(record.end_at) : undefined,
          status: record.status || 'draft',
          visibility: record.visibility || 'public',
          checkinCode: Opportunity.generateCheckinCode()
        })

        result.imported++

        // Update progress
        if (operation) {
          operation.updateProgress(i + 1, records.length)
          await operation.save()
        }
      } catch (err) {
        result.errors.push(`Row ${i + 2}: ${String(err)}`)
        result.failed++
      }
    }

    return result
  }

  /**
   * Import volunteer hours
   */
  public static async importHours(
    organizationId: number,
    records: any[],
    operation?: DataOperation
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: true,
      imported: 0,
      skipped: 0,
      failed: 0,
      errors: []
    }

    for (let i = 0; i < records.length; i++) {
      const record = records[i]

      try {
        const email = record.email
        const hours = parseFloat(record.hours)
        const date = DateTime.fromISO(record.date)

        if (!email) {
          result.errors.push(`Row ${i + 2}: Email is required`)
          result.failed++
          continue
        }

        if (isNaN(hours) || hours <= 0) {
          result.errors.push(`Row ${i + 2}: Invalid hours value`)
          result.failed++
          continue
        }

        if (!date.isValid) {
          result.errors.push(`Row ${i + 2}: Invalid date format`)
          result.failed++
          continue
        }

        // Find user by email
        const user = await User.findBy('email', email)

        if (!user) {
          result.errors.push(`Row ${i + 2}: User not found with email ${email}`)
          result.failed++
          continue
        }

        // Create volunteer hour entry
        await VolunteerHour.create({
          userId: user.id,
          organizationId,
          hours,
          date: date.toSQLDate()!,
          description: record.description || undefined,
          status: record.status || 'Pending'
        })

        result.imported++

        // Update progress
        if (operation) {
          operation.updateProgress(i + 1, records.length)
          await operation.save()
        }
      } catch (err) {
        result.errors.push(`Row ${i + 2}: ${String(err)}`)
        result.failed++
      }
    }

    return result
  }
}

export { ImportResult }
