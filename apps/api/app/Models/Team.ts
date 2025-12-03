import { BaseModel, column, belongsTo, BelongsTo, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import Organization from './Organization'
import User from './User'

export default class Team extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column({ columnName: 'organization_id' })
  public organizationId: number

  @column()
  public name: string

  @column()
  public description?: string

  @column({ columnName: 'lead_user_id' })
  public leadUserId?: number

  @belongsTo(() => Organization)
  public organization: BelongsTo<typeof Organization>

  @belongsTo(() => User, {
    foreignKey: 'leadUserId'
  })
  public lead: BelongsTo<typeof User>

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
