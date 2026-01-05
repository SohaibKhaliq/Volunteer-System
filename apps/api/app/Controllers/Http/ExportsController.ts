import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import OrganizationTeamMember from 'App/Models/OrganizationTeamMember'
import Event from 'App/Models/Event'
import Shift from 'App/Models/Shift'
import Opportunity from 'App/Models/Opportunity'
import Organization from 'App/Models/Organization'
import { DateTime } from 'luxon'

export default class ExportsController {
  
  public async download({ request, response, auth }: HttpContextContract) {
    const user = auth.user!
    const memberRecord = await OrganizationTeamMember.query().where('user_id', user.id).first()
    
    // ALLOW ADMIN OVERRIDE: Check if user is global admin
    const isGlobalAdmin = user.isAdmin || (user as any).is_admin
    
    // Basic admin/coordinator check permissions
    const allowedRoles = ['admin', 'coordinator', 'Admin', 'Coordinator']
    const hasOrgRole = memberRecord && allowedRoles.includes(memberRecord.role || '')

    if (!isGlobalAdmin && !hasOrgRole) {
      return response.forbidden({ message: 'You do not have permission to export data' })
    }

    const { type, format = 'csv', startDate, endDate } = request.qs()
    // For global admins without an org, we use -1 (or handle specifically in queries)
    const orgId = memberRecord?.organizationId ?? (isGlobalAdmin ? -1 : 0)

    let data: any[] = []
    // ENFORCE EXTENSION: Ensure filename has the correct extension
    const baseFilename = `${type}-${DateTime.now().toFormat('yyyy-MM-dd')}`
    const filename = `${baseFilename}.${format}`

    // Fetch Data based on Type
    switch (type) {
      case 'users':
        data = await this.getUsers(orgId, startDate, endDate)
        break
      case 'events':
        data = await this.getEvents(orgId, startDate, endDate)
        break
      case 'shifts':
        data = await this.getShifts(orgId, startDate, endDate)
        break
      case 'opportunities':
        data = await this.getOpportunities(orgId, startDate, endDate)
        break
      case 'organizations': 
         if (isGlobalAdmin && orgId === -1) {
           // Export ALL organizations for global admin
           const allOrgs = await Organization.all()
           data = allOrgs.map(o => o.toJSON())
         } else {
           // Export current org info
           const org = await Organization.find(orgId)
           data = org ? [org.toJSON()] : []
         }
         break
      default:
        return response.badRequest({ message: 'Invalid export type' })
    }

    // Force the Content-Disposition header even if data is empty, so client gets a file with right name
    response.header('Content-Type', format === 'json' ? 'application/json' : format === 'pdf' ? 'application/pdf' : 'text/csv')
    response.header('Content-Disposition', `attachment; filename="${filename}"`)

    if (format === 'json') {
      return response.send(data)
    } else if (format === 'pdf') {
      const pdfBuffer = await this.getPDF(data, type)
      return response.send(pdfBuffer)
    } else {
      // CSV Export
      const csv = this.convertToCSV(data)
      return response.send(csv)
    }
  }

