import { BaseModel, column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import Organization from './Organization'

export default class EngagementCampaign extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column({ columnName: 'organization_id' })
  public organizationId: number

  @belongsTo(() => Organization)
  public organization: BelongsTo<typeof Organization>

  @column()
  public name: string

  @column()
  public description?: string

  @column({ columnName: 'campaign_type' })
  public campaignType: string

  @column.dateTime({ columnName: 'start_date' })
  public startDate: DateTime

  @column.dateTime({ columnName: 'end_date' })
  public endDate: DateTime

  @column({ columnName: 'target_audience' })
  public targetAudience?: string

  @column({ columnName: 'goal_metric' })
  public goalMetric?: number

  @column({ columnName: 'current_metric' })
  public currentMetric?: number

  @column()
  public status: string // active, completed, scheduled

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
