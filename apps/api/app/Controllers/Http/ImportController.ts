import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Application from '@ioc:Adonis/Core/Application'
import User from 'App/Models/User'
import Opportunity from 'App/Models/Opportunity'
import OrganizationTeamMember from 'App/Models/OrganizationTeamMember'
import OrganizationVolunteer from 'App/Models/OrganizationVolunteer'
import { DateTime } from 'luxon'
import crypto from 'crypto'
import fs from 'fs'

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
      const lines = fileContent.split('\n').filter((line) => line.trim())

      if (lines.length < 2) {
        return response.badRequest({
          message: 'CSV file must have a header and at least one data row'
        })
      }

      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())
      const emailIndex = headers.indexOf('email')
      const firstNameIndex = headers.indexOf('first_name')
      const lastNameIndex = headers.indexOf('last_name')
      const roleIndex = headers.indexOf('role')
      const statusIndex = headers.indexOf('status')

      if (emailIndex === -1) {
        return response.badRequest({ message: 'CSV must have an "email" column' })
      }

      const results = {
        imported: 0,
        skipped: 0,
        errors: [] as string[]
      }

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map((v) => v.trim())
        const email = values[emailIndex]

        if (!email || !email.includes('@')) {
          results.errors.push(`Row ${i + 1}: Invalid email`)
          results.skipped++
          continue
        }

        try {
          // Check if user exists
          let volunteerUser = await User.findBy('email', email)

          if (!volunteerUser) {
            // Create new user
            volunteerUser = await User.create({
              email,
              firstName: firstNameIndex !== -1 ? values[firstNameIndex] : undefined,
              lastName: lastNameIndex !== -1 ? values[lastNameIndex] : undefined,
              password: crypto.randomBytes(16).toString('hex') // Random password, user will need to reset
            })
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
            role: roleIndex !== -1 && values[roleIndex] ? values[roleIndex] : 'Volunteer',
            status: statusIndex !== -1 && values[statusIndex] ? values[statusIndex] : 'Active',
            hours: 0,
            rating: 0
          })

          results.imported++
        } catch (err) {
          results.errors.push(`Row ${i + 1}: ${String(err)}`)
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
      const lines = fileContent.split('\n').filter((line) => line.trim())

      if (lines.length < 2) {
        return response.badRequest({
          message: 'CSV file must have a header and at least one data row'
        })
      }

      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())
      const titleIndex = headers.indexOf('title')
      const descriptionIndex = headers.indexOf('description')
      const locationIndex = headers.indexOf('location')
      const capacityIndex = headers.indexOf('capacity')
      const typeIndex = headers.indexOf('type')
      const startAtIndex = headers.indexOf('start_at')
      const endAtIndex = headers.indexOf('end_at')
      const statusIndex = headers.indexOf('status')
      const visibilityIndex = headers.indexOf('visibility')

      if (titleIndex === -1 || startAtIndex === -1) {
        return response.badRequest({ message: 'CSV must have "title" and "start_at" columns' })
      }

      const results = {
        imported: 0,
        skipped: 0,
        errors: [] as string[]
      }

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map((v) => v.trim())
        const title = values[titleIndex]
        const startAtStr = values[startAtIndex]

        if (!title) {
          results.errors.push(`Row ${i + 1}: Title is required`)
          results.skipped++
          continue
        }

        try {
          const startAt = DateTime.fromISO(startAtStr)
          if (!startAt.isValid) {
            results.errors.push(`Row ${i + 1}: Invalid start_at date format`)
            results.skipped++
            continue
          }

          await Opportunity.create({
            organizationId: memberRecord.organizationId,
            title,
            slug: Opportunity.generateSlug(title),
            description: descriptionIndex !== -1 ? values[descriptionIndex] : undefined,
            location: locationIndex !== -1 ? values[locationIndex] : undefined,
            capacity: capacityIndex !== -1 ? parseInt(values[capacityIndex], 10) || 0 : 0,
            type: typeIndex !== -1 && values[typeIndex] ? values[typeIndex] : 'event',
            startAt,
            endAt:
              endAtIndex !== -1 && values[endAtIndex]
                ? DateTime.fromISO(values[endAtIndex])
                : undefined,
            status: statusIndex !== -1 && values[statusIndex] ? values[statusIndex] : 'draft',
            visibility:
              visibilityIndex !== -1 && values[visibilityIndex]
                ? values[visibilityIndex]
                : 'public',
            checkinCode: Opportunity.generateCheckinCode(),
            createdBy: user.id
          })

          results.imported++
        } catch (err) {
          results.errors.push(`Row ${i + 1}: ${String(err)}`)
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
