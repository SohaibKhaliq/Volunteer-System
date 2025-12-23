import { BaseModel, column, belongsTo, BelongsTo, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import Event from './Event'
import Assignment from './Assignment'

export default class Task extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  @column({ columnName: 'event_id' })
  public eventId: number

  @belongsTo(() => Event)
  public event: BelongsTo<typeof Event>

  @column()
  public title: string

  @column()
  public description?: string

  @column.dateTime()
  @column.dateTime({ columnName: 'start_at' })
  public startAt?: DateTime

  @column.dateTime()
  @column.dateTime({ columnName: 'end_at' })
  public endAt?: DateTime

  @hasMany(() => Assignment)
  public assignments: HasMany<typeof Assignment>

  @column({ columnName: 'slot_count' })
  public slotCount?: number

  @column({ columnName: 'status' })
  public status?: string

  @column()
  public priority?: string

  @column({
    columnName: 'required_skills',
    prepare: (value: any) => (value ? JSON.stringify(value) : null),
    consume: (value: any) => {
      try {
        return value ? JSON.parse(value) : null
      } catch (e) {
        return value
      }
    }
  })
  public requiredSkills?: any

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
