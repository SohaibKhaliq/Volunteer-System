import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import Organization from './Organization'
import Opportunity from './Opportunity'

export default class ComplianceRequirement extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public organizationId: number | null

  @column()
  public opportunityId: number | null

  @column()
  public name: string

  @column()
  public docType: string

  @column()
  public description: string | null

  @column()
  public isMandatory: boolean

  @column()
  public enforcementLevel: 'onboarding' | 'signup' | 'checkin'

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => Organization)
  public organization: BelongsTo<typeof Organization>

  @belongsTo(() => Opportunity)
  public opportunity: BelongsTo<typeof Opportunity>
}
