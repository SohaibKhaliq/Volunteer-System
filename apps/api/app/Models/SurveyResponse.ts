import { BaseModel, column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import Survey from 'App/Models/Survey'
import User from 'App/Models/User'

export default class SurveyResponse extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column({ columnName: 'survey_id' })
  public surveyId: number

  @belongsTo(() => Survey)
  public survey: BelongsTo<typeof Survey>

  @column({ columnName: 'user_id' })
  public userId: number | null

  @belongsTo(() => User)
  public user: BelongsTo<typeof User>

  @column()
  public answers?: string // JSON string

  @column()
  public responses?: string // JSON string

  @column({ columnName: 'ip_address' })
  public ipAddress?: string

  @column.dateTime({ columnName: 'completed_at' })
  public completedAt?: DateTime

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
