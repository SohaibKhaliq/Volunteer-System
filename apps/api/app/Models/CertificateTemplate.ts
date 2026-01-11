import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import User from 'App/Models/User'

export default class CertificateTemplate extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public name: string

  @column()
  public backgroundImageUrl: string | null

  @column()
  public layoutConfig: object

  @column()
  public isGlobal: boolean

  @column()
  public createdBy: number | null

  @belongsTo(() => User, {
    foreignKey: 'createdBy',
  })
  public creator: BelongsTo<typeof User>

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
