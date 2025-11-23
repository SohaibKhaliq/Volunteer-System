import { BaseModel, column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import Task from './Task'
import User from './User'

export default class Assignment extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public taskId: number

  @belongsTo(() => Task)
  public task: BelongsTo<typeof Task>

  @column()
  public userId: number

  @belongsTo(() => User)
  public user: BelongsTo<typeof User>

  @column()
  public assignedBy?: number

  @column()
  public status?: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
