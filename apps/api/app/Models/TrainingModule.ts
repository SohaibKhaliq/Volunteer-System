import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import Organization from 'App/Models/Organization'

export default class TrainingModule extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public organizationId: number

  @column()
  public title: string

  @column()
  public description: string | null

  @column()
  public type: 'video' | 'pdf' | 'quiz' | 'link'

  @column()
  public contentData: object | null

  @column()
  public passingCriteria: object | null

  @column()
  public isActive: boolean

  @belongsTo(() => Organization)
  public organization: BelongsTo<typeof Organization>

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
