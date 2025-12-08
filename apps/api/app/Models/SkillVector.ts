import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import User from './User'

export default class SkillVector extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public userId: number

  @column()
  public embeddingJson: any // Can be string (SQLite) or Object (MySQL)

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => User)
  public user: BelongsTo<typeof User>

  // Helper to get parsed vector
  public get vector(): number[] {
    try {
      if (Array.isArray(this.embeddingJson)) {
        return this.embeddingJson
      }
      if (typeof this.embeddingJson === 'string') {
        return JSON.parse(this.embeddingJson)
      }
      return []
    } catch {
      return []
    }
  }
}
