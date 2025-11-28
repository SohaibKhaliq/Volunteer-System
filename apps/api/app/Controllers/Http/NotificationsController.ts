import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Notification from 'App/Models/Notification'

export default class NotificationsController {
  public async index({ auth, request, response }: HttpContextContract) {
    // If the authenticated user is an admin, return global notifications
    // otherwise scope to the user's notifications only for privacy.
    const isAdmin = !!(auth.user as any)?.isAdmin

    const q = Notification.query().orderBy('created_at', 'desc')
    if (!isAdmin) {
      q.where('user_id', (auth.user as any).id)
    }

    const page = Number(request.qs().page || 0)
    const perPage = Number(request.qs().perPage || 20)

    // If page is provided, return a paginated response; otherwise return recent items
    if (page && page > 0) {
      const pag = await q.paginate(page, perPage)
      return response.ok(pag)
    }

    const items = await q.limit(100)
    return response.ok(items)
  }

  public async stream({ response }: HttpContextContract) {
    // Server no longer supports SSE streams for notifications. We use Socket.IO
    // for realtime delivery — clients should connect with socket.io-client.
    return response
      .status(501)
      .json({ error: 'SSE stream removed. Use Socket.IO for realtime notifications.' })
  }

  public async markRead({ params, response }: HttpContextContract) {
    const id = params.id
    const notif = await Notification.find(id)
    if (!notif) return response.notFound()
    notif.merge({ read: true })
    await notif.save()
    return response.ok(notif)
  }

  public async markUnread({ params, response }: HttpContextContract) {
    const id = params.id
    const notif = await Notification.find(id)
    if (!notif) return response.notFound()
    notif.merge({ read: false })
    await notif.save()
    return response.ok(notif)
  }
}
