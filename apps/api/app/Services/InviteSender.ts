import OrganizationInvite from 'App/Models/OrganizationInvite'
import Logger from '@ioc:Adonis/Core/Logger'

let _queue: number[] = []
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
      const Mail = await import('@ioc:Adonis/Addons/Mail')
      // If Mail is available and has a send function, use it
      if (Mail && typeof (Mail as any).default?.send === 'function') {
        const mailer = (Mail as any).default
        await mailer.send((message: any) => {
          message.from('noreply@localaid.example')
          message.to(invite.email)
          message.subject(`You were invited to join ${invite.organization.name}`)
          // plain text fallback
          message.text(
            invite.message ||
              `You are invited to join ${invite.organization.name}. Use token ${invite.token}`
          )
        })
      }
    } catch (e) {
      // Mail may not be configured in some environments (tests/CI) — log and continue
      Logger.warn('Mail send for invite failed or not configured: %o', String(e))
    }

    return true
  } catch (err) {
    Logger.error('sendInviteNow failed: %o', err)
    return false
  }
}

export function enqueueInviteSend(inviteId: number) {
  _queue.push(inviteId)
  if (!_processing) processQueue().catch((e) => Logger.error('Invite queue error: %o', e))
}

export async function processQueue() {
  if (_processing) return
  _processing = true
  try {
    while (_queue.length) {
      const id = _queue.shift()!
      await sendInviteNow(id)
    }
  } finally {
    _processing = false
  }
}

export function initInviteSender(intervalMs = 60 * 1000) {
  if (_interval) return
  // run once immediately and then periodically
  processQueue().catch((e) => Logger.error('Invite sender initial run failed: %o', e))
  _interval = setInterval(() => void processQueue(), intervalMs)
}

export function stopInviteSender() {
  if (_interval) {
    clearInterval(_interval)
    _interval = null
  }
}
