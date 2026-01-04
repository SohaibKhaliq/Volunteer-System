import { BaseModel, column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import User from './User'

export default class BackgroundCheck extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column({ columnName: 'user_id' })
  public userId: number

  @belongsTo(() => User)
  public user: BelongsTo<typeof User>

  @column()
  public status?: string

  @column()
  public result?: string

  @column.dateTime()
  public issuedAt?: DateTime

  @column.dateTime()
  public expiresAt?: DateTime

  @column()
  public referenceNumber?: string

  @column.dateTime({ columnName: 'requested_at' })
  public requestedAt?: DateTime

  @column.dateTime({ columnName: 'completed_at' })
  public completedAt?: DateTime

  @column()
  public notes?: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
