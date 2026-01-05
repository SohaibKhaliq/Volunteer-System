import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Application from '@ioc:Adonis/Core/Application'
import OrganizationTeamMember from 'App/Models/OrganizationTeamMember'
import AdmZip from 'adm-zip'
import { DateTime } from 'luxon'
import Database from '@ioc:Adonis/Lucid/Database'
import fs from 'fs'

export default class BackupController {

  private async checkAdminPermission(auth: any, response: any) {
    const user = auth.user!
    const isGlobalAdmin = user.isAdmin || (user as any).is_admin

    if (isGlobalAdmin) return true

    const memberRecord = await OrganizationTeamMember.query().where('user_id', user.id).first()
    const allowedRoles = ['admin', 'coordinator', 'Admin', 'Coordinator']
    
    if (memberRecord && allowedRoles.includes(memberRecord.role || '')) {
      return true
    }

    return response.forbidden({ message: 'You do not have permission to access backups' })
  }

  /**
   * Download a full database dump as JSON
   */
  public async downloadDatabase({ response, auth }: HttpContextContract) {
    if ((await this.checkAdminPermission(auth, response)) !== true) return

    // List of tables to dump
    // We fetch raw data to avoid model overhead and circular dependencies for a pure backup
    const tables = [
      'users',
      'organizations',
      'organization_team_members',
      'organization_volunteers',
      'events',
      'shifts',
      'opportunities',
      'applications',
      'attendances',
      'volunteer_hours',
      'compliance_documents',
      'roles',
      'user_roles',
      'skills',
      // Add other tables as needed
    ]

    const dump: Record<string, any> = {
      meta: {
        generated_at: DateTime.now().toISO(),
        version: '1.0'
      },
      data: {}
    }

    for (const table of tables) {
      try {
        const rows = await Database.from(table).select('*')
        dump.data[table] = rows
      } catch (error) {
        // Table might not exist, skip or log
        console.warn(`Backup: Could not dump table ${table}`, error)
      }
    }

    const filename = `db-backup-${DateTime.now().toFormat('yyyy-MM-dd-HHmm')}.json`
    
    response.header('Content-Type', 'application/json')
    response.header('Content-Disposition', `attachment; filename="${filename}"`)
    
    return response.send(dump)
  }

  /**
   * Download a zip of all uploaded media
   */
  public async downloadMedia({ response, auth }: HttpContextContract) {
    if ((await this.checkAdminPermission(auth, response)) !== true) return

    const uploadsPath = Application.tmpPath('uploads')

    if (!fs.existsSync(uploadsPath)) {
      return response.notFound({ message: 'No uploads directory found' })
    }

    const zip = new AdmZip()
    // Add local uploads folder to zip
    zip.addLocalFolder(uploadsPath)

    const filename = `media-backup-${DateTime.now().toFormat('yyyy-MM-dd-HHmm')}.zip`
    const buffer = zip.toBuffer()

    response.header('Content-Type', 'application/zip')
    response.header('Content-Disposition', `attachment; filename="${filename}"`)
    
    return response.send(buffer)
  }
}
