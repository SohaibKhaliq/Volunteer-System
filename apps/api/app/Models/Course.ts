import { BaseModel, column, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import CourseEnrollment from './CourseEnrollment'

export default class Course extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public title: string

  @column()
  public description?: string

  @column()
  public instructor?: string

  @column.dateTime()
  public startAt?: DateTime

  @column.dateTime()
  public endAt?: DateTime

  @column()
  public capacity?: number

  @column()
  public status: string // 'Open', 'In Progress', 'Completed'

  @hasMany(() => CourseEnrollment)
  public enrollments: HasMany<typeof CourseEnrollment>

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
