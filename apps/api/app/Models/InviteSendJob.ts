import { BaseModel, column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import OrganizationInvite from './OrganizationInvite'
import { DateTime } from 'luxon'

export default class InviteSendJob extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public organizationInviteId: number

  @column()
  public status: string

  @column()
  public attempts: number

  @column.dateTime()
  public nextAttemptAt?: DateTime

  @column()
  public lastError?: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => OrganizationInvite, {
    foreignKey: 'organizationInviteId'
  })
  public invite: BelongsTo<typeof OrganizationInvite>
}
