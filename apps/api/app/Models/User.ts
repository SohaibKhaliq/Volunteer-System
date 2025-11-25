import { BaseModel, column, HasMany, hasMany, ManyToMany, manyToMany, beforeSave } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import Hash from '@ioc:Adonis/Core/Hash'
import CarpoolingAd from './CarpoolingAd'
import HelpRequest from './HelpRequest'
import Offer from './Offer'
import Assignment from './Assignment'
import ComplianceDocument from './ComplianceDocument'
import Role from './Role'
import Organization from './Organization'


export default class User extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column({ columnName: 'is_admin' })
  public isAdmin: boolean

  @column({ columnName: 'is_disabled' })
  public isDisabled: boolean

  @column()
  public email: string

  @column({ serializeAs: null })
  public password: string

  @column({ columnName: 'first_name' })
  public firstName?: string

  @column({ columnName: 'last_name' })
  public lastName?: string

  @column()
  public phone?: string

  @column({ columnName: 'profile_metadata' })
  public profileMetadata?: string

  @column.dateTime({ columnName: 'last_active_at' })
  public lastLoginAt?: DateTime

  @column({ columnName: 'volunteer_status' })
  public volunteerStatus?: string

  @column.dateTime({ columnName: 'email_verified_at' })
  public emailVerifiedAt?: DateTime

  @hasMany(() => CarpoolingAd)
  public carpoolingAds: HasMany<typeof CarpoolingAd>

  @hasMany(() => Offer)
  public offers: HasMany<typeof Offer>

  @hasMany(() => HelpRequest)
  public helpRequests: HasMany<typeof HelpRequest>

  @hasMany(() => Assignment)
  public assignments: HasMany<typeof Assignment>

  @hasMany(() => ComplianceDocument)
  public complianceDocuments: HasMany<typeof ComplianceDocument>

  @manyToMany(() => Role, {
    pivotTable: 'user_roles',
    localKey: 'id',
    pivotForeignKey: 'user_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'role_id'
  })
  public roles: ManyToMany<typeof Role>

  @manyToMany(() => Organization, {
    pivotTable: 'organization_volunteers',
    localKey: 'id',
    pivotForeignKey: 'user_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'organization_id',
    pivotColumns: ['role', 'status', 'joined_at', 'notes'],
    pivotTimestamps: true
  })
  public organizations: ManyToMany<typeof Organization>

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @beforeSave()
  public static async hashPassword(user: User) {
    if (user.$dirty.password) {
      user.password = await Hash.make(user.password)
    }
  }
}
