import { BaseModel, column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import User from './User'

export default class AuditLog extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public userId: number

  @belongsTo(() => User)
  public user: BelongsTo<typeof User>

  @column()
  public action: string

  @column()
  public details?: string

  @column({ columnName: 'entity_type' })
  public targetType?: string

  @column({ columnName: 'entity_id' })
  public targetId?: number

  @column()
  public metadata?: string

  @column()
  public ipAddress?: string

  @column()
  public description?: string

  @column({ columnName: 'user_agent' })
  public userAgent?: string

  @column({
    columnName: 'old_values',
    prepare: (value: any) => (value ? JSON.stringify(value) : null),
    consume: (value: any) => (value ? JSON.parse(value) : null)
  })
  public oldValues?: object

  @column({
    columnName: 'new_values',
    prepare: (value: any) => (value ? JSON.stringify(value) : null),
    consume: (value: any) => (value ? JSON.parse(value) : null)
  })
  public newValues?: object

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  /**
   * Create an audit log entry while tolerating missing DB columns.
   *
   * Some deployments may not have the newest audit_logs columns (eg. metadata,
   * target_type, target_id). Creating an entry that includes those fields will
   * fail with a 'Unknown column' DB error. This helper will detect that error,
   * strip the offending column(s) from the payload and retry.
   */
  public static async safeCreate(payload: Record<string, any>) {
    // Make a shallow copy which we'll mutate while retrying
    let data = { ...payload }

    // Allow a few attempts to remove unknown columns reported by the DB
    for (let attempts = 0; attempts < 5; attempts++) {
      try {
        // Use BaseModel.create so hooks/column mapping still apply
        // @ts-ignore - BaseModel's create signature is compatible
        return await this.create(data as any)
      } catch (err: any) {
        const msg = String(err?.sqlMessage || err?.message || err)

        // MySQL: Unknown column 'metadata' in 'INSERT INTO'
        const mysqlMatch = msg.match(/Unknown column '([^']+)' in 'INSERT INTO'/i)
        if (mysqlMatch && mysqlMatch[1]) {
          const col = mysqlMatch[1]
          // Remove both snake_case and camelCase forms from the data
          const camel = col.replace(/_([a-z])/g, (_, c) => (c ? c.toUpperCase() : ''))
          delete data[col]
          delete data[camel]
          continue
        }

        // Postgres: column "metadata" of relation "audit_logs" does not exist
        const pgMatch = msg.match(/column "([^"]+)" of relation "[^"]+" does not exist/i)
        if (pgMatch && pgMatch[1]) {
          const col = pgMatch[1]
          const camel = col.replace(/_([a-z])/g, (_, c) => (c ? c.toUpperCase() : ''))
          delete data[col]
          delete data[camel]
          continue
        }

        // Not a missing-column error we can fix — rethrow
        throw err
      }
    }

    // If we exhausted attempts, make a final try with whatever remains
    // @ts-ignore
    return await this.create(data as any)
  }

  /**
   * Log a profile change
   */
  public static async logProfileChange(
    userId: number,
    targetUserId: number,
    changes: Record<string, { from: any; to: any }>,
    ipAddress?: string
  ) {
    return await this.safeCreate({
      userId,
      action: 'profile_change',
      targetType: 'user',
      targetId: targetUserId,
      details: `Profile updated for user ${targetUserId}`,
      metadata: JSON.stringify({ changes }),
      ipAddress
    })
  }

  /**
   * Log an approval or rejection
   */
  public static async logApproval(
    userId: number,
    targetType: string,
    targetId: number,
    decision: 'approved' | 'rejected',
    reason?: string,
    ipAddress?: string
  ) {
    return await this.safeCreate({
      userId,
      action: `${targetType}_${decision}`,
      targetType,
      targetId,
      details: reason || `${targetType} ${decision}`,
      metadata: JSON.stringify({ decision, reason }),
      ipAddress
    })
  }

  /**
   * Log a role change
   */
  public static async logRoleChange(
    userId: number,
    targetUserId: number,
    roleChanges: { added?: string[]; removed?: string[] },
    ipAddress?: string
  ) {
    return await this.safeCreate({
      userId,
      action: 'role_change',
      targetType: 'user',
      targetId: targetUserId,
      details: `Role changes for user ${targetUserId}`,
      metadata: JSON.stringify(roleChanges),
      ipAddress
    })
  }

  /**
   * Log a login event
   */
  public static async logLogin(
    userId: number,
    success: boolean,
    ipAddress?: string,
    metadata?: Record<string, any>
  ) {
    return await this.safeCreate({
      userId,
      action: success ? 'login_success' : 'login_failed',
      details: success ? 'User logged in successfully' : 'Login attempt failed',
      metadata: metadata ? JSON.stringify(metadata) : undefined,
      ipAddress
    })
  }

  /**
   * Log an override or administrative action
   */
  public static async logOverride(
    userId: number,
    action: string,
    targetType: string,
    targetId: number,
    reason: string,
    ipAddress?: string
  ) {
    return await this.safeCreate({
      userId,
      action: `${action}_override`,
      targetType,
      targetId,
      details: reason,
      metadata: JSON.stringify({ action, reason }),
      ipAddress
    })
  }
}
