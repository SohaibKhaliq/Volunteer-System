import { BaseModel, column, hasMany, HasMany, beforeCreate } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import UserAchievement from './UserAchievement'
import AchievementProgress from './AchievementProgress'
import crypto from 'crypto'

export default class Achievement extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column({ columnName: 'organization_id' })
  public organizationId?: number

  @column({ columnName: 'category' })
  public category: string

  @column()
  public key: string

  @column()
  public name: string

  @column()
  public description?: string

  @column({
    columnName: 'requirement_json',
    prepare: (value: any) => (value ? JSON.stringify(value) : null),
    consume: (value: any) => {
      if (!value) return null
      if (typeof value === 'object') return value
      try {
        return JSON.parse(value)
      } catch (error) {
        return value
      }
    }
  })
  public requirement?: any

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

  @column({ columnName: 'is_active' })
  public isActive: boolean

  @hasMany(() => UserAchievement)
  public awards: HasMany<typeof UserAchievement>

  @hasMany(() => AchievementProgress)
  public progress: HasMany<typeof AchievementProgress>

  @beforeCreate()
  public static setDefaults(achievement: Achievement) {
    // Auto-generate key from name if not provided
    if (!achievement.key && achievement.name) {
      const base = achievement.name
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
