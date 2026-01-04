import { BaseModel, column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import Course from 'App/Models/Course'
import User from 'App/Models/User'

export default class CourseEnrollment extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public courseId: number

  @belongsTo(() => Course)
  public course: BelongsTo<typeof Course>

  @column()
  public userId: number

  @belongsTo(() => User)
  public user: BelongsTo<typeof User>

  @column()
  public status: string // 'Enrolled', 'Completed', 'Dropped'

  @column()
  public progress: number // 0-100

  @column.dateTime()
  public enrolledAt?: DateTime

  @column.dateTime()
  public completedAt?: DateTime

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
