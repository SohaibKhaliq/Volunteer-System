import { BaseModel, column, belongsTo, BelongsTo, computed } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import User from './User'
import Achievement from './Achievement'

export default class AchievementProgress extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column({ columnName: 'user_id' })
  public userId: number

  @belongsTo(() => User)
  public user: BelongsTo<typeof User>

  @column({ columnName: 'achievement_id' })
  public achievementId: number

  @belongsTo(() => Achievement)
  public achievement: BelongsTo<typeof Achievement>

  @column()
  public currentValue: number

  @column()
  public targetValue: number

  @column()
  public percentage: number

  @column.dateTime({ columnName: 'last_evaluated_at' })
  public lastEvaluatedAt?: DateTime

  @computed()
  public get isComplete(): boolean {
    return this.currentValue >= this.targetValue
  }

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
