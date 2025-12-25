import Broadcast from 'App/Models/Broadcast'
import User from 'App/Models/User'
import NotificationService from './NotificationService'
import EmailService from './EmailService'
import Logger from '@ioc:Adonis/Core/Logger'
import { DateTime } from 'luxon'

interface BroadcastData {
  title: string
  message: string
  priority?: 'normal' | 'high' | 'emergency'
  targetType: 'all' | 'organization' | 'role' | 'custom'
  targetFilter?: Record<string, any>
}

export default class BroadcastService {
  /**
   * Create a new broadcast
   */
  public static async create(data: BroadcastData, creatorId: number): Promise<Broadcast> {
    const broadcast = await Broadcast.create({
      createdById: creatorId,
      title: data.title,
      message: data.message,
      priority: data.priority || 'normal',
      targetType: data.targetType,
      targetFilter: data.targetFilter,
      status: 'draft',
      recipientCount: 0,
      deliveryCount: 0,
      errorCount: 0
    })

    // Calculate recipient count
    const recipientIds = await broadcast.getRecipients()
    await broadcast.updateRecipientCount(recipientIds.length)

    return broadcast
  }

  /**
   * Schedule a broadcast for later delivery
   */
  public static async schedule(broadcastId: number, scheduledAt: DateTime): Promise<Broadcast> {
    const broadcast = await Broadcast.findOrFail(broadcastId)

    if (broadcast.status !== 'draft') {
      throw new Error('Only draft broadcasts can be scheduled')
    }

    await broadcast.schedule(scheduledAt)
    return broadcast
  }

  /**
   * Send a broadcast immediately
   */
  public static async send(broadcastId: number): Promise<Broadcast> {
    const broadcast = await Broadcast.findOrFail(broadcastId)

    if (broadcast.status === 'sent') {
      throw new Error('Broadcast has already been sent')
    }

    await broadcast.markAsSending()

    try {
      // Get recipients
      const recipientIds = await broadcast.getRecipients()
      Logger.info(`Sending broadcast ${broadcastId} to ${recipientIds.length} recipients`)

      let deliveryCount = 0
      let errorCount = 0

      // Send notifications to all recipients
      for (const userId of recipientIds) {
        try {
          // Create in-app notification
          const notification = await NotificationService.create(userId, 'broadcast', {
            title: broadcast.title,
            message: broadcast.message,
            payload: {
              broadcastId: broadcast.id,
              message: broadcast.message
            },
            priority: this.mapPriorityToNotification(broadcast.priority),
            category: 'broadcast'
          })

          // For emergency broadcasts, send email regardless of preferences
          if (broadcast.priority === 'emergency') {
            try {
              const user = await User.find(userId)
              if (user && notification) {
                await EmailService.sendBroadcastEmail(user, broadcast)
                await notification.markEmailSent()
              }
            } catch (emailError) {
              Logger.error(`Failed to send emergency broadcast email to user ${userId}: %o`, emailError)
              errorCount++
            }
          }

          deliveryCount++
        } catch (error) {
          Logger.error(`Failed to send broadcast to user ${userId}: %o`, error)
          errorCount++
        }
      }

      // Mark as sent
      await broadcast.markAsSent(deliveryCount, errorCount)
      Logger.info(
        `Broadcast ${broadcastId} sent: ${deliveryCount} delivered, ${errorCount} errors`
      )

      return broadcast
    } catch (error) {
      Logger.error(`Failed to send broadcast ${broadcastId}: %o`, error)
      await broadcast.markAsFailed()
      throw error
    }
  }

  /**
   * Cancel a scheduled broadcast
   */
  public static async cancel(broadcastId: number): Promise<Broadcast> {
    const broadcast = await Broadcast.findOrFail(broadcastId)

    if (broadcast.status !== 'scheduled') {
      throw new Error('Only scheduled broadcasts can be cancelled')
    }

    broadcast.status = 'draft'
    broadcast.scheduledAt = null
    await broadcast.save()

    return broadcast
  }

  /**
   * Get delivery statistics for a broadcast
   */
  public static async getStats(broadcastId: number) {
    const broadcast = await Broadcast.findOrFail(broadcastId)

    return {
      id: broadcast.id,
      title: broadcast.title,
      status: broadcast.status,
      recipientCount: broadcast.recipientCount,
      deliveryCount: broadcast.deliveryCount,
      errorCount: broadcast.errorCount,
      deliveryRate:
        broadcast.recipientCount > 0
          ? (broadcast.deliveryCount / broadcast.recipientCount) * 100
          : 0,
      sentAt: broadcast.sentAt,
      scheduledAt: broadcast.scheduledAt
    }
  }

  /**
   * Process scheduled broadcasts (called by scheduler)
   */
  public static async processScheduled(): Promise<void> {
    const now = DateTime.now()

    const scheduledBroadcasts = await Broadcast.query()
      .where('status', 'scheduled')
      .where('scheduled_at', '<=', now.toSQL())

    Logger.info(`Processing ${scheduledBroadcasts.length} scheduled broadcasts`)

    for (const broadcast of scheduledBroadcasts) {
      try {
        await this.send(broadcast.id)
      } catch (error) {
        Logger.error(`Failed to send scheduled broadcast ${broadcast.id}: %o`, error)
      }
    }
  }

  /**
   * Map broadcast priority to notification priority
   */
  private static mapPriorityToNotification(
    priority: 'normal' | 'high' | 'emergency'
  ): 'low' | 'normal' | 'high' | 'urgent' {
    switch (priority) {
      case 'emergency':
        return 'urgent'
      case 'high':
        return 'high'
      default:
        return 'normal'
    }
  }
}
