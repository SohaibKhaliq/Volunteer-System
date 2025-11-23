import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Communication from 'App/Models/Communication'

export default class CommunicationsController {
  public async index({ request }: HttpContextContract) {
    return Communication.all()
  }

  public async store({ request }: HttpContextContract) {
    const data = request.only(['subject', 'content', 'type', 'status', 'sendAt', 'targetAudience'])
    return Communication.create(data)
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
