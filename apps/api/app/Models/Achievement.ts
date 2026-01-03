import { BaseModel, column, hasMany, HasMany, belongsTo, BelongsTo, beforeCreate } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import UserAchievement from './UserAchievement'
import AchievementCategory from './AchievementCategory'
import AchievementProgress from './AchievementProgress'
import crypto from 'crypto'

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

  @beforeCreate()
  public static setDefaults(achievement: Achievement) {
    // Auto-generate key from title if not provided
    if (!achievement.key && achievement.title) {
      const base = achievement.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      const uniqueId = crypto.randomBytes(2).toString('hex')
      achievement.key = `${base}-${uniqueId}`
    }
  }

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
