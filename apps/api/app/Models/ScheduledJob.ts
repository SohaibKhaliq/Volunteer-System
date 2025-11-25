import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'

export default class ScheduledJob extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public name: string

  @column()
  public type: string

  @column()
  public payload?: string

  @column.dateTime()
  public runAt: DateTime

  @column()
  public status: string

  @column()
  public attempts: number

  @column()
  public lastError?: string

  @column.dateTime()
  public lastRunAt?: DateTime

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
