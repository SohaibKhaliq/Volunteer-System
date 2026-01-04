import { BaseModel, column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import Task from './Task'
import User from './User'

export default class Assignment extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  @column({ columnName: 'task_id' })
  public taskId: number

  @belongsTo(() => Task)
  public task: BelongsTo<typeof Task>

  @column()
  @column({ columnName: 'user_id' })
  public userId: number

  @belongsTo(() => User)
  public user: BelongsTo<typeof User>

  @column({ columnName: 'assigned_by' })
  public assignedBy?: number

  @column()
  public status?: string

  @column()
  public quantity?: number

  @column()
  public notes?: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
