import { BaseModel, column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import Survey from './Survey'
import { DateTime } from 'luxon'

export default class SurveyResponse extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  @column({ columnName: 'survey_id' })
  public surveyId: number

  @belongsTo(() => Survey)
  public survey: BelongsTo<typeof Survey>

  @column()
  public userId?: number

  @column()
  public answers?: string // JSON

  @column()
  public ipAddress?: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
import { BaseModel, column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import Survey from 'App/Models/Survey'
import User from 'App/Models/User'

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
