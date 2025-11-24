import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import ScheduledJob from 'App/Models/ScheduledJob'
import Logger from '@ioc:Adonis/Core/Logger'
import { DateTime } from 'luxon'
import { schema, rules } from '@ioc:Adonis/Core/Validator'

export default class ScheduledJobsController {
  public async index({}: HttpContextContract) {
    return ScheduledJob.query().orderBy('run_at', 'desc')
  }

  public async store({ request, response }: HttpContextContract) {
    const validationSchema = schema.create({
      name: schema.string({}, [rules.maxLength(255)]),
      type: schema.string({}, [rules.maxLength(50)]),
      runAt: schema.string({}, [rules.date()])
    })

    try {
      const payload = await request.validate({ schema: validationSchema })

      // payload.runAt is string, parse to DateTime
      const runAt = DateTime.fromISO(payload.runAt)
      if (!runAt.isValid) return response.badRequest({ error: 'Invalid runAt datetime' })

      const job = await ScheduledJob.create({
        name: payload.name,
        type: payload.type,
        payload: request.input('payload') ? JSON.stringify(request.input('payload')) : null,
        runAt: runAt,
        status: 'Scheduled'
      })

      return response.created(job)
    } catch (err) {
      Logger.error('Failed to create scheduled job: ' + String(err))
      return response.status(400).send({ error: 'Invalid payload', details: String(err) })
    }
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
