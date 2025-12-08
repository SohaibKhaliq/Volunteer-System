import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import InviteSendJob from 'App/Models/InviteSendJob'
import Database from '@ioc:Adonis/Lucid/Database'
import AuditLog from 'App/Models/AuditLog'
import { processQueue } from 'App/Services/InviteSender'

export default class InviteSendJobsController {
  public async index({ auth, request }: HttpContextContract) {
    await auth.use('api').authenticate()
    const user = auth.user!
    // allow only admin users
    if (
      !user ||
      !(
        user.isAdmin ||
        (user.roles || []).some((r: any) =>
          String(r?.name ?? r?.role ?? '')
            .toLowerCase()
            .includes('admin')
        )
      )
    ) {
      return { error: 'admin access required' }
    }

    const qs = request.qs()
    const status = qs.status
    const q = qs.q || qs.search
    const inviteId = qs.inviteId || qs.invite_id
    const page = Number(qs.page || 1)
    const perPage = Number(qs.perPage || qs.per_page || 20)
    const startDate = qs.startDate || qs.start_date
    const endDate = qs.endDate || qs.end_date

    let query = InviteSendJob.query().preload('invite').orderBy('created_at', 'desc')

    if (status) {
      query = query.where('status', status)
    }

    if (inviteId) {
      query = query.where('organization_invite_id', Number(inviteId))
    }

    if (q) {
      // search by invite email or job id
      const term = String(q)
      if (/^\d+$/.test(term)) {
        query = query.where((builder) => {
          builder.where('id', Number(term)).orWhere('organization_invite_id', Number(term))
        })
      } else {
        query = query.whereHas('invite', (builder) => builder.where('email', 'LIKE', `%${term}%`))
      }
    }

    if (startDate) {
      const sd = new Date(startDate)
      if (!isNaN(sd.getTime())) query = query.where('created_at', '>=', sd.toISOString())
    }

    if (endDate) {
      const ed = new Date(endDate)
      if (!isNaN(ed.getTime())) query = query.where('created_at', '<=', ed.toISOString())
    }

    // paginate for admin UIs
    return query.paginate(page, perPage)
  }

  public async show({ auth, params, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    const user = auth.user!
    if (
      !user ||
      !(
        user.isAdmin ||
        (user.roles || []).some((r: any) =>
          String(r?.name ?? r?.role ?? '')
            .toLowerCase()
            .includes('admin')
        )
      )
    ) {
      return response.unauthorized({ message: 'admin access required' })
    }

    const job = await InviteSendJob.find(params.id)
    if (!job) return response.notFound()
    await job.load('invite')
    return response.ok(job)
  }

  public async retry({ auth, params, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    const user = auth.user!
    if (
      !user ||
      !(
        user.isAdmin ||
        (user.roles || []).some((r: any) =>
          String(r?.name ?? r?.role ?? '')
            .toLowerCase()
            .includes('admin')
        )
      )
    ) {
      return response.unauthorized({ message: 'admin access required' })
    }

    const job = await InviteSendJob.find(params.id)
    if (!job) return response.notFound()

    job.status = 'pending'
    job.attempts = 0
    job.nextAttemptAt = null as any
    job.lastError = null
    await job.save()

    // kick the queue to attempt sending immediately (best-effort)
    try {
      await processQueue(1)
    } catch (e) {
      // no-op
    }

    return response.ok(job)
  }

  public async stats({ auth, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    const user = auth.user!
    if (
      !user ||
      !(
        user.isAdmin ||
        (user.roles || []).some((r: any) =>
          String(r?.name ?? r?.role ?? '')
            .toLowerCase()
            .includes('admin')
        )
      )
    ) {
      return response.unauthorized({ message: 'admin access required' })
    }

    try {
      // Count by status
      const rows: any = await Database.from('invite_send_jobs')
        .select('status')
        .count('* as cnt')
        .groupBy('status')

      const byStatus: Record<string, number> = {}
      let total = 0
      for (const r of rows) {
        const s = String(r.status || 'unknown')
        const cnt = Number(r.cnt || 0)
        byStatus[s] = cnt
        total += cnt
      }

      const sent = Number(byStatus['sent'] || 0)
      const successRate = total > 0 ? Math.round((sent / total) * 100) : 0

      // Average attempts (best-effort)
      const avgRow: any = await Database.from('invite_send_jobs').avg('attempts as avg')
      const avgAttempts = avgRow && avgRow[0] ? Number(avgRow[0].avg || 0) : 0

      return response.ok({ total, byStatus, successRate, avgAttempts })
    } catch (e) {
      // If table missing or error occurs, return zeros (fail-safe)
      return response.ok({ total: 0, byStatus: {}, successRate: 0, avgAttempts: 0 })
    }
  }

  public async retryAllFailed({ auth, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    const user = auth.user!
    if (
      !user ||
      !(
        user.isAdmin ||
        (user.roles || []).some((r: any) =>
          String(r?.name ?? r?.role ?? '')
            .toLowerCase()
            .includes('admin')
        )
      )
    ) {
      return response.unauthorized({ message: 'admin access required' })
    }

    try {
      // Count how many failed jobs we'll requeue and record a start audit entry
      const toRequeueCountRow: any = await Database.from('invite_send_jobs')
        .where('status', 'failed')
        .count('* as cnt')
      const toRequeueCount =
        (toRequeueCountRow && toRequeueCountRow[0] && Number(toRequeueCountRow[0].cnt)) || 0

      await AuditLog.safeCreate({
        userId: user.id,
        action: 'invite_send_jobs_requeue_started',
        targetType: 'invite_send_jobs',
        metadata: JSON.stringify({
          initiatedBy: user.id,
          startedAt: new Date().toISOString(),
          toRequeueCount
        })
      })
      // Update all failed jobs to pending, reset attempts and errors.
      // Use Database directly for a faster bulk update.
      const updated = await Database.from('invite_send_jobs').where('status', 'failed').update({
        status: 'pending',
        attempts: 0,
        next_attempt_at: null,
        last_error: null,
        updated_at: new Date()
      })

      // Kick the queue to pick up the newly requeued jobs (best-effort).
      try {
        await processQueue()
      } catch (e) {
        // ignore
      }

      // create a completed audit log entry so the activity trail shows finished work
      await AuditLog.safeCreate({
        userId: user.id,
        action: 'invite_send_jobs_requeue_completed',
        targetType: 'invite_send_jobs',
        metadata: JSON.stringify({
          requeued: Number(updated || 0),
          completedAt: new Date().toISOString()
        })
      })

      return response.ok({ requeued: Number(updated || 0) })
    } catch (e) {
      // missing table or DB error - return safe response
      return response.status(500).send({ message: 'Failed to retry failed jobs', error: String(e) })
    }
  }
}
