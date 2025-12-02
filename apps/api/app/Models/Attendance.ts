import { BaseModel, column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import Opportunity from './Opportunity'
import User from './User'

export default class Attendance extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column({ columnName: 'opportunity_id' })
  public opportunityId: number

  @column({ columnName: 'user_id' })
  public userId: number

  @column.dateTime({ columnName: 'check_in_at' })
  public checkInAt?: DateTime

  @column.dateTime({ columnName: 'check_out_at' })
  public checkOutAt?: DateTime

  @column()
  public method: string // 'manual', 'qr', 'biometric'

  @column({
    prepare: (value: any) => (value ? JSON.stringify(value) : null),
    consume: (value: any) => (value ? JSON.parse(value) : null)
  })
  public metadata?: object

  @belongsTo(() => Opportunity)
  public opportunity: BelongsTo<typeof Opportunity>

  @belongsTo(() => User)
  public user: BelongsTo<typeof User>

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  /**
   * Check in a user
   */
  public async checkIn(method: string = 'manual', metadata?: object) {
    this.checkInAt = DateTime.now()
    this.method = method
    if (metadata) {
      this.metadata = metadata
    }
    await this.save()
  }

  /**
   * Check out a user
   */
  public async checkOut() {
    this.checkOutAt = DateTime.now()
    await this.save()
  }

  /**
   * Get duration in hours
   */
  public getDurationHours(): number | null {
    if (!this.checkInAt || !this.checkOutAt) {
      return null
    }
    const diff = this.checkOutAt.diff(this.checkInAt, 'hours')
    return Math.round(diff.hours * 100) / 100
  }

  /**
   * Check if currently checked in
   */
  public isCheckedIn(): boolean {
    return !!this.checkInAt && !this.checkOutAt
  }
}
