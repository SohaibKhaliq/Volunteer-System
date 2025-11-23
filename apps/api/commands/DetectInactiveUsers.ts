import { BaseCommand } from '@adonisjs/core/build/standalone'
import User from 'App/Models/User'
import EngagementCampaign from 'App/Models/EngagementCampaign'
import Notification from 'App/Models/Notification'
import { DateTime } from 'luxon'

export default class DetectInactiveUsers extends BaseCommand {
  public static commandName = 'detect:inactive'
  public static description = 'Detect inactive volunteer users and create re-engagement campaign'

  public async run() {
    this.logger.info('Looking for inactive users...')

    const cutoff = DateTime.now().minus({ days: 30 }).toISO()
    const users = await User.query().where('last_active_at', '<', cutoff).limit(100)

    if (users.length === 0) {
      this.logger.info('No inactive users found')
      return
    }

    const campaign = await EngagementCampaign.create({
      name: `Re-engage ${users.length} users`,
      message:
        'We miss you — many local events would benefit from your help. Click to see opportunities',
      targets: users.map((u) => u.id),
      sent: false
    })

    for (const user of users) {
      await Notification.create({
        userId: user.id,
        type: 'reengagement',
        payload: JSON.stringify({ campaignId: campaign.id })
      })
    }

    this.logger.info(`Created campaign ${campaign.id} targeting ${users.length} users`)
  }
}
