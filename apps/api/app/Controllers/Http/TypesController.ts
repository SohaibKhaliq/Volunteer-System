import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Type from 'App/Models/Type'

export default class TypesController {
  public async index({ response }: HttpContextContract) {
    const items = await Type.query().orderBy('id', 'asc')
    return response.ok(items)
  }

  public async store({ request, response }: HttpContextContract) {
    const payload = request.only(['type'])
    const item = await Type.create(payload as any)
    return response.created(item)
  }

  public async show({ params, response }: HttpContextContract) {
    const item = await Type.find(params.id)
    if (!item) return response.notFound()
    return response.ok(item)
  }

  public async update({ params, request, response }: HttpContextContract) {
    const item = await Type.find(params.id)
    if (!item) return response.notFound()
    const payload = request.only(['type'])
    item.merge(payload as any)
    await item.save()
    return response.ok(item)
  }

  public async destroy({ params, response }: HttpContextContract) {
    const item = await Type.find(params.id)
    if (!item) return response.notFound()
    await item.delete()
    return response.noContent()
  }
}
