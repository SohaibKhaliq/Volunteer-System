import { BaseModel, column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import Communication from './Communication'
import User from './User'

export default class CommunicationLog extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public communicationId: number

  @belongsTo(() => Communication)
  public communication: BelongsTo<typeof Communication>

  @column()
  public recipient: string

  @column()
  public userId?: number

  @belongsTo(() => User)
  public user: BelongsTo<typeof User>

  @column()
  public status: string

  @column()
  public attempts: number

  @column()
  public error?: string

  @column()
  public activityType?: string

  @column({
    prepare: (value: any) => (value ? JSON.stringify(value) : null),
    consume: (value: any) => (value ? JSON.parse(value) : null)
  })
  public activityDetails?: object

  @column()
  public ipAddress?: string

  @column()
  public userAgent?: string

  @column.dateTime()
  public occurredAt?: DateTime

  @column.dateTime()
  public lastAttemptAt?: DateTime

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
