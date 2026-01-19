import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, BelongsTo, beforeCreate } from '@ioc:Adonis/Lucid/Orm'
import { randomUUID } from 'node:crypto'
import User from 'App/Models/User'
import Organization from 'App/Models/Organization'
import TrainingModule from 'App/Models/TrainingModule'

export default class Certificate extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public uuid: string

  @column()
  public userId: number | null

  @column()
  public organizationId: number

  @column()
  public recipientOrganizationId: number | null

  @column()
  public moduleId: number | null

  @column()
  public filePath: string

  @column()
  public fileName: string

  @column()
  public fileType: string | null

  @column()
  public recipientType: 'volunteer' | 'organization'

  @column.dateTime()
  public issuedAt: DateTime

  @column()
  public status: 'active' | 'revoked'

  @column()
  public revocationReason: string | null

  @belongsTo(() => User)
  public user: BelongsTo<typeof User>

  @belongsTo(() => Organization)
  public organization: BelongsTo<typeof Organization>

  @belongsTo(() => Organization, {
    foreignKey: 'recipientOrganizationId'
  })
  public recipientOrganization: BelongsTo<typeof Organization>

  @belongsTo(() => TrainingModule, {
     foreignKey: 'moduleId'
  })
  public module: BelongsTo<typeof TrainingModule>

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @beforeCreate()
  public static assignUuid(certificate: Certificate) {
    if (!certificate.uuid) {
      certificate.uuid = randomUUID()
    }
  }
}
