import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import InviteSendJob from 'App/Models/InviteSendJob'
import { processQueue } from 'App/Services/InviteSender'

export default class InviteSendJobsController {
  public async index({ auth }: HttpContextContract) {
    await auth.use('api').authenticate()
    const user = auth.user!
    // allow only admin users
    if (!user || !(user.isAdmin || (user.roles || []).some((r: any) => String(r?.name ?? r?.role ?? '').toLowerCase().includes('admin')))) {
      return { error: 'admin access required' }
    }

    return InviteSendJob.query().preload('invite').orderBy('created_at', 'desc')
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
