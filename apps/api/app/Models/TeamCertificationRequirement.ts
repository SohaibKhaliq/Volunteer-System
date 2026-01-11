import { BaseModel, column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import Team from './Team'
import CertificateTemplate from './CertificateTemplate'

export default class TeamCertificationRequirement extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public teamId: number

  @column()
  public templateId: number

  @belongsTo(() => Team)
  public team: BelongsTo<typeof Team>

  @belongsTo(() => CertificateTemplate, {
    foreignKey: 'templateId'
  })
  public template: BelongsTo<typeof CertificateTemplate>

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
