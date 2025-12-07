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

  @column()
  public targetType?: string

  @column()
  public targetId?: number

  @column()
  public metadata?: string

  @column()
  public ipAddress?: string

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
}
