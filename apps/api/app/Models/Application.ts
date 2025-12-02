import { BaseModel, column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import Opportunity from './Opportunity'
import User from './User'

export default class Application extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column({ columnName: 'opportunity_id' })
  public opportunityId: number

  @column({ columnName: 'user_id' })
  public userId: number

  @column()
  public status: string // 'applied', 'accepted', 'rejected', 'withdrawn'

  @column.dateTime({ columnName: 'applied_at' })
  public appliedAt: DateTime

  @column.dateTime({ columnName: 'responded_at' })
  public respondedAt?: DateTime

  @column()
  public notes?: string

  @belongsTo(() => Opportunity)
  public opportunity: BelongsTo<typeof Opportunity>

  @belongsTo(() => User)
  public user: BelongsTo<typeof User>

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  /**
   * Check if application can be modified
   */
  public canModify(): boolean {
    return this.status === 'applied'
  }

  /**
   * Accept the application
   */
  public async accept() {
    this.status = 'accepted'
    this.respondedAt = DateTime.now()
    await this.save()
  }

  /**
   * Reject the application
   */
  public async reject(notes?: string) {
    this.status = 'rejected'
    this.respondedAt = DateTime.now()
    if (notes) {
      this.notes = notes
    }
    await this.save()
  }

  /**
   * Withdraw the application
   */
  public async withdraw() {
    this.status = 'withdrawn'
    await this.save()
  }
}
