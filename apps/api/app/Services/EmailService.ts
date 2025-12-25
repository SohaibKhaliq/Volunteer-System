import Mail from '@ioc:Adonis/Addons/Mail'
import User from 'App/Models/User'
import Notification from 'App/Models/Notification'
import Broadcast from 'App/Models/Broadcast'
import SystemSetting from 'App/Models/SystemSetting'
import Logger from '@ioc:Adonis/Core/Logger'

export default class EmailService {

  /**
   * Send notification email to a user
   */
  public static async sendNotificationEmail(
    user: User,
    notification: Notification
  ): Promise<void> {
    try {
      const subject = notification.title || `New notification: ${notification.type}`
      const message = this.getNotificationMessage(notification)

      await Mail.send((message) => {
        message
          .to(user.email)
          .subject(subject)
          .htmlView('emails/notification', {
            user,
            notification,
            message,
            actionUrl: notification.actionUrl,
            actionText: notification.actionText
          })
      })

      Logger.info(`Notification email sent to ${user.email}`)
    } catch (error) {
      Logger.error('Failed to send notification email: %o', error)
      throw error
    }
  }

  /**
   * Send broadcast email to a user
   */
  public static async sendBroadcastEmail(user: User, broadcast: Broadcast): Promise<void> {
    try {
      await Mail.send((message) => {
        message
          .to(user.email)
          .subject(broadcast.title)
          .htmlView('emails/broadcast', {
            user,
            broadcast,
            priority: broadcast.priority
          })
      })

      Logger.info(`Broadcast email sent to ${user.email}`)
    } catch (error) {
      Logger.error('Failed to send broadcast email: %o', error)
      throw error
    }
  }

  /**
   * Render email template with data
   */
  public static async renderTemplate(
    templateKey: string,
    data: Record<string, any>
  ): Promise<{ subject: string; body: string }> {
    // Get template from system settings
    const storedTemplates = await SystemSetting.findBy('key', 'notification_templates')
    let templates: Record<string, any> = {}

    if (storedTemplates?.value) {
      try {
        templates = JSON.parse(storedTemplates.value)
      } catch {
        // Use defaults if parse fails
      }
    }

    const template = templates[templateKey]
    if (!template) {
      throw new Error(`Template ${templateKey} not found`)
    }

    // Simple template variable substitution
    const subject = this.replaceVariables(template.subject, data)
    const body = this.replaceVariables(template.body, data)

    return { subject, body }
  }

  /**
   * Send transactional email
   */
  public static async sendTransactional(
    to: string,
    subject: string,
    body: string
  ): Promise<void> {
    try {
      await Mail.send((message) => {
        message.to(to).subject(subject).html(body)
      })

      Logger.info(`Transactional email sent to ${to}`)
    } catch (error) {
      Logger.error('Failed to send transactional email: %o', error)
      throw error
    }
  }

  /**
   * Get notification message from payload
   */
  private static getNotificationMessage(notification: Notification): string {
    if (!notification.payload) {
      return notification.type
    }

    try {
      const payload = JSON.parse(notification.payload)
      return payload.message || payload.description || notification.type
    } catch {
      return notification.payload
    }
  }

  /**
   * Replace template variables with data
   */
  private static replaceVariables(template: string, data: Record<string, any>): string {
    let result = template

    // Replace simple variables
    for (const [key, value] of Object.entries(data)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value))
    }

    // Handle {{#if variable}}...{{/if}} blocks
    result = result.replace(/{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g, (match, varName, content) => {
      return data[varName] ? content : ''
    })

    return result
  }
}
