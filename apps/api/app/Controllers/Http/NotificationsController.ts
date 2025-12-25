import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Notification from 'App/Models/Notification'
import NotificationService from 'App/Services/NotificationService'

export default class NotificationsController {
  /**
   * List notifications for the authenticated user
   */
  public async index({ auth, request, response }: HttpContextContract) {
    const user = auth.user!
    const { page = 1, perPage = 20, category, priority, read } = request.qs()

    const filters: any = { page, perPage }
    if (category) filters.category = category
    if (priority) filters.priority = priority
    if (read !== undefined) filters.read = read === 'true'

    const notifications = await NotificationService.getForUser(user.id, filters)
    return response.ok(notifications)
  }

  /**
   * Get unread notification count
   */
  public async unreadCount({ auth, response }: HttpContextContract) {
    const user = auth.user!
    const count = await NotificationService.getUnreadCount(user.id)
    return response.ok({ count })
  }

  /**
   * Mark a notification as read
   */
  public async markRead({ params, auth, response }: HttpContextContract) {
    const user = auth.user!
    const notification = await Notification.query()
      .where('id', params.id)
      .where('user_id', user.id)
      .firstOrFail()

    await notification.markAsRead()
    return response.ok(notification)
  }

  /**
   * Mark a notification as unread
   */
  public async markUnread({ params, auth, response }: HttpContextContract) {
    const user = auth.user!
    const notification = await Notification.query()
      .where('id', params.id)
      .where('user_id', user.id)
      .firstOrFail()

    await notification.markAsUnread()
    return response.ok(notification)
  }

  /**
   * Mark all notifications as read
   */
  public async markAllRead({ auth, response }: HttpContextContract) {
    const user = auth.user!
    await NotificationService.markAllAsRead(user.id)
    return response.ok({ message: 'All notifications marked as read' })
  }

  /**
   * Bulk mark notifications as read
   */
  public async bulkMarkRead({ request, auth, response }: HttpContextContract) {
    const user = auth.user!
    const { ids } = request.only(['ids'])

    if (!Array.isArray(ids) || ids.length === 0) {
      return response.badRequest({ message: 'ids must be a non-empty array' })
    }

    await Notification.query()
      .whereIn('id', ids)
      .where('user_id', user.id)
      .update({ read: true })

    return response.ok({ message: `${ids.length} notifications marked as read` })
  }

  /**
   * Delete a notification
   */
  public async destroy({ params, auth, response }: HttpContextContract) {
    const user = auth.user!
    const notification = await Notification.query()
      .where('id', params.id)
      .where('user_id', user.id)
      .firstOrFail()

    await notification.delete()
    return response.noContent()
  }

  /**
   * SSE stream endpoint (deprecated, returns 501)
   */
  public async stream({ response }: HttpContextContract) {
    return response
      .status(501)
      .json({ error: 'SSE stream removed. Use Socket.IO for realtime notifications.' })
  }
}

