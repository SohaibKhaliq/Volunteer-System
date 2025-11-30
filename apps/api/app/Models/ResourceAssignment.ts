import { BaseModel, column, BelongsTo, belongsTo } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import Resource from './Resource'

export default class ResourceAssignment extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public resourceId: number

  @belongsTo(() => Resource)
  public resource: BelongsTo<typeof Resource>

  @column()
  public assignmentType?: 'event' | 'volunteer' | 'maintenance' | string

  @column()
  public relatedId?: number

  @column.dateTime()
  public assignedAt: DateTime

  @column.dateTime()
  public expectedReturnAt?: DateTime | null

  @column()
  public quantity?: number

  @column.dateTime()
  public returnedAt?: DateTime | null

  @column()
  public status: string

  @column()
  public notes?: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
