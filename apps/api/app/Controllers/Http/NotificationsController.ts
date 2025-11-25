import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Notification from 'App/Models/Notification'

export default class NotificationsController {
  public async index({ response }: HttpContextContract) {
    const items = await Notification.query().orderBy('created_at', 'desc').limit(100)
    return response.ok(items)
  }

  public async markRead({ params, response }: HttpContextContract) {
    const id = params.id
    const notif = await Notification.find(id)
    if (!notif) return response.notFound()
    notif.merge({ read: true })
    await notif.save()
    return response.ok(notif)
  }
}
