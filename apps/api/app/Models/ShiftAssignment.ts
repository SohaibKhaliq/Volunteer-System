import { BaseModel, column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import Shift from './Shift'
import ShiftTask from './ShiftTask'
import User from './User'

export default class ShiftAssignment extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public shiftId: number

  @belongsTo(() => Shift)
  public shift: BelongsTo<typeof Shift>

  @column()
  public taskId?: number

  @belongsTo(() => ShiftTask)
  public task: BelongsTo<typeof ShiftTask>

  @column()
  public userId: number

  @belongsTo(() => User)
  public user: BelongsTo<typeof User>

  @column()
  public assignedBy?: number

  @column()
  public status?: string

  @column.dateTime()
  public checkedInAt?: DateTime | null

  @column.dateTime()
  public checkedOutAt?: DateTime | null

  @column()
  public hours?: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
