import { BaseModel, column, belongsTo, BelongsTo, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import Event from './Event'
import Assignment from './Assignment'

export default class Task extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public eventId: number

  @belongsTo(() => Event)
  public event: BelongsTo<typeof Event>

  @column()
  public title: string

  @column()
  public description?: string

  @column.dateTime()
  public startAt?: DateTime

  @column.dateTime()
  public endAt?: DateTime

  @hasMany(() => Assignment)
  public assignments: HasMany<typeof Assignment>

  @column()
  public slotCount?: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
