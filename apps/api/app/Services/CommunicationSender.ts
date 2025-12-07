import Communication from 'App/Models/Communication'
import User from 'App/Models/User'
import Notification from 'App/Models/Notification'
import CommunicationLog from 'App/Models/CommunicationLog'
// import Mail from '@ioc:Adonis/Addons/Mail'
import Logger from '@ioc:Adonis/Core/Logger'
import { DateTime } from 'luxon'

let _interval: NodeJS.Timeout | null = null

export async function processDue() {
  try {
    const now = DateTime.local().toISO()
    const due = await Communication.query()
      .where('status', 'Scheduled')
      .andWhere('send_at', '<=', now)
    if (!due.length) return
    Logger.info(`Found ${due.length} scheduled communications due`)

    for (const comm of due) {
      try {
        // Try to atomically claim this communication (Scheduled -> Running)
        const claimed = await Communication.query()
          .where('id', comm.id)
          .andWhere('status', 'Scheduled')
          .andWhere('send_at', '<=', now)
          .update({ status: 'Running' })

        if (!claimed) {
          Logger.info(`Communication ${comm.id} already claimed by another sender, skipping`)
          continue
        }
        // refresh instance to reflect claimed status
        await comm.refresh()

        // Determine recipients. Support several formats for targetAudience:
        // - null/empty or 'all' => all active users
        // - comma-separated emails string
        // - JSON object like { "roles": ["admin","volunteer"] } or { "eventId": 12 }
        let recipients: string[] = []
        const ta = comm.targetAudience
        if (!ta || ta === 'all') {
          const users = await User.query().select('email').where('is_disabled', false)
          recipients = users.map((u) => u.email).filter(Boolean)
        } else {
          // try parse JSON
          try {
            const parsed = JSON.parse(ta)
            // roles -> query users with those roles (simple pivot lookup)
            if (parsed.roles && Array.isArray(parsed.roles) && parsed.roles.length) {
              const roles = parsed.roles
              const users = await User.query()
                .whereHas('roles', (builder: any) => {
                  builder.whereIn('name', roles)
                })
                .select('email')
              recipients = users.map((u) => u.email).filter(Boolean)
            } else if (parsed.eventId) {
              // event participants: find assignments for tasks under event or volunteer_hours entries
              const eventId = parsed.eventId
              // try volunteer_hours
              const hours = await (await import('App/Models/VolunteerHour')).default
                .query()
                .where('event_id', eventId)
                .select('user_id')
              const userIds = hours.map((h: any) => h.userId)
              if (userIds.length) {
                const users = await User.query().whereIn('id', userIds).select('email')
                recipients = users.map((u) => u.email).filter(Boolean)
              }
            }
          } catch (e) {
            // fallback: comma separated list
            const str = String(ta || '')
            if (str.includes(',')) recipients = str.split(',').map((s) => s.trim())
            else recipients = [str]
          }
        }

        if (comm.type && comm.type.toLowerCase() === 'email') {
          for (const to of recipients) {
            // create a log record for this recipient
            const user = await User.query().where('email', to).first()
            const log = await CommunicationLog.create({
              communicationId: comm.id,
              recipient: to,
              userId: user ? user.id : undefined,
              status: 'Pending',
              attempts: 0
            })

            try {
              // Send email (plain text). If Mail is not configured this will throw.
              // await Mail.send((message) => {
              //   message.from(fromAddr)
              //   message.to(to)
              //   message.subject(comm.subject || '')
              //   message.text(comm.content || '')
              // })

              // mark log success
              log.status = 'Success'
              log.attempts = (log.attempts || 0) + 1
              log.error = undefined
              log.lastAttemptAt = DateTime.local()
              await log.save()

              // create in-app notification for user if exists
              if (user) {
                await Notification.create({
                  userId: user.id,
                  type: 'communication',
                  payload: JSON.stringify({ communicationId: comm.id, subject: comm.subject })
                })
              }
            } catch (e) {
              Logger.error('Failed to send email to ' + to + ': ' + String(e))
              log.status = 'Failed'
              log.attempts = (log.attempts || 0) + 1
              log.error = String(e)
              log.lastAttemptAt = DateTime.local()
              await log.save()
            }
          }
        } else {
          Logger.info(`Skipping non-email communication id=${comm.id} type=${comm.type}`)
        }

        comm.status = 'Sent'
        comm.sentAt = DateTime.local()
        await comm.save()
        Logger.info(`Communication ${comm.id} marked as Sent`)
      } catch (err) {
        Logger.error('Error processing communication ' + comm.id + ': ' + String(err))
      }
    }
  } catch (err) {
    Logger.error('Error in communication sender: ' + String(err))
  }
}

export function initCommunicationSender() {
  if (_interval) return
  // run immediately and then every 60 seconds
  processDue()
  _interval = setInterval(processDue, 60 * 1000)
}

export function stopCommunicationSender() {
  if (_interval) {
    clearInterval(_interval)
    _interval = null
  }
}
