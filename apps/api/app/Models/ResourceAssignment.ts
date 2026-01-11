import { BaseModel, column, BelongsTo, belongsTo } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import Resource from './Resource'
import User from './User'
import Team from './Team'

export default class ResourceAssignment extends BaseModel {
  public static STATUS_ASSIGNED = 'ASSIGNED'
  public static STATUS_IN_USE = 'IN_USE'
  public static STATUS_PENDING_RETURN = 'PENDING_RETURN'
  public static STATUS_RETURNED = 'RETURNED'

  @column({ isPrimary: true })
  public id: number

  @column()
  public resourceId: number

  @belongsTo(() => Resource)
  public resource: BelongsTo<typeof Resource>

  @column()
  public assignmentType?: 'event' | 'volunteer' | 'maintenance' | string

  @column()
  public relatedId?: number

  @belongsTo(() => User, {
    foreignKey: 'relatedId'
  })
  public volunteer: BelongsTo<typeof User>

  @belongsTo(() => Team, {
    foreignKey: 'relatedId'
  })
  public team: BelongsTo<typeof Team>

  @column.dateTime()
  public assignedAt: DateTime

  @column.dateTime()
  public expectedReturnAt?: DateTime | null

  @column()
  public quantity?: number

  @column.dateTime()
  public returnedAt?: DateTime | null

  @column()
  public status: string

  @column()
  public condition?: string

  @column()
  public notes?: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
