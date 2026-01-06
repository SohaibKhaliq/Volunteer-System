import {
  BaseModel,
  column,
  HasMany,
  hasMany,
  ManyToMany,
  manyToMany,
  beforeSave,
  computed
} from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import Hash from '@ioc:Adonis/Core/Hash'
import CarpoolingAd from './CarpoolingAd'
import HelpRequest from './HelpRequest'
import Offer from './Offer'
import Assignment from './Assignment'
import ComplianceDocument from './ComplianceDocument'
import Role from './Role'
import Organization from './Organization'
import UserAchievement from './UserAchievement'
import OrganizationTeamMember from './OrganizationTeamMember'

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

  @column({
    columnName: 'profile_metadata',
    prepare: (value: any) => JSON.stringify(value),
    consume: (value: any) => (typeof value === 'string' ? JSON.parse(value) : value)
  })
  public profileMetadata?: any

  @column({ columnName: 'role_status' })
  public roleStatus?: string

  @column({ columnName: 'remember_me_token' })
  public rememberMeToken?: string

  @computed()
  public get skills(): string[] {
    const meta = this.profileMetadata || {}
    const raw = meta.skills || meta.skill_tags || []
    if (!raw) return []
    if (Array.isArray(raw)) return raw.map((s) => String(s).trim()).filter(Boolean)
    if (typeof raw === 'string') {
      return raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    }
    return []
  }

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
    // `notes` may not exist in all environments/migrations. keep common fields only.
    pivotColumns: ['role', 'status', 'joined_at'],
    pivotTimestamps: true
  })
  public organizations: ManyToMany<typeof Organization>

  @hasMany(() => OrganizationTeamMember, {
    localKey: 'id',
    foreignKey: 'userId'
  })
  public teamMemberships: HasMany<typeof OrganizationTeamMember>

  @hasMany(() => UserAchievement)
  public achievements: HasMany<typeof UserAchievement>

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
