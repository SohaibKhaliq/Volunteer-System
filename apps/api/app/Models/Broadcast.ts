import { BaseModel, column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import User from './User'
import Database from '@ioc:Adonis/Lucid/Database'

export default class Broadcast extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public createdById: number

  @belongsTo(() => User, { foreignKey: 'createdById' })
  public creator: BelongsTo<typeof User>

  @column()
  public title: string

  @column()
  public message: string

  @column()
  public priority: 'normal' | 'high' | 'emergency'

  @column()
  public targetType: 'all' | 'organization' | 'role' | 'custom'

  @column({
    prepare: (value: any) => (value ? JSON.stringify(value) : null),
    consume: (value: string | null) => (value ? JSON.parse(value) : null)
  })
  public targetFilter: Record<string, any> | null

  @column.dateTime()
  public scheduledAt: DateTime | null

  @column.dateTime()
  public sentAt: DateTime | null

  @column()
  public status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed'

  @column()
  public recipientCount: number

  @column()
  public deliveryCount: number

  @column()
  public errorCount: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  /**
   * Get recipient user IDs based on target type and filter
   */
  public async getRecipients(): Promise<number[]> {
    let query = Database.from('users').select('id')

    switch (this.targetType) {
      case 'all':
        // All active users
        query = query.whereNull('is_disabled').orWhere('is_disabled', false)
        break

      case 'organization':
        // Users in specific organization(s)
        if (this.targetFilter?.organizationIds) {
          query = query
            .join('organization_volunteers', 'users.id', 'organization_volunteers.user_id')
            .whereIn('organization_volunteers.organization_id', this.targetFilter.organizationIds)
        }
        break

      case 'role':
        // Users with specific role(s)
        if (this.targetFilter?.roleIds) {
          query = query
            .join('user_roles', 'users.id', 'user_roles.user_id')
            .whereIn('user_roles.role_id', this.targetFilter.roleIds)
        }
        break

      case 'custom':
        // Custom filter based on user attributes
        if (this.targetFilter?.userIds) {
          query = query.whereIn('id', this.targetFilter.userIds)
        }
        if (this.targetFilter?.isAdmin !== undefined) {
          query = query.where('is_admin', this.targetFilter.isAdmin)
        }
        break
    }

    const users = await query
    return users.map((u: any) => u.id)
  }

  /**
   * Mark broadcast as scheduled
   */
  public async schedule(scheduledAt: DateTime): Promise<void> {
    this.scheduledAt = scheduledAt
    this.status = 'scheduled'
    await this.save()
  }

  /**
   * Mark broadcast as sending
   */
  public async markAsSending(): Promise<void> {
    this.status = 'sending'
    await this.save()
  }

  /**
   * Mark broadcast as sent
   */
  public async markAsSent(deliveryCount: number, errorCount: number): Promise<void> {
    this.status = 'sent'
    this.sentAt = DateTime.now()
    this.deliveryCount = deliveryCount
    this.errorCount = errorCount
    await this.save()
  }

  /**
   * Mark broadcast as failed
   */
  public async markAsFailed(): Promise<void> {
    this.status = 'failed'
    await this.save()
  }

  /**
   * Update recipient count
   */
  public async updateRecipientCount(count: number): Promise<void> {
    this.recipientCount = count
    await this.save()
  }
}
