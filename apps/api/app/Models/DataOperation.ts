import { BaseModel, column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import User from './User'
import Organization from './Organization'

export default class DataOperation extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public operationType: 'import' | 'export' | 'backup'

  @column()
  public entityType: string

  @column()
  public format: 'csv' | 'xlsx' | 'json'

  @column()
  public status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'

  @column()
  public organizationId: number | null

  @column()
  public userId: number

  @column()
  public filePath: string | null

  @column()
  public filters: string | null

  @column()
  public totalRecords: number

  @column()
  public processedRecords: number

  @column()
  public failedRecords: number

  @column()
  public progress: number

  @column()
  public errors: string | null

  @column()
  public metadata: string | null

  @column.dateTime()
  public startedAt: DateTime | null

  @column.dateTime()
  public completedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => User)
  public user: BelongsTo<typeof User>

  @belongsTo(() => Organization)
  public organization: BelongsTo<typeof Organization>

  /**
   * Update progress
   */
  public updateProgress(processed: number, total: number) {
    this.processedRecords = processed
    this.totalRecords = total
    this.progress = total > 0 ? Math.round((processed / total) * 100) : 0
  }

  /**
   * Add error to error list
   */
  public addError(error: string) {
    const errors = this.getErrors()
    errors.push(error)
    this.errors = JSON.stringify(errors)
  }

  /**
   * Get errors as array
   */
  public getErrors(): string[] {
    if (!this.errors) return []
    try {
      return JSON.parse(this.errors)
    } catch {
      return []
    }
  }

  /**
   * Mark operation as completed
   */
  public markCompleted() {
    this.status = 'completed'
    this.completedAt = DateTime.now()
    this.progress = 100
  }

  /**
   * Mark operation as failed
   */
  public markFailed(error: string) {
    this.status = 'failed'
    this.completedAt = DateTime.now()
    this.addError(error)
  }

  /**
   * Mark operation as cancelled
   */
  public markCancelled() {
    this.status = 'cancelled'
    this.completedAt = DateTime.now()
  }

  /**
   * Get metadata as object
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

  /**
   * Get filters as object
   */
  public getFilters(): Record<string, any> | null {
    if (!this.filters) return null
    try {
      return JSON.parse(this.filters)
    } catch {
      return null
    }
  }

  /**
   * Set filters from object
   */
  public setFilters(data: Record<string, any>) {
    this.filters = JSON.stringify(data)
  }
}
