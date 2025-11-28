import { BaseModel, column, belongsTo, BelongsTo, afterCreate } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import User from './User'

export default class Notification extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public userId: number

  @belongsTo(() => User)
  public user: BelongsTo<typeof User>

  @column()
  public type: string

  @column()
  public payload?: string

  @column()
  public read?: boolean

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}

// Send new notifications to the local socket server via an internal HTTP hook.
// This avoids using Redis pub/sub for notification delivery.
@afterCreate()
export async function publishNotification(notification: Notification) {
  try {
    // internal socket server endpoint (socket server must be running)
    const SOCKET_INTERNAL_URL = process.env.SOCKET_INTERNAL_URL || `http://127.0.0.1:${process.env.SOCKET_PORT || 4001}/_internal/notify`
    const SECRET = process.env.SOCKET_INTERNAL_SECRET || ''

    const body = JSON.stringify({
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      payload: notification.payload,
      read: notification.read,
      createdAt: notification.createdAt
    })

    // Use global fetch (Node 18+) to POST to the socket server internal endpoint
    // It's best-effort — don't fail the main request if the socket server is unavailable
    await fetch(SOCKET_INTERNAL_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-internal-secret': SECRET
      },
      body
    })
  } catch (e) {
    // best-effort — don't block creation on publish errors
    // eslint-disable-next-line no-console
    console.warn('Failed to send notification to socket server', e)
  }
}