  private async getPDF(data: any[], type: string): Promise<Buffer> {
     const Application = (await import('@ioc:Adonis/Core/Application')).default
     // Use require to avoid TS issues with library import if types are tricky vs runtime
     const PdfPrinter = require('pdfmake')

     const fonts = {
       Roboto: {
         normal: Application.makePath('node_modules/pdfmake/fonts/Roboto-Regular.ttf'),
         bold: Application.makePath('node_modules/pdfmake/fonts/Roboto-Medium.ttf'),
         italics: Application.makePath('node_modules/pdfmake/fonts/Roboto-Italic.ttf'),
         bolditalics: Application.makePath('node_modules/pdfmake/fonts/Roboto-MediumItalic.ttf')
       }
     }

     const printer = new PdfPrinter(fonts)

     // Transform data to table body
     let content: any[] = []
     
     content.push({ text: `${type.toUpperCase()} Report`, style: 'header' })
     content.push({ text: `Generated on: ${DateTime.now().toLocaleString(DateTime.DATETIME_MED)}`, style: 'subheader' })

     if (data.length > 0) {
        const headers = Object.keys(data[0])
        const body = [
          headers.map(h => ({ text: h, style: 'tableHeader' })),
          ...data.map(row => headers.map(h => {
             const val = row[h]
             return val === null || val === undefined ? '' : String(val)
          }))
        ]

        content.push({
          style: 'tableExample',
          table: {
            headerRows: 1,
            // Dynamically calculate widths? Star or auto.
            // For many columns, auto might break layout. Let's try star/auto mix or just star.
            widths: Array(headers.length).fill('auto'), 
            body: body
          },
          layout: 'lightHorizontalLines'
        })
     } else {
       content.push({ text: 'No data found.' })
     }

     const docDefinition = {
       content: content,
       styles: {
         header: {
           fontSize: 18,
           bold: true,
           margin: [0, 0, 0, 10]
         },
         subheader: {
           fontSize: 12,
           bold: false,
           margin: [0, 0, 0, 20]
         },
         tableHeader: {
           bold: true,
           fontSize: 10,
           color: 'black'
         },
         tableExample: {
           margin: [0, 5, 0, 15],
           fontSize: 8
         }
       },
       defaultStyle: {
         // font: 'Roboto' // Default
       },
       // pageOrientation: headers.length > 5 ? 'landscape' : 'portrait'
       pageOrientation: 'landscape' // Safest for wide tables
     }

     return new Promise((resolve, reject) => {
       const pdfDoc = printer.createPdfKitDocument(docDefinition)
       const chunks: any[] = []
       pdfDoc.on('data', (chunk) => chunks.push(chunk))
       pdfDoc.on('end', () => resolve(Buffer.concat(chunks)))
       pdfDoc.on('error', (err) => reject(err))
       pdfDoc.end()
     })
  }

  // ... helper methods ... users, events etc ...

  private async getUsers(orgId: number, startDate?: string, endDate?: string) {
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
        'organization_volunteers.created_at'
      )

    if (orgId > 0) {
      query = query.where('organization_volunteers.organization_id', orgId)
    }

    if (startDate) query = query.where('organization_volunteers.created_at', '>=', startDate)
    if (endDate) query = query.where('organization_volunteers.created_at', '<=', endDate)

    return query
  }

  private async getEvents(orgId: number, startDate?: string, endDate?: string) {
    let query = Event.query()
    
    if (orgId > 0) {
      query = query.where('organization_id', orgId)
    }

    if (startDate) query = query.where('start_at', '>=', startDate)
    if (endDate) query = query.where('start_at', '<=', endDate)

    const events = await query
    return events.map(e => ({
      id: e.id,
      title: e.title,
      description: e.description,
      location: e.location,
      start_at: e.startAt?.toISO(),
      end_at: e.endAt?.toISO()
    }))
  }

  private async getShifts(orgId: number, startDate?: string, endDate?: string) {
    let query = Shift.query().preload('event')

    if (orgId > 0) {
      query = query.where('organization_id', orgId)
    }

    if (startDate) query = query.where('start_at', '>=', startDate)
    if (endDate) query = query.where('start_at', '<=', endDate)

    const shifts = await query
    return shifts.map(s => ({
      id: s.id,
      title: s.title,
      event: s.event?.title || '',
      start_at: s.startAt?.toISO(),
      end_at: s.endAt?.toISO(),
      capacity: s.capacity
    }))
  }

  private async getOpportunities(orgId: number, startDate?: string, endDate?: string) {
    let query = Opportunity.query()

    if (orgId > 0) {
       query = query.where('organization_id', orgId)
    }

    if (startDate) query = query.where('start_at', '>=', startDate)
    if (endDate) query = query.where('start_at', '<=', endDate)

    const opportunities = await query
    return opportunities.map(o => ({
      id: o.id,
      title: o.title,
      description: o.description,
      type: o.type,
      status: o.status,
      start_at: o.startAt?.toISO(),
      end_at: o.endAt?.toISO()
    }))
  }

  private convertToCSV(data: any[]): string {
    if (data.length === 0) return ''
    
    // Get headers from first object
    const headers = Object.keys(data[0])
    
    const rows = data.map(row => {
      return headers.map(header => {
        const val = row[header]
        if (val === null || val === undefined) return ''
        const strVal = String(val)
        // Escape quotes
        if (strVal.includes(',') || strVal.includes('"') || strVal.includes('\n')) {
          return `"${strVal.replace(/"/g, '""')}"`
        }
        return strVal
      }).join(',')
    })

    return [headers.join(','), ...rows].join('\n')
  }
}
