import { BaseModel, column, belongsTo, BelongsTo, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import Organization from './Organization'
import Task from './Task'

export default class Event extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column({ columnName: 'organization_id' })
  public organizationId?: number

  @belongsTo(() => Organization)
  public organization: BelongsTo<typeof Organization>

  @column()
  public title: string

  @column()
  public description?: string

  @column()
  public location?: string

  @column({ columnName: 'recurring_rule' })
  public recurringRule?: string

  @column({ columnName: 'capacity' })
  public capacity?: number

  @column({ columnName: 'is_recurring' })
  public isRecurring?: boolean

  @column.dateTime()
  public startAt: DateTime

  @column.dateTime()
  public endAt?: DateTime

  @hasMany(() => Task)
  public tasks: HasMany<typeof Task>

  @column({ columnName: 'latitude' })
  public latitude?: number

  @column({ columnName: 'longitude' })
  public longitude?: number

  @column({ columnName: 'is_published' })
  public isPublished?: boolean

  @column()
  public type?: string

  @column()
  public image?: string

  @column()
  public banner?: string

  /**
   * Resolve accessible URLs for image/banner using Drive where possible
   */
  public async resolveMediaUrls(): Promise<{
    image: string | null
    banner: string | null
    image_thumb?: string | null
  }> {
    try {
      const Drive = (await import('@ioc:Adonis/Core/Drive')).default
      const resolve = async (raw?: string | null) => {
        if (!raw) return null
        const candidates = [
          raw,
          raw.replace(/^\/?tmp\/uploads\//, ''),
          `events/${String(raw).split('/').pop()}`,
          `local/${String(raw).split('/').pop()}`
        ]
        for (const c of candidates) {
          try {
            if (await Drive.exists(c)) {
              const url = await Drive.getUrl(c)
              if (url) return url
            }
          } catch (e) {
            // continue
          }
        }
        return `/uploads/${String(raw).replace(/^\//, '')}`
      }

      const imageUrl = await resolve(this.image ?? null)
      const bannerUrl = await resolve(this.banner ?? null)

      // Attempt to resolve a thumbnail for image
      let imageThumb: string | null = null
      try {
        const filename = this.image ? String(this.image).split('/').pop() : null
        if (filename) {
          const thumbCandidate = `events/thumbs/${filename}`
          if (await Drive.exists(thumbCandidate)) imageThumb = await Drive.getUrl(thumbCandidate)
        }
      } catch (e) {
        // ignore
      }

      return { image: imageUrl, banner: bannerUrl, image_thumb: imageThumb }
    } catch (err) {
      return { image: null, banner: null }
    }
  }

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  // convenience getter used by API payload
  public get coordinates() {
    if (typeof this.latitude === 'number' && typeof this.longitude === 'number') {
      return [Number(this.latitude), Number(this.longitude)] as [number, number]
    }
    return undefined
  }
}
