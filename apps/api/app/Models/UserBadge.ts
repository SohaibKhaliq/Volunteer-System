import { BaseModel, column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import User from './User'
import GamificationBadge from './GamificationBadge'

export default class UserBadge extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column({ columnName: 'user_id' })
  public userId: number

  @column({ columnName: 'badge_id' })
  public badgeId: number

  @belongsTo(() => User)
  public user: BelongsTo<typeof User>

  @belongsTo(() => GamificationBadge, {
    foreignKey: 'badgeId'
  })
  public badge: BelongsTo<typeof GamificationBadge>

  @belongsTo(() => User, {
    foreignKey: 'awardedBy'
  })
  public granter: BelongsTo<typeof User>

  @column.dateTime({ columnName: 'awarded_at' })
  public awardedAt: DateTime

  @column({ columnName: 'awarded_by' })
  public awardedBy?: number

  @column({ columnName: 'award_reason' })
  public awardReason?: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
