import Notification from 'App/Models/Notification'
import NotificationPreference from 'App/Models/NotificationPreference'
import User from 'App/Models/User'
import EmailService from './EmailService'
import Logger from '@ioc:Adonis/Core/Logger'
import { DateTime } from 'luxon'

interface NotificationData {
  title?: string
  message?: string
  payload?: Record<string, any>
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  category?: string
  actionUrl?: string
  actionText?: string
  expiresAt?: DateTime
}

export default class NotificationService {
  /**
   * Create a notification for a user with preference checking
   */
  public static async create(
    userId: number,
    type: string,
    data: NotificationData
  ): Promise<Notification | null> {
    try {
      // Check user preferences
      const preferences = await NotificationPreference.getPreferencesForUser(userId, type)

      // Create in-app notification if enabled
      let notification: Notification | null = null
      if (preferences.shouldSendInApp()) {
        notification = await Notification.create({
          userId,
          type,
          title: data.title,
          payload: data.payload ? JSON.stringify(data.payload) : undefined,
          priority: data.priority || 'normal',
          category: data.category,
          actionUrl: data.actionUrl,
          actionText: data.actionText,
          expiresAt: data.expiresAt,
          read: false,
          sentViaEmail: false
        })
      }

      // Send email if enabled and instant delivery
      if (preferences.shouldSendEmail() && notification) {
        try {
          const user = await User.find(userId)
          if (user) {
            await EmailService.sendNotificationEmail(user, notification)
            await notification.markEmailSent()
          }
        } catch (emailError) {
          Logger.error('Failed to send notification email: %o', emailError)
          if (notification) {
            await notification.markEmailFailed(
              emailError instanceof Error ? emailError.message : 'Unknown error'
            )
          }
        }
      }

      return notification
    } catch (error) {
      Logger.error('Failed to create notification: %o', error)
      return null
    }
  }

  /**
   * Create notifications for multiple users
   */
  public static async createBulk(
    userIds: number[],
    type: string,
    data: NotificationData
  ): Promise<Notification[]> {
    const notifications: Notification[] = []

    for (const userId of userIds) {
      const notification = await this.create(userId, type, data)
      if (notification) {
        notifications.push(notification)
      }
    }

    return notifications
  }

  /**
   * Get unread notification count for a user
   */
  public static async getUnreadCount(userId: number): Promise<number> {
    return await Notification.query()
      .where('user_id', userId)
      .where('read', false)
      .whereNull('expires_at')
      .orWhere('expires_at', '>', DateTime.now().toSQL())
      .count('* as total')
      .then((result) => Number(result[0].$extras.total))
  }

  /**
   * Mark all notifications as read for a user
   */
  public static async markAllAsRead(userId: number): Promise<void> {
    await Notification.query().where('user_id', userId).where('read', false).update({ read: true })
  }

  /**
   * Delete expired notifications
   */
  public static async deleteExpired(): Promise<number> {
    const result = await Notification.query()
      .whereNotNull('expires_at')
      .where('expires_at', '<', DateTime.now().toSQL())
      .delete()

    return result[0] || 0
  }

  /**
   * Get notifications for a user with filtering
   */
  public static async getForUser(
    userId: number,
    filters: {
      category?: string
      priority?: string
      read?: boolean
      page?: number
      perPage?: number
    } = {}
  ) {
    const query = Notification.query()
      .where('user_id', userId)
      .orderBy('created_at', 'desc')

    if (filters.category) {
      query.where('category', filters.category)
    }

    if (filters.priority) {
      query.where('priority', filters.priority)
    }

    if (filters.read !== undefined) {
      query.where('read', filters.read)
    }

    // Exclude expired notifications
    query.where((q) => {
      q.whereNull('expires_at').orWhere('expires_at', '>', DateTime.now().toSQL())
    })

    if (filters.page && filters.perPage) {
      return await query.paginate(filters.page, filters.perPage)
    }

    return await query
  }
}
