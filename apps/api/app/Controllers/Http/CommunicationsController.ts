import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Communication from 'App/Models/Communication'
import Logger from '@ioc:Adonis/Core/Logger'

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
}
