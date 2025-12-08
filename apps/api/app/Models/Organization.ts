import {
  BaseModel,
  column,
  belongsTo,
  BelongsTo,
  hasMany,
  HasMany,
  manyToMany,
  ManyToMany,
  beforeDelete,
  beforeSave
} from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import Event from './Event'
import User from './User'
import OrganizationInvite from './OrganizationInvite'
import Database from '@ioc:Adonis/Lucid/Database'
import Drive from '@ioc:Adonis/Core/Drive'
import Logger from '@ioc:Adonis/Core/Logger'

export default class Organization extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column({ columnName: 'owner_id' })
  public ownerId: number

  @belongsTo(() => User, { foreignKey: 'ownerId' })
  public owner: BelongsTo<typeof User>

  @column()
  public name: string

  @column()
  public slug?: string

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
  public city?: string

  @column()
  public country?: string

  @column()
  public timezone: string

  @column({
    prepare: (value: any) => (value ? JSON.stringify(value) : null),
    consume: (value: any) => (value ? JSON.parse(value) : null)
  })
  public settings?: object

  @column()
  public status: string // 'active', 'suspended', 'archived'

  @column({
    columnName: 'billing_meta',
    prepare: (value: any) => (value ? JSON.stringify(value) : null),
    consume: (value: any) => (value ? JSON.parse(value) : null)
  })
  public billingMeta?: object

  @column()
  public isApproved?: boolean

  @column()
  public isActive?: boolean

  @column()
  public publicProfile?: boolean

  @column()
  public autoApproveVolunteers?: boolean

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
   * Generate a unique slug from the organization name
   */
  public static generateSlug(name: string): string {
    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    const random = Math.random().toString(36).substring(2, 8)
    return `${base}-${random}`
  }

  @beforeSave()
  public static async generateSlugIfEmpty(org: Organization) {
    if (!org.slug && org.name) {
      org.slug = Organization.generateSlug(org.name)
    }
    // Ensure default values
    if (!org.timezone) {
      org.timezone = 'UTC'
    }
    if (!org.status) {
      org.status = 'active'
    }
  }

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

    const hoursResult = await hoursQuery.sum('volunteer_hours.hours as total_hours')
    const totalHours = hoursResult[0]?.total_hours || 0

    return {
      volunteerCount,
      activeVolunteerCount,
      eventCount,
      totalHours,
      retentionRate: volunteerCount > 0 ? (activeVolunteerCount / volunteerCount) * 100 : 0
    }
  }

  @beforeDelete()
  public static async deleteFiles(org: Organization) {
    try {
      if (org.logo) {
        const raw = String(org.logo)
        const filename = raw.split('/').pop()
        const candidates = [raw]
        if (filename) {
          candidates.push(`organizations/${filename}`)
          candidates.push(`local/${filename}`)
          candidates.push(filename)
        }

        for (const c of candidates) {
          try {
            await Drive.delete(c)
          } catch (e) {
            // ignore missing files
          }
        }

        // also delete thumbnail
        if (filename) {
          const thumb = `organizations/thumbs/${filename}`
          try {
            await Drive.delete(thumb)
          } catch (e) {
            // ignore
          }
        }
      }
    } catch (err) {
      Logger.warn(`Failed to cleanup organization files: ${String(err)}`)
    }
  }

  /**
   * Resolve public URLs for stored logo and its thumbnail.
   */
  public async resolveLogoUrls(): Promise<{ logo: string | null; logo_thumb: string | null }> {
    try {
      if (!this.logo) return { logo: null, logo_thumb: null }
      const raw = String(this.logo)
      const filename = raw.split('/').pop() || raw
      const candidates = [
        raw,
        raw.replace(/^\/?tmp\/uploads\//, ''),
        `organizations/${filename}`,
        `local/${filename}`
      ]

      let resolved: string | null = null
      for (const c of candidates) {
        try {
          const maybe = await Drive.getUrl(c)
          if (maybe) {
            resolved = maybe
            break
          }
        } catch (e) {
          // continue
        }
      }

      const logoUrl = resolved ?? `/uploads/${String(this.logo).replace(/^\//, '')}`

      const thumbCandidate = `organizations/thumbs/${filename}`
      let thumbUrl: string | null = null
      try {
        thumbUrl = (await Drive.getUrl(thumbCandidate).catch(() => null)) ?? null
      } catch (e) {
        thumbUrl = null
      }

      return { logo: logoUrl, logo_thumb: thumbUrl }
    } catch (err) {
      Logger.warn(`resolveLogoUrls failed: ${String(err)}`)
      return { logo: null, logo_thumb: null }
    }
  }

  /**
   * Delete a given stored logo path and its thumbnail (best-effort).
   * Accepts either stored DB value or a filename.
   */
  public static async deleteLogoFilesFor(rawLogo?: string | null) {
    try {
      if (!rawLogo) return
      const raw = String(rawLogo)
      const filename = raw.split('/').pop()
      const candidates = [raw]
      if (filename) {
        candidates.push(`organizations/${filename}`)
        candidates.push(`local/${filename}`)
        candidates.push(filename)
      }

      for (const c of candidates) {
        try {
          await Drive.delete(c)
        } catch (e) {
          // ignore
        }
      }

      if (filename) {
        try {
          await Drive.delete(`organizations/thumbs/${filename}`)
        } catch (e) {
          // ignore
        }
      }
    } catch (err) {
      Logger.warn(`deleteLogoFilesFor failed: ${String(err)}`)
    }
  }
}
