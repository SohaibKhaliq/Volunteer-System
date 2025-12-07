import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import InviteSendJob from 'App/Models/InviteSendJob'
import { processQueue } from 'App/Services/InviteSender'

export default class InviteSendJobsController {
  public async index({ auth, request }: HttpContextContract) {
    await auth.use('api').authenticate()
    const user = auth.user!
    // allow only admin users
    if (!user || !(user.isAdmin || (user.roles || []).some((r: any) => String(r?.name ?? r?.role ?? '').toLowerCase().includes('admin')))) {
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
    if (!user || !(user.isAdmin || (user.roles || []).some((r: any) => String(r?.name ?? r?.role ?? '').toLowerCase().includes('admin')))) {
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
    if (!user || !(user.isAdmin || (user.roles || []).some((r: any) => String(r?.name ?? r?.role ?? '').toLowerCase().includes('admin')))) {
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
}
