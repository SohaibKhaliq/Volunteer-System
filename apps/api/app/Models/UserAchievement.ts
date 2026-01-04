import { BaseModel, column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import User from './User'
import Achievement from './Achievement'

export default class UserAchievement extends BaseModel {
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
  public metadata?: any

  @column({ columnName: 'granted_by' })
  public grantedBy?: number

  @belongsTo(() => User, { foreignKey: 'grantedBy' })
  public granter: BelongsTo<typeof User>

  @column({ columnName: 'grant_reason' })
  public grantReason?: string

  @column()
  public progress: number

  @column.dateTime({ columnName: 'unlocked_at' })
  public unlockedAt: DateTime

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
