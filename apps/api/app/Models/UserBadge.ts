import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import User from './User'
import GamificationBadge from './GamificationBadge'

export default class UserBadge extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public userId: number

  @column()
  public badgeId: number

  @column.dateTime({ autoCreate: true })
  public awardedAt: DateTime

  @belongsTo(() => User)
  public user: BelongsTo<typeof User>

  @belongsTo(() => GamificationBadge)
  public badge: BelongsTo<typeof GamificationBadge>
}
