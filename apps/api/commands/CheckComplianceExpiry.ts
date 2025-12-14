import { BaseCommand } from '@adonisjs/core/build/standalone'
import ComplianceDocument from 'App/Models/ComplianceDocument'
import BackgroundCheck from 'App/Models/BackgroundCheck'
import Notification from 'App/Models/Notification'
import ComplianceService from 'App/Services/ComplianceService'
import Logger from '@ioc:Adonis/Core/Logger'
import { DateTime } from 'luxon'

export default class CheckComplianceExpiry extends BaseCommand {
  public static commandName = 'compliance:check-expiry'
  public static description = 'Check for expiring compliance documents and send notifications'

  public static settings = {
    loadApp: true,
    stayAlive: false
  }

  public async run() {
    this.logger.info('Starting compliance expiry check...')

    try {
      // Check compliance documents expiring in next 30 days
      const expiringDocuments = await ComplianceDocument.query()
        .whereNotNull('expires_at')
        .where('expires_at', '>', DateTime.now().toSQL())
        .where('expires_at', '<=', DateTime.now().plus({ days: 30 }).toSQL())
        .where('status', '!=', 'expired')
        .preload('user')

      this.logger.info(`Found ${expiringDocuments.length} documents expiring soon`)

      for (const doc of expiringDocuments) {
        const daysUntilExpiry = ComplianceService.getDaysUntilExpiry(
          doc.expiresAt!.toJSDate()
        )

        // Update status if expiring soon
        if (ComplianceService.isExpiringSoon(doc.expiresAt!.toJSDate(), 30)) {
          doc.status = 'expiring'
          await doc.save()
        }

        // Send notification to user
        await this.sendExpiryNotification(
          doc.userId,
          doc.docType,
          daysUntilExpiry,
          doc.id
        )

        this.logger.info(
          `Notified user ${doc.userId} about ${doc.docType} expiring in ${daysUntilExpiry} days`
        )
      }

      // Check expired documents
      const expiredDocuments = await ComplianceDocument.query()
        .whereNotNull('expires_at')
        .where('expires_at', '<=', DateTime.now().toSQL())
        .where('status', '!=', 'expired')

      this.logger.info(`Found ${expiredDocuments.length} expired documents`)

      for (const doc of expiredDocuments) {
        doc.status = 'expired'
        await doc.save()

        await this.sendExpiredNotification(doc.userId, doc.docType, doc.id)

        this.logger.info(`Marked ${doc.docType} for user ${doc.userId} as expired`)
      }

      // Check background checks
      const pendingChecks = await BackgroundCheck.query()
        .where('status', 'pending')
        .where('requested_at', '<', DateTime.now().minus({ days: 14 }).toSQL())

      this.logger.info(`Found ${pendingChecks.length} overdue background checks`)

      for (const check of pendingChecks) {
        await this.sendOverdueCheckNotification(check.userId, check.id)
      }

      this.logger.success(
        `Compliance check complete: ${expiringDocuments.length} expiring, ${expiredDocuments.length} expired, ${pendingChecks.length} overdue`
      )
    } catch (error) {
      this.logger.error('Error during compliance check:', error)
      throw error
    }
  }

  private async sendExpiryNotification(
    userId: number,
    docType: string,
    daysUntilExpiry: number,
    docId: number
  ): Promise<void> {
    try {
      await Notification.create({
        userId,
        type: 'compliance.expiring',
        payload: JSON.stringify({
          docType,
          daysUntilExpiry,
          docId,
          message: `Your ${this.formatDocType(docType)} will expire in ${daysUntilExpiry} days. Please renew it as soon as possible.`,
          priority: daysUntilExpiry <= 7 ? 'high' : 'medium'
        }),
        read: false
      })
    } catch (error) {
      Logger.error(`Failed to send expiry notification to user ${userId}:`, error)
    }
  }

  private async sendExpiredNotification(
    userId: number,
    docType: string,
    docId: number
  ): Promise<void> {
    try {
      await Notification.create({
        userId,
        type: 'compliance.expired',
        payload: JSON.stringify({
          docType,
          docId,
          message: `Your ${this.formatDocType(docType)} has expired. You must renew it immediately to continue volunteering.`,
          priority: 'urgent'
        }),
        read: false
      })
    } catch (error) {
      Logger.error(`Failed to send expired notification to user ${userId}:`, error)
    }
  }

  private async sendOverdueCheckNotification(
    userId: number,
    checkId: number
  ): Promise<void> {
    try {
      await Notification.create({
        userId,
        type: 'background_check.overdue',
        payload: JSON.stringify({
          checkId,
          message: 'Your background check has been pending for over 14 days. Please follow up with the administrator.',
          priority: 'medium'
        }),
        read: false
      })
    } catch (error) {
      Logger.error(`Failed to send overdue check notification to user ${userId}:`, error)
    }
  }

  private formatDocType(docType: string): string {
    const types: Record<string, string> = {
      'wwcc': 'Working with Children Check',
      'police_check': 'National Police Check',
      'first_aid': 'First Aid Certificate',
      'insurance': 'Insurance Certificate'
    }
    return types[docType] || docType
  }
}
