import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import ScheduledJob from 'App/Models/ScheduledJob'
import Logger from '@ioc:Adonis/Core/Logger'
import { DateTime } from 'luxon'

export default class ScheduledJobsController {
  public async index({}: HttpContextContract) {
    return ScheduledJob.query().orderBy('run_at', 'desc')
  }

  public async show({ params }: HttpContextContract) {
    return ScheduledJob.findOrFail(params.id)
  }

  public async retry({ params, response }: HttpContextContract) {
    const id = params.id
    const job = await ScheduledJob.find(id)
    if (!job) return response.notFound()

    // reset job to Scheduled and set run_at to now so scheduler picks it up
    job.status = 'Scheduled'
    job.runAt = DateTime.local()
    job.lastError = undefined
    await job.save()
    return response.ok(job)
  }
}
