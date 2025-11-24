import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Communication from 'App/Models/Communication'
import Logger from '@ioc:Adonis/Core/Logger'
import CommunicationLog from 'App/Models/CommunicationLog'
// import Mail from '@ioc:Adonis/Addons/Mail'
import Env from '@ioc:Adonis/Core/Env'
import { DateTime } from 'luxon'

export default class CommunicationsController {
  public async index({}: HttpContextContract) {
    return Communication.all()
  }

  public async store({ request, response }: HttpContextContract) {
    try {
      const data = request.only([
        'subject',
        'content',
        'type',
        'status',
        'sendAt',
        'targetAudience'
      ])
      const comm = await Communication.create(data)
      return comm
    } catch (err) {
      Logger.error('Failed to create communication: ' + String(err))
      return response
        .status(500)
        .send({ error: 'Failed to create communication', details: String(err) })
    }
  }

  public async show({ params }: HttpContextContract) {
    return Communication.findOrFail(params.id)
  }

  public async update({ params, request }: HttpContextContract) {
    const comm = await Communication.findOrFail(params.id)
    const data = request.only(['subject', 'content', 'type', 'status', 'sendAt', 'targetAudience'])
    comm.merge(data)
    await comm.save()
    return comm
  }

  public async destroy({ params }: HttpContextContract) {
    const comm = await Communication.findOrFail(params.id)
    await comm.delete()
  }

  public async logs({ params }: HttpContextContract) {
    const commId = params.id
    const logs = await CommunicationLog.query()
      .where('communication_id', commId)
      .orderBy('created_at', 'desc')
    return logs
  }

  public async retryLog({ params, response }: HttpContextContract) {
    // retry a single communication log entry by id
    const id = params.id
    const log = await CommunicationLog.find(id)
    if (!log) return response.notFound()

    // fetch communication for subject/content
    const comm = await Communication.find(log.communicationId)
    if (!comm) return response.badRequest({ error: 'Parent communication not found' })

    if ((log.status || '').toLowerCase() === 'success') {
      return response.ok({ message: 'Already successful' })
    }

    const fromAddr = Env.get('MAIL_FROM', 'no-reply@local.test')
    try {
      // await Mail.send((message) => {
      //   message.from(fromAddr)
      //   message.to(log.recipient)
      //   message.subject(comm.subject || '')
      //   message.text(comm.content || '')
      // })

      log.status = 'Success'
      log.attempts = (log.attempts || 0) + 1
      log.error = undefined
      log.lastAttemptAt = DateTime.local()
      await log.save()

      return response.ok(log)
    } catch (e) {
      Logger.error('Retry failed for log ' + id + ': ' + String(e))
      log.status = 'Failed'
      log.attempts = (log.attempts || 0) + 1
      log.error = String(e)
      log.lastAttemptAt = DateTime.local()
      await log.save()
      return response.status(500).send({ error: 'Retry failed', details: String(e) })
    }
  }
}
