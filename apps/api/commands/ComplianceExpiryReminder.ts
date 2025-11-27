import { BaseCommand } from '@adonisjs/core/build/standalone'
import ComplianceDocument from 'App/Models/ComplianceDocument'
import Notification from 'App/Models/Notification'
import { DateTime } from 'luxon'

export default class ComplianceExpiryReminder extends BaseCommand {
  public static commandName = 'reminder:compliance'
  public static description = 'Detect documents nearing expiry and notify users'

  public async run() {
    const warnDate = DateTime.now().plus({ days: 14 }).toISO()
    const docs = await ComplianceDocument.query()
      .whereNotNull('expires_at')
      .where('expires_at', '<=', warnDate)
      .limit(200)

    if (!docs.length) return this.logger.info('No upcoming expirations')

    for (const doc of docs) {
      await Notification.create({
        userId: doc.userId,
        type: 'compliance_expiry',
        payload: JSON.stringify({ docId: doc.id, expiresAt: doc.expiresAt })
      })
    }

    this.logger.info(`Notified ${docs.length} users about upcoming compliance expiry`)
  }
}
