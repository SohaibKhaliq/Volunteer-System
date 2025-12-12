import { BaseModel, column, belongsTo, BelongsTo, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import Organization from './Organization'
import DocumentAcknowledgment from './DocumentAcknowledgment'

export default class Document extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public title: string

  @column()
  public description?: string

  @column()
  public category: string // 'policy', 'procedure', 'training', 'oh_s', 'other'

  @column()
  public filePath: string

  @column()
  public fileName: string

  @column()
  public fileType: string

  @column()
  public fileSize: number

  @column({ columnName: 'organization_id' })
  public organizationId?: number

  @belongsTo(() => Organization)
  public organization: BelongsTo<typeof Organization>

  @column()
  public requiresAcknowledgment: boolean

  @column()
  public isPublic: boolean // Available to all volunteers or organization-specific

  @column()
  public version: number

  @column()
  public status: string // 'draft', 'published', 'archived'

  @column({ columnName: 'published_at' })
  public publishedAt?: DateTime

  @column({ columnName: 'expires_at' })
  public expiresAt?: DateTime

  @column()
  public metadata?: any

  @hasMany(() => DocumentAcknowledgment)
  public acknowledgments: HasMany<typeof DocumentAcknowledgment>

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
