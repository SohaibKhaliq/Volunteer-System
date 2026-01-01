import Application from '@ioc:Adonis/Core/Application'
import Database from '@ioc:Adonis/Lucid/Database'
import Backup from 'App/Models/Backup'
import AuditLog from 'App/Models/AuditLog'
import Logger from '@ioc:Adonis/Core/Logger'
import fs from 'fs'
import zlib from 'zlib'

export default class BackupService {
  /**
   * Process backup: export core tables to a gzipped JSON file and update Backup record
   */
  public static async processBackup(backupId: number) {
    const backup = await Backup.find(backupId)
    if (!backup) {
      Logger.error('Backup record %s not found', backupId)
      return
    }

    try {
      backup.status = 'creating'
      await backup.save()

      // Ensure tmp backups dir exists
      const dir = Application.tmpPath('backups')
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

      // Export core entities - be explicit about selected fields to avoid secrets
      const users = await Database.from('users').select(
        'id',
        'email',
        'first_name',
        'last_name',
        'created_at',
        'is_disabled'
      )

      const organizations = await Database.from('organizations').select(
        'id',
        'name',
        'slug',
        'status',
        'contact_email',
        'created_at'
      )

      const events = await Database.from('events').select('id', 'title', 'start_at', 'end_at', 'organization_id', 'created_at')

      const volunteerHours = await Database.from('volunteer_hours').select(
        'id',
        'user_id',
        'organization_id',
        'hours',
        'date',
        'notes',
        'status',
        'created_at'
      )

      const exportData = {
        generatedAt: new Date().toISOString(),
        users,
        organizations,
        events,
        volunteer_hours: volunteerHours
      }

      const json = JSON.stringify(exportData)
      const gz = zlib.gzipSync(Buffer.from(json, 'utf-8'))

      const fileName = `backup_${backup.id}_${Date.now()}.json.gz`
      const diskPath = `backups/${fileName}`
      let savedPath = Application.tmpPath('backups', fileName)

      // Try to store in configured Drive; fall back to local tmp
      try {
        const Drive = await import('@ioc:Adonis/Core/Drive')
        await Drive.put(diskPath, gz)
        backup.filePath = diskPath
        backup.fileSize = gz.length
      } catch (driveErr) {
        // Drive not available or failed; write locally
        fs.writeFileSync(savedPath, gz)
        backup.filePath = savedPath
        backup.fileSize = gz.length
        Logger.warn('Drive put failed, saved backup locally: %o', driveErr)
      }

      backup.status = 'completed'
      backup.setIncludedEntities(['users', 'organizations', 'events', 'volunteer_hours'])
      await backup.save()

      // Audit log
      await AuditLog.safeCreate({
        userId: backup.createdBy,
        action: 'backup_completed',
        targetType: 'system',
        targetId: 0,
        metadata: JSON.stringify({ backupId: backup.id, filePath: backup.filePath })
      })

      Logger.info('Backup %s completed: %s', backup.id, backup.filePath)
    } catch (err: any) {
      Logger.error('Backup processing error for %s: %s %s', backupId, err.message, err.stack)
      try {
        backup.status = 'failed'
        await backup.save()
        await AuditLog.safeCreate({
          userId: backup.createdBy,
          action: 'backup_failed',
          targetType: 'system',
          targetId: 0,
          metadata: JSON.stringify({ backupId: backup.id, error: String(err) })
        })
      } catch (e) {
        Logger.error('Failed to update backup record after error: %o', e)
      }
    }
  }
}
