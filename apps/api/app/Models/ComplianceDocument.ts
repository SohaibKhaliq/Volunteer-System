import { BaseModel, column, BelongsTo, belongsTo } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import User from './User'
import Organization from './Organization'

export default class ComplianceDocument extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column({ columnName: 'user_id' })
  public userId: number

  @belongsTo(() => User)
  public user: BelongsTo<typeof User>

  @column({ columnName: 'organization_id' })
  public organizationId?: number

  @belongsTo(() => Organization, {
    foreignKey: 'organizationId'
  })
  public organization: BelongsTo<typeof Organization>

  @column({ columnName: 'doc_type' })
  public docType: string

  @column()
  public status?: string

  @column()
  public description?: string

  @column()
  public isRequired?: boolean

  @column()
  public isActive?: boolean

  @column()
  public content?: string

  @column.dateTime({ columnName: 'issued_at' })
  public issuedAt?: DateTime

  @column.dateTime({ columnName: 'expires_at' })
  public expiresAt?: DateTime

  @column({
    prepare: (value: any) => JSON.stringify(value),
    consume: (value: any) => (typeof value === 'string' ? JSON.parse(value) : value),
  })
  public metadata?: any

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
