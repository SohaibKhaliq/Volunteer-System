import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import { RequestTypes } from '../../contracts/requests'

export default class Type extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public type: RequestTypes

  @column()
  public name?: string

  @column()
  public category?: string

  @column()
  public description?: string

  @column({ columnName: 'for_entity' })
  public forEntity?: string

  @column()
  public icon?: string

  @column({ columnName: 'is_active' })
  public isActive?: boolean

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
