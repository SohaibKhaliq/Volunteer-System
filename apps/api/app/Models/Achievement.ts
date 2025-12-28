import { BaseModel, column, hasMany, HasMany, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import UserAchievement from './UserAchievement'
import AchievementCategory from './AchievementCategory'
import AchievementProgress from './AchievementProgress'

export default class Achievement extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column({ columnName: 'organization_id' })
  public organizationId?: number

  @column({ columnName: 'category_id' })
  public categoryId?: number

  @belongsTo(() => AchievementCategory, {
    foreignKey: 'categoryId'
  })
  public category: BelongsTo<typeof AchievementCategory>

  @column()
  public key: string

  @column()
  public title: string

  @column()
  public description?: string

  @column()
  public criteria?: any

  @column({ columnName: 'rule_type' })
  public ruleType?: 'hours' | 'events' | 'frequency' | 'certification' | 'custom'

  @column({ columnName: 'is_milestone' })
  public isMilestone: boolean

  @column()
  public icon?: string

  @column({ columnName: 'badge_image_url' })
  public badgeImageUrl?: string

  @column()
  public points?: number

  @column({ columnName: 'is_enabled' })
  public isEnabled: boolean

  @hasMany(() => UserAchievement)
  public awards: HasMany<typeof UserAchievement>

  @hasMany(() => AchievementProgress)
  public progress: HasMany<typeof AchievementProgress>

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
