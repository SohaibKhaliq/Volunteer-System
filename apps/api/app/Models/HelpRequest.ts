import {
  BaseModel,
  BelongsTo,
  belongsTo,
  column,
  manyToMany,
  ManyToMany
} from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import { HelpRequestStatus } from '../../contracts/status'
import Type from './Type'
import User from './User'

export default class HelpRequest extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @manyToMany(() => Type, {
    localKey: 'id',
    pivotForeignKey: 'help_request_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'type_id',
    pivotTable: 'help_request_types'
  })
  public types: ManyToMany<typeof Type>

  @belongsTo(() => User)
  public user: BelongsTo<typeof User>

  @column({ columnName: 'user_id' })
  public userId: number

  @column()
  public urgency: string

  @column()
  public longitude: number

  @column()
  public latitude: number

  @column()
  public address: string

  @column()
  public description: string

  @column()
  public source: string

  @column()
  public status: HelpRequestStatus

  @column()
  public name: string

  @column()
  public phone: string

  @column()
  public email: string

  @column()
  public isOnSite: boolean

  @column()
  public files: string

  @column()
  public caseId: string

  @column()
  public severity: 'low' | 'medium' | 'high' | 'critical'

  @column()
  public urgencyScore: number

  @column()
  public isVerified: boolean

  @column()
  public contactMethod: 'phone' | 'email' | 'sms' | 'whatsapp'

  @column()
  public consentGiven: boolean

  @column()
  public metaData: any

  @column()
  public assignedTeamId: number

  @column()
  public assignedVolunteerId: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
