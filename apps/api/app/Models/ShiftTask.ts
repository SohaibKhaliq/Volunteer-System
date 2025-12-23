import {
  BaseModel,
  column,
  belongsTo,
  BelongsTo,
  hasMany,
  HasMany,
  computed
} from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import Shift from './Shift'
import ShiftAssignment from './ShiftAssignment'

export default class ShiftTask extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public shiftId: number

  @belongsTo(() => Shift)
  public shift: BelongsTo<typeof Shift>

  @column()
  public title: string

  @column()
  public description?: string

  @column()
  public requiredVolunteers?: number

  @column()
  public difficulty?: string

  @column({
    prepare: (value: any) => (value ? JSON.stringify(value) : null),
    consume: (value: any) => {
      try {
        return value ? JSON.parse(value) : null
      } catch (e) {
        return value
      }
    }
  })
  public skills?: any

  @computed()
  public get skillTags(): string[] {
    const raw = this.skills || []
    if (!raw) return []
    if (Array.isArray(raw)) return raw.map((s) => String(s).trim()).filter(Boolean)
    if (typeof raw === 'string')
      return raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    return []
  }

  @hasMany(() => ShiftAssignment)
  public assignments: HasMany<typeof ShiftAssignment>

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
