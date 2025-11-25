import { BaseModel, column, hasMany, HasMany, manyToMany, ManyToMany } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import Event from './Event'
import User from './User'
import OrganizationInvite from './OrganizationInvite'
import Database from '@ioc:Adonis/Lucid/Database'

export default class Organization extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public name: string

  @column()
  public description?: string

  @column()
  public contactEmail?: string

  @column()
  public contactPhone?: string

  @column()
  public logo?: string

  @column()
  public type?: string

  @column()
  public website?: string

  @column()
  public address?: string

  @column()
  public isApproved?: boolean

  @column()
  public isActive?: boolean

  @hasMany(() => Event)
  public events: HasMany<typeof Event>

  // Volunteers relationship through pivot table
  @manyToMany(() => User, {
    pivotTable: 'organization_volunteers',
    localKey: 'id',
    pivotForeignKey: 'organization_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'user_id',
    pivotColumns: ['role', 'status', 'joined_at', 'notes'],
    pivotTimestamps: true
  })
  public volunteers: ManyToMany<typeof User>

  // Organization invites
  @hasMany(() => OrganizationInvite)
  public invites: HasMany<typeof OrganizationInvite>

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  /**
   * Get total volunteer count
   */
  public async getVolunteerCount(): Promise<number> {
    const result = await Database.from('organization_volunteers')
      .where('organization_id', this.id)
      .count('* as total')
    return result[0]?.total || 0
  }

  /**
   * Get active volunteer count
   */
  public async getActiveVolunteerCount(): Promise<number> {
    const result = await Database.from('organization_volunteers')
      .where('organization_id', this.id)
      .where('status', 'active')
      .count('* as total')
    return result[0]?.total || 0
  }

  /**
   * Get event count
   */
  public async getEventCount(): Promise<number> {
    const result = await Database.from('events')
      .where('organization_id', this.id)
      .count('* as total')
    return result[0]?.total || 0
  }

  /**
   * Get volunteers by status
   */
  public async getVolunteersByStatus(status: string) {
    const volunteers = await Database.from('users')
      .join('organization_volunteers', 'users.id', 'organization_volunteers.user_id')
      .where('organization_volunteers.organization_id', this.id)
      .where('organization_volunteers.status', status)
      .select(
        'users.*',
        'organization_volunteers.role',
        'organization_volunteers.status',
        'organization_volunteers.joined_at'
      )
    return volunteers
  }

  /**
   * Get organization analytics
   */
  public async getAnalytics(startDate?: DateTime, endDate?: DateTime) {
    const volunteerCount = await this.getVolunteerCount()
    const activeVolunteerCount = await this.getActiveVolunteerCount()
    const eventCount = await this.getEventCount()

    // Get total hours
    let hoursQuery = Database.from('volunteer_hours')
      .join('organization_volunteers', 'volunteer_hours.user_id', 'organization_volunteers.user_id')
      .where('organization_volunteers.organization_id', this.id)
      .where('volunteer_hours.status', 'approved')

    if (startDate) {
      hoursQuery = hoursQuery.where('volunteer_hours.date', '>=', startDate.toSQLDate())
    }
    if (endDate) {
      hoursQuery = hoursQuery.where('volunteer_hours.date', '<=', endDate.toSQLDate())
    }

    const hoursResult = await hoursQuery.sum('hours as total_hours')
    const totalHours = hoursResult[0]?.total_hours || 0

    return {
      volunteerCount,
      activeVolunteerCount,
      eventCount,
      totalHours,
      retentionRate: volunteerCount > 0 ? (activeVolunteerCount / volunteerCount) * 100 : 0
    }
  }
}
