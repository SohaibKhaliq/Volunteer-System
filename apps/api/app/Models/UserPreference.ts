import { BaseModel, column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import User from './User'

export default class UserPreference extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public userId: number

  @belongsTo(() => User)
  public user: BelongsTo<typeof User>

  // Notification preferences
  @column()
  public emailNotifications: boolean

  @column()
  public smsNotifications: boolean

  @column()
  public pushNotifications: boolean

  // Communication preferences
  @column()
  public newsletterSubscription: boolean

  @column()
  public eventReminders: boolean

  @column()
  public shiftReminders: boolean

  @column()
  public opportunityAlerts: boolean

  // Privacy preferences
  @column()
  public profilePublic: boolean

  @column()
  public showEmail: boolean

  @column()
  public showPhone: boolean

  // Availability preferences
  @column({
    prepare: (value: any) => (value ? JSON.stringify(value) : null),
    consume: (value: any) => (value ? JSON.parse(value) : null)
  })
  public preferredDays?: string[] | null

  @column()
  public preferredTime?: string | null

  @column()
  public maxHoursPerWeek?: number | null

  // Other preferences
  @column()
  public language: string

  @column()
  public timezone: string

  @column()
  public theme: string

  // Metadata for custom preferences
  @column({
    prepare: (value: any) => (value ? JSON.stringify(value) : null),
    consume: (value: any) => (value ? JSON.parse(value) : null)
  })
  public customPreferences?: Record<string, any> | null

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  /**
   * Get default preferences
   */
  public static getDefaults(): Partial<UserPreference> {
    return {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      newsletterSubscription: true,
      eventReminders: true,
      shiftReminders: true,
      opportunityAlerts: true,
      profilePublic: false,
      showEmail: false,
      showPhone: false,
      language: 'en',
      timezone: 'Australia/Sydney',
      theme: 'light'
    }
  }

  /**
   * Get or create preferences for a user
   */
  public static async getForUser(userId: number): Promise<UserPreference> {
    let preferences = await this.query().where('user_id', userId).first()

    if (!preferences) {
      preferences = await this.create({
        userId,
        ...this.getDefaults()
      })
    }

    return preferences
  }

  /**
   * Reset preferences to defaults
   */
  public async resetToDefaults(): Promise<void> {
    const defaults = UserPreference.getDefaults()

    // Manually set each property
    Object.keys(defaults).forEach((key) => {
      if (key in this) {
        this[key] = defaults[key]
      }
    })

    await this.save()
  }
}
