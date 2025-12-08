import { BaseModel, column, belongsTo, BelongsTo, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import Organization from './Organization'
import Task from './Task'
import Skill from './Skill'
import { manyToMany, ManyToMany } from '@ioc:Adonis/Lucid/Orm'

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

  @column()
  public cause?: string

  @column({ columnName: 'is_recurring' })
  public isRecurring?: boolean

  @column.dateTime()
  public startAt: DateTime

  @column.dateTime()
  public endAt?: DateTime

  @hasMany(() => Task)
  public tasks: HasMany<typeof Task>

  @manyToMany(() => Skill, {
    pivotTable: 'event_skills',
  })
  public skills: ManyToMany<typeof Skill>

  @column({ columnName: 'is_published' })
  public isPublished?: boolean

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
