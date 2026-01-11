import { BaseModel, column, belongsTo, BelongsTo, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import Organization from './Organization'
import User from './User'
import TeamCertificationRequirement from './TeamCertificationRequirement'
import ChatRoom from './ChatRoom'
import OrganizationTeamMember from './OrganizationTeamMember'

export default class Team extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column({ columnName: 'organization_id' })
  public organizationId: number

  @column()
  public name: string

  @column()
  public description?: string

  @column()
  public capacity?: number

  @column()
  public minRequirementsEnabled: boolean

  @column({ columnName: 'lead_user_id' })
  public leadUserId?: number

  @belongsTo(() => Organization)
  public organization: BelongsTo<typeof Organization>

  @belongsTo(() => User, {
    foreignKey: 'leadUserId'
  })
  public lead: BelongsTo<typeof User>

  @hasMany(() => OrganizationTeamMember, {
    foreignKey: 'teamId'
  })
  public members: HasMany<typeof OrganizationTeamMember>
 
  @hasMany(() => TeamCertificationRequirement, {
    foreignKey: 'teamId'
  })
  public requirements: HasMany<typeof TeamCertificationRequirement>

  @hasMany(() => ChatRoom, {
    foreignKey: 'teamId'
  })
  public chatRooms: HasMany<typeof ChatRoom>

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
