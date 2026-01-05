import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Application from '@ioc:Adonis/Core/Application'
import User from 'App/Models/User'
import Event from 'App/Models/Event'
import Shift from 'App/Models/Shift'
import OrganizationTeamMember from 'App/Models/OrganizationTeamMember'
import { DateTime } from 'luxon'
import crypto from 'crypto'
import fs from 'fs'
import { parse } from 'csv-parse/sync'
import Database from '@ioc:Adonis/Lucid/Database'

type ImportConfig = {
  headers: string[]
  process: (row: Record<string, string>, ctx: { user: User; orgId: number }) => Promise<void>
}

export default class ImportsController {
  private configs: Record<string, ImportConfig> = {
    users: {
      headers: ['email', 'first_name', 'last_name', 'role'],
      process: async (row, { orgId }) => {
        const email = row.email
        if (!email || !email.includes('@')) throw new Error('Invalid email')

        let user = await User.findBy('email', email)
        if (!user) {
          user = await User.create({
            email,
            firstName: row.first_name,
            lastName: row.last_name,
            password: crypto.randomBytes(16).toString('hex')
          })
        }

        // Add to org if not already
        const member = await OrganizationTeamMember.query()
          .where('organization_id', orgId)
          .where('user_id', user.id)
          .first()
        
        if (!member) {
          await OrganizationTeamMember.create({
            organizationId: orgId,
            userId: user.id,
            role: (row.role || 'Volunteer').toLowerCase()
          })
        }
      }
    },
    events: {
      headers: ['title', 'description', 'start_at', 'end_at', 'location'],
      process: async (row, { orgId, user }) => {
        if (!row.title) throw new Error('Title is required')
        if (!row.start_at) throw new Error('Start date is required')

        await Event.create({
          organizationId: orgId,
          title: row.title,
          description: row.description,
          startAt: DateTime.fromISO(row.start_at),
          endAt: row.end_at ? DateTime.fromISO(row.end_at) : undefined,
          location: row.location,
          createdBy: user.id
        })
      }
    },
    shifts: {
      headers: ['title', 'start_at', 'end_at', 'capacity', 'event_id'],
      process: async (row, { orgId }) => {
        if (!row.title) throw new Error('Title is required')
        if (!row.start_at) throw new Error('Start date is required')
        
        // Optional: Link to event if event_id provided (would need valid ID)
        let eventId: number | undefined = undefined
        if (row.event_id) {
            const event = await Event.find(row.event_id)
            if (event && event.organizationId === orgId) {
                eventId = event.id
            }
        }

        await Shift.create({
          organizationId: orgId,
          title: row.title,
          startAt: DateTime.fromISO(row.start_at),
          endAt: row.end_at ? DateTime.fromISO(row.end_at) : undefined,
          capacity: row.capacity ? parseInt(row.capacity) : 0,
          eventId
        })
      }
    }
  }

  public async getTemplate({ request, response }: HttpContextContract) {
    const type = request.input('type')
    const config = this.configs[type]

    if (!config) {
      return response.badRequest({ message: 'Invalid import type' })
    }

    const csvContent = config.headers.join(',') + '\n'
    response.header('Content-Type', 'text/csv')
    response.header('Content-Disposition', `attachment; filename=${type}_template.csv`)
    return response.send(csvContent)
  }

  public async processImport({ request, response, auth }: HttpContextContract) {
    const user = auth.user!
    const memberRecord = await OrganizationTeamMember.query().where('user_id', user.id).first()
    
    if (!memberRecord) {
      return response.notFound({ message: 'User is not part of any organization' })
    }

    const type = request.input('type')
    const config = this.configs[type]

    if (!config) {
      return response.badRequest({ message: 'Invalid import type' })
    }

    const csvFile = request.file('file', {
      size: '5mb',
      extnames: ['csv']
    })

    if (!csvFile) {
      return response.badRequest({ message: 'CSV file is required' })
    }

    const fileName = `import_${type}_${Date.now()}.csv`
    await csvFile.move(Application.tmpPath('uploads'), { name: fileName })
    const filePath = Application.tmpPath('uploads', fileName)

    const results = {
        imported: 0,
        skipped: 0,
        errors: [] as string[]
    }

    const trx = await Database.transaction()

    try {
        const fileContent = fs.readFileSync(filePath, 'utf-8')
        const records = parse(fileContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true
        }) as Record<string, string>[]

        if (records.length === 0) {
            throw new Error('File is empty')
        }

        // Validate Headers
        const firstRecord = records[0]
        const keys = Object.keys(firstRecord).map(k => k.toLowerCase())
        const missingHeaders = config.headers.filter(h => !keys.includes(h))

        if (missingHeaders.length > 0) {
            throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`)
        }

        // Process Rows
        for (let i = 0; i < records.length; i++) {
            try {
                // Normalize keys
                const row: Record<string, string> = {}
                Object.entries(records[i]).forEach(([k, v]) => row[k.toLowerCase()] = v)

                await config.process(row, { user, orgId: memberRecord.organizationId })
                results.imported++
            } catch (err) {
                results.skipped++
                results.errors.push(`Row ${i + 2}: ${err.message}`)
            }
        }

        await trx.commit()
    } catch (err) {
        await trx.rollback()
        // If it's a structural error (headers), fail the whole request
        return response.badRequest({ message: err.message })
    } finally {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    }

    return response.ok({
        message: `Import processed. ${results.imported} imported, ${results.skipped} failed.`,
        results
    })
  }
}
