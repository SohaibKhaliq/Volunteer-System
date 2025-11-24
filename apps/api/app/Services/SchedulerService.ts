import ScheduledJob from 'App/Models/ScheduledJob'
import Communication from 'App/Models/Communication'
import Notification from 'App/Models/Notification'
import Logger from '@ioc:Adonis/Core/Logger'
import { DateTime } from 'luxon'

let _interval: NodeJS.Timeout | null = null

async function processDue() {
  try {
    const now = DateTime.local().toISO()
    const due = await ScheduledJob.query()
      .where('status', 'Scheduled')
      .andWhere('run_at', '<=', now)
    if (!due.length) return
    Logger.info(`Found ${due.length} scheduled jobs due`)

    for (const job of due) {
      try {
        job.status = 'Running'
        await job.save()

        const type = (job.type || '').toLowerCase()
        const payload = job.payload ? JSON.parse(job.payload) : {}

        if (type === 'reminder') {
          // payload: { userId, message }
          if (payload.userId && payload.message) {
            await Notification.create({
              userId: payload.userId,
              type: 'reminder',
              payload: JSON.stringify({ message: payload.message, jobId: job.id })
            })
          }
        } else if (type === 'communication') {
          // create a Communication record so CommunicationSender will pick it up
          await Communication.create({
            subject: payload.subject || job.name,
            content: payload.content || payload.message || '',
            type: payload.type || 'Email',
            status: payload.status || 'Scheduled',
            sendAt: payload.sendAt || job.runAt,
            targetAudience: payload.targetAudience || payload.target_audience || null
          })
        } else {
          Logger.warn(`Unknown scheduled job type: ${job.type}`)
        }

        job.status = 'Completed'
        job.attempts = (job.attempts || 0) + 1
        job.lastRunAt = DateTime.local()
        job.lastError = undefined
        await job.save()
      } catch (err) {
        Logger.error(`Error processing job ${job.id}: ${String(err)}`)
        job.status = 'Failed'
        job.attempts = (job.attempts || 0) + 1
        job.lastError = String(err)
        job.lastRunAt = DateTime.local()
        await job.save()
      }
    }
  } catch (err) {
    Logger.error('Error in scheduler: ' + String(err))
  }
}

export function initScheduler() {
  if (_interval) return
  processDue()
  _interval = setInterval(processDue, 60 * 1000)
}

export function stopScheduler() {
  if (_interval) {
    clearInterval(_interval)
    _interval = null
  }
}
