import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import User from 'App/Models/User'
import TrainingModule from 'App/Models/TrainingModule'

export default class UserTrainingProgress extends BaseModel {
  public static table = 'user_training_progress'

  @column({ isPrimary: true })
  public id: number

  @column()
  public userId: number

  @column()
  public moduleId: number

  @column()
  public status: 'in_progress' | 'completed' | 'failed'

  @column()
  public score: number | null

  @column.dateTime()
  public completedAt: DateTime | null

  @belongsTo(() => User)
  public user: BelongsTo<typeof User>

  @belongsTo(() => TrainingModule, {
    foreignKey: 'moduleId',
  })
  public module: BelongsTo<typeof TrainingModule>

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
