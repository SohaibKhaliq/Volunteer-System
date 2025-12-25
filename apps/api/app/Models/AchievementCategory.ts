import { BaseModel, column, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import Achievement from './Achievement'

export default class AchievementCategory extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public name: string

  @column()
  public description?: string

  @column()
  public icon?: string

  @column({ columnName: 'sort_order' })
  public sortOrder: number

  @hasMany(() => Achievement)
  public achievements: HasMany<typeof Achievement>

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
