import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Application from '@ioc:Adonis/Core/Application'
import User from 'App/Models/User'
import Opportunity from 'App/Models/Opportunity'
import OrganizationTeamMember from 'App/Models/OrganizationTeamMember'
import OrganizationVolunteer from 'App/Models/OrganizationVolunteer'
import { DateTime } from 'luxon'
import crypto from 'crypto'
import fs from 'fs'
import { parse } from 'csv-parse/sync'

export default class ImportController {
  /**
   * Import volunteers from CSV
   * Expected CSV format: email,first_name,last_name,role,status
   */
  public async importVolunteers({ request, response, auth }: HttpContextContract) {
    const user = auth.user!
    const memberRecord = await OrganizationTeamMember.query().where('user_id', user.id).first()

    if (!memberRecord) {
      return response.notFound({ message: 'User is not part of any organization' })
    }

    // Check if user has admin role
    const allowedRoles = ['admin', 'coordinator', 'Admin', 'Coordinator']
    if (!allowedRoles.includes(memberRecord.role || '')) {
      return response.forbidden({ message: 'You do not have permission to import data' })
    }

    const csvFile = request.file('file', {
      size: '5mb',
      extnames: ['csv']
    })

    if (!csvFile) {
      return response.badRequest({ message: 'CSV file is required' })
    }

    // Move file to temp directory
    const fileName = `import_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.csv`
    await csvFile.move(Application.tmpPath('uploads'), { name: fileName })

    const filePath = Application.tmpPath('uploads', fileName)

    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8')

      // Parse CSV with proper handling of quoted fields
      const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      }) as Record<string, string>[]

      if (records.length === 0) {
        return response.badRequest({
          message: 'CSV file must have a header and at least one data row'
        })
      }

      // Normalize column names (lowercase)
      const normalizedRecords = records.map((record) => {
        const normalized: Record<string, string> = {}
        for (const [key, value] of Object.entries(record)) {
          normalized[key.toLowerCase()] = value
        }
        return normalized
      })

      // Check for required column
      const firstRecord = normalizedRecords[0]
      if (!('email' in firstRecord)) {
        return response.badRequest({ message: 'CSV must have an "email" column' })
      }

      const results = {
        imported: 0,
        skipped: 0,
        errors: [] as string[]
      }

      for (let i = 0; i < normalizedRecords.length; i++) {
        const record = normalizedRecords[i]
        const email = record.email

        if (!email || !email.includes('@')) {
          results.errors.push(`Row ${i + 2}: Invalid email`)
          results.skipped++
          continue
        }

        try {
          // Check if user exists
          let volunteerUser = await User.findBy('email', email)

          if (!volunteerUser) {
            // Create new user with random password - they'll need to use password reset
            volunteerUser = await User.create({
              email,
              firstName: record.first_name || undefined,
              lastName: record.last_name || undefined,
              password: crypto.randomBytes(16).toString('hex')
            })
            // Note: In production, you should send a password reset email here
          }

          // Check if already a volunteer in this org
          const existing = await OrganizationVolunteer.query()
            .where('organization_id', memberRecord.organizationId)
            .where('user_id', volunteerUser.id)
            .first()

          if (existing) {
            results.skipped++
            continue
          }

          // Add as volunteer
          await OrganizationVolunteer.create({
            organizationId: memberRecord.organizationId,
            userId: volunteerUser.id,
            role: record.role || 'Volunteer',
            status: record.status || 'Active',
            hours: 0,
            rating: 0
          })

          results.imported++
        } catch (err) {
          results.errors.push(`Row ${i + 2}: ${String(err)}`)
          results.skipped++
        }
      }

      // Cleanup temp file
      fs.unlinkSync(filePath)

      return response.ok({
        message: `Import completed: ${results.imported} imported, ${results.skipped} skipped`,
        results
      })
    } catch (err) {
      // Cleanup temp file on error
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
      return response.internalServerError({ message: `Import failed: ${String(err)}` })
    }
  }

  /**
   * Import opportunities from CSV
   * Expected CSV format: title,description,location,capacity,type,start_at,end_at,status,visibility
   */
  public async importOpportunities({ request, response, auth }: HttpContextContract) {
    const user = auth.user!
    const memberRecord = await OrganizationTeamMember.query().where('user_id', user.id).first()

    if (!memberRecord) {
      return response.notFound({ message: 'User is not part of any organization' })
    }

    // Check if user has admin role
    const allowedRoles = ['admin', 'coordinator', 'Admin', 'Coordinator']
    if (!allowedRoles.includes(memberRecord.role || '')) {
      return response.forbidden({ message: 'You do not have permission to import data' })
    }

    const csvFile = request.file('file', {
      size: '5mb',
      extnames: ['csv']
    })

    if (!csvFile) {
      return response.badRequest({ message: 'CSV file is required' })
    }

    const fileName = `import_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.csv`
    await csvFile.move(Application.tmpPath('uploads'), { name: fileName })

    const filePath = Application.tmpPath('uploads', fileName)

    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8')

      // Parse CSV with proper handling of quoted fields
      const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      }) as Record<string, string>[]

      if (records.length === 0) {
        return response.badRequest({
          message: 'CSV file must have a header and at least one data row'
        })
      }

      // Normalize column names (lowercase)
      const normalizedRecords = records.map((record) => {
        const normalized: Record<string, string> = {}
        for (const [key, value] of Object.entries(record)) {
          normalized[key.toLowerCase()] = value
        }
        return normalized
      })

      // Check for required columns
      const firstRecord = normalizedRecords[0]
      if (!('title' in firstRecord) || !('start_at' in firstRecord)) {
        return response.badRequest({ message: 'CSV must have "title" and "start_at" columns' })
      }

      const results = {
        imported: 0,
        skipped: 0,
        errors: [] as string[]
      }

      for (let i = 0; i < normalizedRecords.length; i++) {
        const record = normalizedRecords[i]
        const title = record.title
        const startAtStr = record.start_at

        if (!title) {
          results.errors.push(`Row ${i + 2}: Title is required`)
          results.skipped++
          continue
        }

        try {
          const startAt = DateTime.fromISO(startAtStr)
          if (!startAt.isValid) {
            results.errors.push(`Row ${i + 2}: Invalid start_at date format (use ISO format)`)
            results.skipped++
            continue
          }

          await Opportunity.create({
            organizationId: memberRecord.organizationId,
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
            checkinCode: Opportunity.generateCheckinCode(),
            createdBy: user.id
          })

          results.imported++
        } catch (err) {
          results.errors.push(`Row ${i + 2}: ${String(err)}`)
          results.skipped++
        }
      }

      // Cleanup temp file
      fs.unlinkSync(filePath)

      return response.ok({
        message: `Import completed: ${results.imported} imported, ${results.skipped} skipped`,
        results
      })
    } catch (err) {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
      return response.internalServerError({ message: `Import failed: ${String(err)}` })
    }
  }

  /**
   * Download CSV template for volunteers
   */
  public async volunteersTemplate({ response }: HttpContextContract) {
    const csvContent =
      'email,first_name,last_name,role,status\njohn@example.com,John,Doe,Volunteer,Active'
    response.header('Content-Type', 'text/csv')
    response.header('Content-Disposition', 'attachment; filename=volunteers_template.csv')
    return response.send(csvContent)
  }

  /**
   * Download CSV template for opportunities
   */
  public async opportunitiesTemplate({ response }: HttpContextContract) {
    const csvContent =
      'title,description,location,capacity,type,start_at,end_at,status,visibility\nBeach Cleanup,Help clean the beach,Main Street Beach,20,event,2024-03-15T09:00:00,2024-03-15T12:00:00,draft,public'
    response.header('Content-Type', 'text/csv')
    response.header('Content-Disposition', 'attachment; filename=opportunities_template.csv')
    return response.send(csvContent)
  }
}
