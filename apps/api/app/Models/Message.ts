import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@ioc:Adonis/Lucid/Orm'
import type { BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import ChatRoom from 'App/Models/ChatRoom'
import User from 'App/Models/User'

export default class Message extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public roomId: number

  @column()
  public senderId: number

  @column()
  public content: string

  @column()
  public type: 'text' | 'system' | 'return_request'

  @column({
    prepare: (value: any) => JSON.stringify(value),
    consume: (value: any) => (typeof value === 'string' ? JSON.parse(value) : value),
  })
  public metadata: any

  @column.dateTime()
  public readAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => ChatRoom, {
    foreignKey: 'roomId',
  })
  public room: BelongsTo<typeof ChatRoom>

  @belongsTo(() => User, {
    foreignKey: 'senderId',
  })
  public sender: BelongsTo<typeof User>
}
