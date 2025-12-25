import { BaseModel, column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import User from './User'
import Organization from './Organization'

export default class Backup extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public backupType: 'full' | 'incremental' | 'organization'

  @column()
  public organizationId: number | null

  @column()
  public createdBy: number

  @column()
  public filePath: string

  @column()
  public fileSize: number

  @column()
  public status: 'creating' | 'completed' | 'failed'

  @column()
  public includedEntities: string | null

  @column()
  public metadata: string | null

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => User, { foreignKey: 'createdBy' })
  public creator: BelongsTo<typeof User>

  @belongsTo(() => Organization)
  public organization: BelongsTo<typeof Organization>

  /**
   * Get included entities as array
   */
  public getIncludedEntities(): string[] {
    if (!this.includedEntities) return []
    try {
      return JSON.parse(this.includedEntities)
    } catch {
      return []
    }
  }

  /**
   * Set included entities from array
   */
  public setIncludedEntities(entities: string[]) {
    this.includedEntities = JSON.stringify(entities)
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
   * Get file size in human-readable format
   */
  public getFileSizeFormatted(): string {
    const bytes = this.fileSize
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }
}
