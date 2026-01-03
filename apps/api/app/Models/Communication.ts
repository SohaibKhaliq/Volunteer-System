import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'

export default class Communication extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public subject: string

  @column()
  public content: string

  @column()
  public type: string

  @column()
  public status: string

  @column.dateTime()
  public sendAt?: DateTime

  @column.dateTime()
  public sentAt?: DateTime

  @column()
  public targetAudience?: string

  @column()
  public organizationId: number

  @column()
  public senderId: number

  @column({ prepare: (value) => JSON.stringify(value) })
  public recipients: any

  @column({ prepare: (value) => JSON.stringify(value) })
  public metadata: any

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime


  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
