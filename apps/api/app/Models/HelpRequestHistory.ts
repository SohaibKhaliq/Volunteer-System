import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import HelpRequest from './HelpRequest'
import User from './User'

export default class HelpRequestHistory extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public helpRequestId: number

  @column()
  public userId: number

  @column()
  public action: string

  @column()
  public previousValue: any

  @column()
  public newValue: any

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => HelpRequest)
  public helpRequest: BelongsTo<typeof HelpRequest>

  @belongsTo(() => User)
  public user: BelongsTo<typeof User>
}
