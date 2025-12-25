import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Broadcast from 'App/Models/Broadcast'
import BroadcastService from 'App/Services/BroadcastService'
import Logger from '@ioc:Adonis/Core/Logger'
import { DateTime } from 'luxon'

export default class BroadcastsController {
  /**
   * Check if user is admin
   */
  private async requireAdmin(auth: HttpContextContract['auth']) {
    await auth.use('api').authenticate()
    const user = auth.user!
    if (!user.isAdmin) {
      throw new Error('Admin access required')
    }
    return user
  }

  /**
   * List all broadcasts (admin only)
   */
  public async index({ auth, request, response }: HttpContextContract) {
    try {
      await this.requireAdmin(auth)

      const { page = 1, perPage = 20, status, priority } = request.qs()

      const query = Broadcast.query().orderBy('created_at', 'desc')

      if (status) {
        query.where('status', status)
      }

      if (priority) {
        query.where('priority', priority)
      }

      const broadcasts = await query.paginate(page, perPage)
      return response.ok(broadcasts)
    } catch (error) {
      Logger.error('List broadcasts error: %o', error)
      return response.unauthorized({ error: { message: error.message || 'Access denied' } })
    }
  }

  /**
   * Create a new broadcast (admin only)
   */
  public async store({ auth, request, response }: HttpContextContract) {
    try {
      const user = await this.requireAdmin(auth)

      const { title, message, priority, targetType, targetFilter } = request.only([
        'title',
        'message',
        'priority',
        'targetType',
        'targetFilter'
      ])

      if (!title || !message) {
        return response.badRequest({ error: { message: 'Title and message are required' } })
      }

      const broadcast = await BroadcastService.create(
        {
          title,
          message,
          priority: priority || 'normal',
          targetType: targetType || 'all',
          targetFilter
        },
        user.id
      )

      return response.created(broadcast)
    } catch (error) {
      Logger.error('Create broadcast error: %o', error)
      return response.unauthorized({ error: { message: error.message || 'Access denied' } })
    }
  }

  /**
   * Get a specific broadcast (admin only)
   */
  public async show({ auth, params, response }: HttpContextContract) {
    try {
      await this.requireAdmin(auth)

      const broadcast = await Broadcast.query()
        .where('id', params.id)
        .preload('creator')
        .firstOrFail()

      return response.ok(broadcast)
    } catch (error) {
      Logger.error('Get broadcast error: %o', error)
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({ error: { message: 'Broadcast not found' } })
      }
      return response.unauthorized({ error: { message: error.message || 'Access denied' } })
    }
  }

  /**
   * Update a draft broadcast (admin only)
   */
  public async update({ auth, params, request, response }: HttpContextContract) {
    try {
      await this.requireAdmin(auth)

      const broadcast = await Broadcast.findOrFail(params.id)

      if (broadcast.status !== 'draft') {
        return response.badRequest({ error: { message: 'Only draft broadcasts can be updated' } })
      }

      const { title, message, priority, targetType, targetFilter } = request.only([
        'title',
        'message',
        'priority',
        'targetType',
        'targetFilter'
      ])

      if (title) broadcast.title = title
      if (message) broadcast.message = message
      if (priority) broadcast.priority = priority
      if (targetType) broadcast.targetType = targetType
      if (targetFilter !== undefined) broadcast.targetFilter = targetFilter

      await broadcast.save()

      // Recalculate recipient count
      const recipientIds = await broadcast.getRecipients()
      await broadcast.updateRecipientCount(recipientIds.length)

      return response.ok(broadcast)
    } catch (error) {
      Logger.error('Update broadcast error: %o', error)
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({ error: { message: 'Broadcast not found' } })
      }
      return response.unauthorized({ error: { message: error.message || 'Access denied' } })
    }
  }

  /**
   * Send a broadcast immediately (admin only)
   */
  public async send({ auth, params, response }: HttpContextContract) {
    try {
      await this.requireAdmin(auth)

      const broadcast = await BroadcastService.send(params.id)
      return response.ok(broadcast)
    } catch (error) {
      Logger.error('Send broadcast error: %o', error)
      return response.badRequest({ error: { message: error.message || 'Failed to send broadcast' } })
    }
  }

  /**
   * Schedule a broadcast for later (admin only)
   */
  public async schedule({ auth, params, request, response }: HttpContextContract) {
    try {
      await this.requireAdmin(auth)

      const { scheduledAt } = request.only(['scheduledAt'])

      if (!scheduledAt) {
        return response.badRequest({ error: { message: 'scheduledAt is required' } })
      }

      const scheduledTime = DateTime.fromISO(scheduledAt)
      if (!scheduledTime.isValid) {
        return response.badRequest({ error: { message: 'Invalid scheduledAt format' } })
      }

      if (scheduledTime <= DateTime.now()) {
        return response.badRequest({ error: { message: 'scheduledAt must be in the future' } })
      }

      const broadcast = await BroadcastService.schedule(params.id, scheduledTime)
      return response.ok(broadcast)
    } catch (error) {
      Logger.error('Schedule broadcast error: %o', error)
      return response.badRequest({
        error: { message: error.message || 'Failed to schedule broadcast' }
      })
    }
  }

  /**
   * Cancel a scheduled broadcast (admin only)
   */
  public async cancel({ auth, params, response }: HttpContextContract) {
    try {
      await this.requireAdmin(auth)

      const broadcast = await BroadcastService.cancel(params.id)
      return response.ok(broadcast)
    } catch (error) {
      Logger.error('Cancel broadcast error: %o', error)
      return response.badRequest({
        error: { message: error.message || 'Failed to cancel broadcast' }
      })
    }
  }

  /**
   * Get broadcast delivery statistics (admin only)
   */
  public async stats({ auth, params, response }: HttpContextContract) {
    try {
      await this.requireAdmin(auth)

      const stats = await BroadcastService.getStats(params.id)
      return response.ok(stats)
    } catch (error) {
      Logger.error('Get broadcast stats error: %o', error)
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({ error: { message: 'Broadcast not found' } })
      }
      return response.unauthorized({ error: { message: error.message || 'Access denied' } })
    }
  }
}
