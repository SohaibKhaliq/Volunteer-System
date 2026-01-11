import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@ioc:Adonis/Lucid/Orm'
import type { BelongsTo, HasMany } from '@ioc:Adonis/Lucid/Orm'
import Organization from 'App/Models/Organization'
import User from 'App/Models/User'
import Resource from 'App/Models/Resource'
import Message from 'App/Models/Message'
import Team from 'App/Models/Team'

export default class ChatRoom extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column({ columnName: 'organization_id' })
  public organizationId: number

  @column({ columnName: 'volunteer_id' })
  public volunteerId: number

  @column({ columnName: 'resource_id' })
  public resourceId: number | null

  @column({ columnName: 'team_id' })
  public teamId: number | null

  @column()
  public type: 'direct' | 'team' | 'resource_related'

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => Organization)
  public organization: BelongsTo<typeof Organization>

  @belongsTo(() => User, {
    foreignKey: 'volunteerId',
  })
  public volunteer: BelongsTo<typeof User>

  @belongsTo(() => Resource)
  public resource: BelongsTo<typeof Resource>

  @belongsTo(() => Team)
  public team: BelongsTo<typeof Team>

  @hasMany(() => Message, {
    foreignKey: 'roomId',
  })
  public messages: HasMany<typeof Message>
}
