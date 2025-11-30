import { BaseModel, column, hasMany, HasMany, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import Event from './Event'
import ShiftTask from './ShiftTask'
import ShiftAssignment from './ShiftAssignment'

export default class Shift extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public title: string

  @column()
  public description?: string

  @column()
  public eventId?: number

  @belongsTo(() => Event, { foreignKey: 'eventId' })
  public event: BelongsTo<typeof Event>

  @column.dateTime()
  public startAt: DateTime

  @column.dateTime()
  public endAt: DateTime

  @column()
  public capacity?: number

  @column()
  public isRecurring?: boolean

  @column()
  public recurrenceRule?: string

  @column()
  public templateName?: string

  @column()
  public locked?: boolean

  @column()
  public organizationId?: number

  @hasMany(() => ShiftTask)
  public tasks: HasMany<typeof ShiftTask>

  @hasMany(() => ShiftAssignment)
  public assignments: HasMany<typeof ShiftAssignment>

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
