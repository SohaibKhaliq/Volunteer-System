import { BaseModel, column, BelongsTo, belongsTo } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import Organization from './Organization'
import User from './User'

export default class OrganizationVolunteer extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column({ columnName: 'organization_id' })
  public organizationId: number

  @belongsTo(() => Organization)
  public organization: BelongsTo<typeof Organization>

  @column({ columnName: 'user_id' })
  public userId: number

  @belongsTo(() => User)
  public user: BelongsTo<typeof User>

  @column()
  public status: string // 'Active', 'Inactive', 'Pending'

  @column()
  public role: string // 'Volunteer', 'Team Leader'

  @column()
  public hours: number

  @column()
  public rating: number

  @column()
  public notes: string | null

  @column({
    prepare: (value: any) => {
      if (value == null) return null
      // If array, stringify normalized values
      if (Array.isArray(value)) {
        return JSON.stringify(value.map((s) => String(s).trim()).filter(Boolean))
      }
      // If already a string, try to determine if it's JSON; if so, keep as-is
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value)
          if (Array.isArray(parsed))
            return JSON.stringify(parsed.map((s) => String(s).trim()).filter(Boolean))
        } catch (e) {
          // not JSON, treat as comma-separated list
          const parts = value
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
          return parts.length ? JSON.stringify(parts) : null
        }
      }
      // fallback: coerce to stringified single-item array
      return JSON.stringify([String(value)])
    },
    consume: (value: any) => {
      if (!value) return []
      if (Array.isArray(value)) return value
      try {
        const parsed = JSON.parse(value)
        if (Array.isArray(parsed)) return parsed
      } catch (e) {
        // fallback to comma-split
        return String(value)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      }
      return []
    }
  })
  public skills?: any

  @column.dateTime({ columnName: 'joined_at' })
  public joinedAt?: DateTime

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
