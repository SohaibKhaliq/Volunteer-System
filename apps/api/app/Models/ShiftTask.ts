import { BaseModel, column, belongsTo, BelongsTo, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import Shift from './Shift'
import ShiftAssignment from './ShiftAssignment'

export default class ShiftTask extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public shiftId: number

  @belongsTo(() => Shift)
  public shift: BelongsTo<typeof Shift>

  @column()
  public title: string

  @column()
  public description?: string

  @column()
  public requiredVolunteers?: number

  @column()
  public difficulty?: string

  @column()
  public skills?: any

  @hasMany(() => ShiftAssignment)
  public assignments: HasMany<typeof ShiftAssignment>

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
