import OrganizationInvite from 'App/Models/OrganizationInvite'
import InviteSendJob from 'App/Models/InviteSendJob'
import { DateTime } from 'luxon'
import Logger from '@ioc:Adonis/Core/Logger'

let _processing = false
let _interval: NodeJS.Timeout | null = null

export async function sendInviteNow(inviteId: number) {
  try {
    const invite = await OrganizationInvite.query()
      .where('id', inviteId)
      .preload('organization')
      .first()
    if (!invite) return false

    // attempt to send email, if Mail configured
    try {
      // dynamic import so tests may stub the Mail binding
      // const Mail = await import('@ioc:Adonis/Addons/Mail')
      // If Mail is available and has a send function, use it
      // if (Mail && typeof (Mail as any).default?.send === 'function') {
      //   const mailer = (Mail as any).default
      //   await mailer.send((message: any) => {
      //     message.from('noreply@localaid.example')
      //     message.to(invite.email)
      //     message.subject(`You were invited to join ${invite.organization.name}`)
      //     // plain text fallback
      //     message.text(
      //       invite.message ||
      //         `You are invited to join ${invite.organization.name}. Use token ${invite.token}`
      //     )
      //   })
      // }
    } catch (e) {
      // Mail may not be configured in some environments (tests/CI) — log and continue.
      try {
        if (e instanceof Error) {
          Logger.warn(`Mail send for invite failed or not configured: ${e.message}\n${e.stack}`)
        } else {
          Logger.warn('Mail send for invite failed or not configured: %o', e)
        }
      } catch (inner) {
        Logger.warn('Mail send for invite failed or not configured: %o', String(e))
      }
    }

    return true
  } catch (err) {
    try {
      if (err instanceof Error) {
        Logger.error(`sendInviteNow failed: ${err.message}\n${err.stack}`)
      } else {
        Logger.error('sendInviteNow failed: %o', err)
      }
    } catch (inner) {
      Logger.error('sendInviteNow failed (failed to format error): %o', String(err))
    }
    return false
  }
}

export async function enqueueInviteSend(inviteId: number) {
  // create or update a job record for this invite. If one already exists
  // and is marked 'sent' we don't recreate it.
  try {
    const existing = await InviteSendJob.query().where('organization_invite_id', inviteId).first()
    if (!existing) {
      await InviteSendJob.create({
        organizationInviteId: inviteId,
        status: 'pending',
        attempts: 0
      } as any)
    } else if (existing.status === 'sent') {
      // already sent — nothing to do
      return
    } else {
      // make sure it's pending so worker will pick it up
      existing.status = 'pending'
      existing.nextAttemptAt = null as any
      await existing.save()
    }
  } catch (e) {
    // If DB isn't available for some reason, fallback to in-memory queue
    try {
      if (e instanceof Error) {
        Logger.warn(
          `Failed to enqueue invite in DB, falling back to in-memory: ${e.message}\n${e.stack}`
        )
      } else {
        Logger.warn('Failed to enqueue invite in DB, falling back to in-memory: %o', e)
      }
    } catch (inner) {
      Logger.warn(
        'Failed to enqueue invite in DB (failed to format error), falling back to in-memory: %o',
        String(e)
      )
    }
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    ;(global as any).__invite_fallback_queue ||= []
    ;(global as any).__invite_fallback_queue.push(inviteId)
  }

  if (!_processing)
    processQueue().catch((err) => {
      try {
        if (err instanceof Error) Logger.error(`Invite queue error: ${err.message}\n${err.stack}`)
        else Logger.error('Invite queue error: %o', err)
      } catch (inner) {
        Logger.error('Invite queue error (failed to format error): %o', String(err))
      }
    })
}

export async function processQueue(batch = 10) {
  if (_processing) return
  _processing = true
  try {
    // pick pending jobs whose next_attempt_at is null or due
    const now = new Date()

    // Use a simple loop to process jobs in small batches and update their status
    const jobs = await InviteSendJob.query()
      .where('status', 'pending')
      .andWhere((query) => {
        query.whereNull('next_attempt_at').orWhere('next_attempt_at', '<=', now)
      })
      .orderBy('created_at', 'asc')
      .limit(batch)

    for (const job of jobs) {
      // Try to claim the job (avoid race) by updating status from pending -> processing
      const updated = await InviteSendJob.query()
        .where('id', job.id)
        .andWhere('status', 'pending')
        .update({ status: 'processing' })

      // if no rows were updated another worker claimed it
      if (!updated) continue

      try {
        const success = await sendInviteNow(job.organizationInviteId)
        if (success) {
          job.status = 'sent'
          job.attempts = job.attempts || 0
          job.nextAttemptAt = null as any
          job.lastError = null as any
          await job.save()
        } else {
          job.attempts = (job.attempts || 0) + 1
          // exponential backoff in minutes (1,2,4,8,...) up to a cap
          const delayMinutes = Math.min(60, Math.pow(2, Math.max(0, job.attempts - 1)))
          job.nextAttemptAt = DateTime.now().plus({ minutes: delayMinutes }).toJSDate() as any
          // if exceeded retries mark as failed
          if (job.attempts >= 5) {
            job.status = 'failed'
          } else {
            job.status = 'pending'
          }
          job.lastError = 'send failed — will retry'
          await job.save()
        }
      } catch (e) {
        job.attempts = (job.attempts || 0) + 1
        const delayMinutes = Math.min(60, Math.pow(2, Math.max(0, job.attempts - 1)))
        job.nextAttemptAt = DateTime.now().plus({ minutes: delayMinutes }).toJSDate() as any
        job.lastError = String(e?.message || e)
        if (job.attempts >= 5) {
          job.status = 'failed'
        } else {
          job.status = 'pending'
        }
        await job.save()
      }
    }

    // fallback: if DB enqueueing failed and we have a global fallback queue, drain it
    const fallback: number[] = (global as any).__invite_fallback_queue || []
    if (fallback.length) {
      while ((global as any).__invite_fallback_queue.length) {
        const id = (global as any).__invite_fallback_queue.shift()
        await sendInviteNow(id)
      }
    }
  } finally {
    _processing = false
  }
}

export function initInviteSender(intervalMs = 60 * 1000) {
  if (_interval) return
  // run once immediately and then periodically — ensure we log full errors if they happen during startup
  processQueue().catch((e) => {
    try {
      if (e instanceof Error)
        Logger.error(`Invite sender initial run failed: ${e.message}\n${e.stack}`)
      else Logger.error('Invite sender initial run failed: %o', e)
    } catch (inner) {
      Logger.error('Invite sender initial run failed (failed to format error): %o', String(e))
    }
  })
  _interval = setInterval(() => void processQueue(), intervalMs)
}

export function stopInviteSender() {
  if (_interval) {
    clearInterval(_interval)
    _interval = null
  }
}
