import { BaseModel, column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import Survey from './Survey'
import User from './User'

export default class SurveyResponse extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public surveyId: number

  @belongsTo(() => Survey)
  public survey: BelongsTo<typeof Survey>

  @column()
  public userId?: number

  @belongsTo(() => User)
  public user: BelongsTo<typeof User>

  @column()
  public answers: string // JSON string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime
}
