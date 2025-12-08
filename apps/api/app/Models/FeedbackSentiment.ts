import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import SurveyResponse from './SurveyResponse'

export default class FeedbackSentiment extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public responseId: number | null

  @column()
  public aiScore: number

  @column()
  public aiSummary: string | null

  @column()
  public sentimentLabel: string

  @column.dateTime({ autoCreate: true })
  public analyzedAt: DateTime

  @belongsTo(() => SurveyResponse, { foreignKey: 'responseId' })
  public response: BelongsTo<typeof SurveyResponse>
}
