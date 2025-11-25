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
  public ipAddress?: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime
}
