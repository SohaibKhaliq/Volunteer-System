import { BaseModel, column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import User from './User'

export default class NotificationPreference extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public userId: number

  @belongsTo(() => User)
  public user: BelongsTo<typeof User>

  @column()
  public notificationType: string

  @column()
  public inAppEnabled: boolean

  @column()
  public emailEnabled: boolean

  @column()
  public frequency: 'instant' | 'daily_digest' | 'weekly_digest'

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  /**
   * Get preferences for a user and notification type
   * Returns default preferences if none exist
   */
  public static async getPreferencesForUser(
    userId: number,
    notificationType: string
  ): Promise<NotificationPreference> {
    const existing = await this.query()
      .where('user_id', userId)
      .where('notification_type', notificationType)
      .first()

    if (existing) {
      return existing
    }

    // Return default preferences (not saved to DB)
    const defaultPref = new NotificationPreference()
    defaultPref.userId = userId
    defaultPref.notificationType = notificationType
    defaultPref.inAppEnabled = true
    defaultPref.emailEnabled = true
    defaultPref.frequency = 'instant'
    return defaultPref
  }

  /**
   * Check if email should be sent based on preferences
   */
  public shouldSendEmail(): boolean {
    return this.emailEnabled && this.frequency === 'instant'
  }

  /**
   * Check if in-app notification should be sent
   */
  public shouldSendInApp(): boolean {
    return this.inAppEnabled
  }
}
