import { BaseModel, column, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import UserBadge from './UserBadge'

export default class GamificationBadge extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public name: string

  @column()
  public description?: string

  @column()
  public category: string

  @column()
  public points: number

  @column()
  public icon?: string

  @column({
    columnName: 'criteria_json',
    prepare: (value: any) => (value ? JSON.stringify(value) : null),
    consume: (value: any) => (value ? JSON.parse(value) : null)
  })
  public criteria?: any

  @column()
  public rarity: string // common, rare, legendary

  @column({ columnName: 'is_active' })
  public isActive: boolean

  @column({ columnName: 'display_order' })
  public displayOrder: number

  @hasMany(() => UserBadge)
  public userBadges: HasMany<typeof UserBadge>

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
