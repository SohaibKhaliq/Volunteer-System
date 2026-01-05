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
    
    // Data Enrichment: Collect IDs
    const resourceIds = new Set<number>()
    const eventIds = new Set<number>()
    const userIds = new Set<number>()
    const orgIds = new Set<number>()
    const assignmentIds = new Set<number>()

    const data = notifications.data || notifications
    const items = Array.isArray(data) ? data : []

    items.forEach((n: any) => {
      let p = n.payload
      if (typeof p === 'string') {
        try { p = JSON.parse(p) } catch (e) {}
      }
      if (p) {
        if (p.resourceId) resourceIds.add(Number(p.resourceId))
        if (p.eventId) eventIds.add(Number(p.eventId))
        if (p.userId) userIds.add(Number(p.userId))
        if (p.organizationId) orgIds.add(Number(p.organizationId))
        if (p.assignmentId) assignmentIds.add(Number(p.assignmentId))
      }
    })

    // Bulk Fetch Names
    const resources = resourceIds.size > 0 ? await import('App/Models/Resource').then(m => m.default.query().whereIn('id', Array.from(resourceIds)).select('id', 'name')) : []
    const events = eventIds.size > 0 ? await import('App/Models/Event').then(m => m.default.query().whereIn('id', Array.from(eventIds)).select('id', 'title')) : []
    const users = userIds.size > 0 ? await import('App/Models/User').then(m => m.default.query().whereIn('id', Array.from(userIds)).select('id', 'first_name', 'last_name')) : []
    const orgs = orgIds.size > 0 ? await import('App/Models/Organization').then(m => m.default.query().whereIn('id', Array.from(orgIds)).select('id', 'name')) : []

    // Map for quick lookup
    const resourceMap = new Map(resources.map(r => [r.id, r.name]))
    const eventMap = new Map(events.map(e => [e.id, e.title]))
    const userMap = new Map(users.map(u => [u.id, `${u.firstName} ${u.lastName}`]))
    const orgMap = new Map(orgs.map(o => [o.id, o.name]))

    // Attach enriched data
    const enriched = items.map((n: any) => {
      const json = n.toJSON ? n.toJSON() : n
      let p = json.payload
      if (typeof p === 'string') {
        try { p = JSON.parse(p) } catch (e) {}
      }
      
      const enrichedPayload = { ...p }
      
      if (p?.resourceId && resourceMap.has(Number(p.resourceId))) enrichedPayload.resourceName = resourceMap.get(Number(p.resourceId))
      if (p?.eventId && eventMap.has(Number(p.eventId))) enrichedPayload.eventName = eventMap.get(Number(p.eventId))
      if (p?.userId && userMap.has(Number(p.userId))) enrichedPayload.userName = userMap.get(Number(p.userId))
      if (p?.organizationId && orgMap.has(Number(p.organizationId))) enrichedPayload.organizationName = orgMap.get(Number(p.organizationId))

      return { ...json, payload: enrichedPayload }
    })

    // Maintain pagination structure
    if (notifications.toJSON) {
      const result = notifications.toJSON()
      result.data = enriched
      return response.ok(result)
    }

    return response.ok(enriched)
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

    await Notification.query().whereIn('id', ids).where('user_id', user.id).update({ read: true })

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
