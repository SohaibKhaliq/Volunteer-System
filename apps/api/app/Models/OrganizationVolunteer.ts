import { BaseModel, column, BelongsTo, belongsTo } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import Organization from './Organization'
import User from './User'

export default class OrganizationVolunteer extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column({ columnName: 'organization_id' })
  public organizationId: number

  @belongsTo(() => Organization)
  public organization: BelongsTo<typeof Organization>

  @column({ columnName: 'user_id' })
  public userId: number

  @belongsTo(() => User)
  public user: BelongsTo<typeof User>

  @column()
  public status: string // 'Active', 'Inactive', 'Pending'

  @column()
  public role: string // 'Volunteer', 'Team Leader'

  @column()
  public hours: number

  @column()
  public rating: number

  @column()
  public skills?: string

  @column.dateTime({ columnName: 'joined_at' })
  public joinedAt?: DateTime

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
