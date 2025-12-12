import { BaseModel, column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import Document from './Document'
import User from './User'

export default class DocumentAcknowledgment extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column({ columnName: 'document_id' })
  public documentId: number

  @belongsTo(() => Document)
  public document: BelongsTo<typeof Document>

  @column({ columnName: 'user_id' })
  public userId: number

  @belongsTo(() => User)
  public user: BelongsTo<typeof User>

  @column.dateTime({ columnName: 'acknowledged_at' })
  public acknowledgedAt: DateTime

  @column()
  public ipAddress?: string

  @column()
  public userAgent?: string

  @column()
  public notes?: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
