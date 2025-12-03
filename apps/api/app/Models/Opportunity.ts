import { BaseModel, column, belongsTo, BelongsTo, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import Organization from './Organization'
import Team from './Team'
import User from './User'
import crypto from 'crypto'

export default class Opportunity extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column({ columnName: 'organization_id' })
  public organizationId: number

  @column({ columnName: 'team_id' })
  public teamId?: number

  @column()
  public title: string

  @column()
  public slug?: string

  @column()
  public description?: string

  @column()
  public location?: string

  @column()
  public capacity: number

  @column()
  public type: string // 'event', 'recurring', 'shift'

  @column.dateTime({ columnName: 'start_at' })
  public startAt: DateTime

  @column.dateTime({ columnName: 'end_at' })
  public endAt?: DateTime

  @column({
    prepare: (value: any) => (value ? JSON.stringify(value) : null),
    consume: (value: any) => (value ? JSON.parse(value) : null)
  })
  public recurrence?: object

  @column()
  public status: string // 'draft', 'published', 'cancelled'

  @column()
  public visibility: string // 'public', 'org-only', 'invite-only'

  @column({ columnName: 'created_by' })
  public createdBy?: number

  @column({ columnName: 'checkin_code' })
  public checkinCode?: string

  @belongsTo(() => Organization)
  public organization: BelongsTo<typeof Organization>

  @belongsTo(() => Team)
  public team: BelongsTo<typeof Team>

  @belongsTo(() => User, {
    foreignKey: 'createdBy'
  })
  public creator: BelongsTo<typeof User>

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  /**
   * Generate a unique slug from title using crypto for better uniqueness
   */
  public static generateSlug(title: string): string {
    const base = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    const uniqueId = crypto.randomBytes(4).toString('hex')
    return `${base}-${uniqueId}`
  }

  /**
   * Generate a unique check-in code for QR code scanning
   */
  public static generateCheckinCode(): string {
    return crypto.randomBytes(16).toString('hex')
  }

  /**
   * Get QR code data for this opportunity
   */
  public getQRData(): object {
    return {
      opportunityId: this.id,
      code: this.checkinCode,
      title: this.title
    }
  }
}
