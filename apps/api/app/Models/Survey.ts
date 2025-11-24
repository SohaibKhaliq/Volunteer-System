import { BaseModel, column, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'
import SurveyResponse from './SurveyResponse'
import { DateTime } from 'luxon'

export default class Survey extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public title: string

  @column()
  public description?: string

  @column({
    // store as JSON string in DB, but expose as JS object/array in model
    consume: (value) => {
      try {
        return value ? JSON.parse(value) : []
      } catch (e) {
        return []
      }
    },
    prepare: (value) => {
      try {
        return value ? JSON.stringify(value) : null
      } catch (e) {
        return null
      }
    }
  })
  public questions?: any

  @column()
  public status?: string

  @column()
  public settings?: string

  @column({ columnName: 'created_by' })
  public createdBy?: number

  @column.dateTime({ columnName: 'published_at' })
  public publishedAt?: DateTime

  @column.dateTime({ columnName: 'closed_at' })
  public closedAt?: DateTime

  @hasMany(() => SurveyResponse)
  public responses: HasMany<typeof SurveyResponse>

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
