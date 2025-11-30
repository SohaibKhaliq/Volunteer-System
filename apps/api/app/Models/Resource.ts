import { BaseModel, column, belongsTo, BelongsTo, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import Organization from './Organization'
import ResourceAssignment from './ResourceAssignment'

export default class Resource extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public name: string

  @column()
  public category: string

  @column()
  public description?: string

  @column()
  public quantityTotal: number

  @column()
  public quantityAvailable: number

  @column()
  public status: string

  @column()
  public location?: string

  @column()
  public serialNumber?: string

  @column.dateTime()
  public maintenanceDue?: DateTime | null

  @column()
  public attributes?: any

  @column()
  public organizationId?: number

  @belongsTo(() => Organization)
  public organization: BelongsTo<typeof Organization>

  @hasMany(() => ResourceAssignment)
  public assignments: HasMany<typeof ResourceAssignment>

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
