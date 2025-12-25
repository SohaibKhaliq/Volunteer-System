import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'

export default class SystemMetric extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public metricType: string

  @column.date()
  public metricDate: DateTime

  @column()
  public metricValue: number

  @column()
  public metadata?: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  /**
   * Parse metadata JSON
   */
  public getMetadata(): Record<string, any> | null {
    if (!this.metadata) return null
    try {
      return JSON.parse(this.metadata)
    } catch {
      return null
    }
  }

  /**
   * Set metadata from object
   */
  public setMetadata(data: Record<string, any>) {
    this.metadata = JSON.stringify(data)
  }
}
