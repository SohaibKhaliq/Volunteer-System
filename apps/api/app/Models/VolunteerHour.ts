import { BaseModel, column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import User from './User'
import Event from './Event'
import Organization from './Organization'
import Shift from './Shift'

export default class VolunteerHour extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public userId: number

  @belongsTo(() => User)
  public user: BelongsTo<typeof User>

  @column()
  public eventId: number

  @belongsTo(() => Event)
  public event: BelongsTo<typeof Event>

  @column.date()
  public date: DateTime

  @column()
  public hours: number

  @column()
  public status: string // 'Pending', 'Approved', 'Rejected'

  @column()
  public organizationId?: number

  @belongsTo(() => Organization)
  public organization: BelongsTo<typeof Organization>

  @column()
  public shiftId?: number

  @belongsTo(() => Shift)
  public shift: BelongsTo<typeof Shift>

  @column()
  public rejectionReason?: string

  @column()
  public notes?: string

  @column()
  public locked: boolean

  @column()
  public auditedBy?: number

  @belongsTo(() => User, { foreignKey: 'auditedBy' })
  public auditor: BelongsTo<typeof User>

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}

