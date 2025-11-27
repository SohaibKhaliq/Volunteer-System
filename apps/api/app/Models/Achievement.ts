import { BaseModel, column, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import UserAchievement from './UserAchievement'

export default class Achievement extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column({ columnName: 'organization_id' })
  public organizationId?: number

  @column()
  public key: string

  @column()
  public title: string

  @column()
  public description?: string

  @column()
  public criteria?: any

  @column()
  public icon?: string

  @column()
  public points?: number

  @column({ columnName: 'is_enabled' })
  public isEnabled: boolean

  @hasMany(() => UserAchievement)
  public awards: HasMany<typeof UserAchievement>

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
