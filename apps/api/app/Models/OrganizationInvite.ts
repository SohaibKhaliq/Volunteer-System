import { BaseModel, column, belongsTo, BelongsTo, beforeCreate } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import Organization from './Organization'
import User from './User'
import { randomBytes } from 'crypto'

export default class OrganizationInvite extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public organizationId: number

  @column()
  public invitedBy?: number

  @column()
  public email: string

  @column()
  public firstName?: string

  @column()
  public lastName?: string

  @column()
  public role: string

  @column()
  public status: string

  @column()
  public token: string

  @column()
  public message?: string

  @column.dateTime()
  public expiresAt: DateTime

  @column.dateTime()
  public respondedAt?: DateTime

  @belongsTo(() => Organization)
  public organization: BelongsTo<typeof Organization>

  @belongsTo(() => User, {
    foreignKey: 'invitedBy'
  })
  public inviter: BelongsTo<typeof User>

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  /**
   * Set default values before creating an invite
   */
  @beforeCreate()
  public static setDefaults(invite: OrganizationInvite) {
    // Set default expiration to 7 days from now if not provided
    if (!invite.expiresAt) {
      invite.expiresAt = DateTime.now().plus({ days: 7 })
    }

    // Auto-generate token if not provided
    if (!invite.token) {
      invite.token = OrganizationInvite.generateToken()
    }
  }

  /**
   * Generate a unique invitation token
   */
  public static generateToken(): string {
    return randomBytes(32).toString('hex')
  }

  /**
   * Check if invitation is expired
   */
  public isExpired(): boolean {
    return DateTime.now() > this.expiresAt
  }

  /**
   * Check if invitation is still valid
   */
  public isValid(): boolean {
    return this.status === 'pending' && !this.isExpired()
  }

  /**
   * Mark invitation as accepted
   */
  public async accept() {
    this.status = 'accepted'
    this.respondedAt = DateTime.now()
    await this.save()
  }

  /**
   * Mark invitation as rejected
   */
  public async reject() {
    this.status = 'rejected'
    this.respondedAt = DateTime.now()
    await this.save()
  }

  /**
   * Cancel invitation
   */
  public async cancel() {
    this.status = 'cancelled'
    await this.save()
  }
}
