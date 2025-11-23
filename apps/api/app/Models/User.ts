import { BaseModel, column, HasMany, hasMany, ManyToMany, manyToMany, beforeSave } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import Hash from '@ioc:Adonis/Core/Hash'
import CarpoolingAd from './CarpoolingAd'
import HelpRequest from './HelpRequest'
import Offer from './Offer'
import Assignment from './Assignment'
import ComplianceDocument from './ComplianceDocument'
import Role from './Role'


export default class User extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public isAdmin: boolean

  @column()
  public isDisabled: boolean

  @column()
  public email: string

  @column({ serializeAs: null })
  public password: string

  @column()
  public firstName?: string

  @column()
  public lastName?: string

  @column()
  public phone?: string

  @column.dateTime()
  public lastActiveAt?: DateTime

  @column()
  public volunteerStatus?: string

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
