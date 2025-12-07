import ScheduledJob from 'App/Models/ScheduledJob'
import Communication from 'App/Models/Communication'
import Notification from 'App/Models/Notification'
import Logger from '@ioc:Adonis/Core/Logger'
import { DateTime } from 'luxon'

let _interval: NodeJS.Timeout | null = null

export async function processDue() {
  try {
    // Use a JS Date for DB comparisons (MySQL rejects ISO strings with timezone offsets)
    // DateTime.local().toISO() yields values like '2025-12-07T15:15:57.464+05:00' which MySQL
    // considers an invalid datetime in queries. Use toJSDate() so the driver formats
    // it appropriately for the DB backend.
    const now = DateTime.local().toJSDate()
    const due = await ScheduledJob.query()
      .where('status', 'Scheduled')
      .andWhere('run_at', '<=', now)
    if (!due.length) return
    Logger.info(`Found ${due.length} scheduled jobs due`)

    for (const job of due) {
      try {
        // Try to atomically claim the job: update status from 'Scheduled' -> 'Running'
        const updated = await ScheduledJob.query()
          .where('id', job.id)
          .andWhere('status', 'Scheduled')
          .andWhere('run_at', '<=', now)
          .update({ status: 'Running' })

        // If another instance claimed it (no rows updated), skip processing
        if (!updated) {
          Logger.info(`Job ${job.id} already claimed by another worker, skipping`)
          continue
        }
        // reload job to reflect claimed status
        await job.refresh()

        // enforce max attempts: avoid infinite retries
        const maxAttempts = 5
        if ((job.attempts || 0) >= maxAttempts) {
          job.status = 'Failed'
          job.lastError = `Exceeded max attempts (${maxAttempts})`
          await job.save()
          continue
        }

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
        // On error, increment attempts and set next runAt with exponential backoff
        try {
          job.attempts = (job.attempts || 0) + 1
          const backoffMinutes = Math.min(60, Math.pow(2, job.attempts || 1))
          job.runAt = DateTime.local().plus({ minutes: backoffMinutes })
          job.status = 'Scheduled'
          job.lastError = String(err)
          job.lastRunAt = DateTime.local()
          await job.save()
        } catch (saveErr) {
          Logger.error(`Failed to update job after error ${job.id}: ${String(saveErr)}`)
        }
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
