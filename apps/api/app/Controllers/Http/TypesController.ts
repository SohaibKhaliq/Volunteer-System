import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Type from 'App/Models/Type'

export default class TypesController {
  public async index({ response }: HttpContextContract) {
    const items = await Type.query().orderBy('id', 'asc')
    return response.ok(items)
  }

  public async store({ request, response }: HttpContextContract) {
    const payload = request.only(['type', 'name', 'category', 'description'])
    // Keep DB enum compatibility: if client doesn't pass a known enum `type`, default to 'other'
    const allowed = Object.values((await import('../../contracts/requests')).RequestTypes)
    const t = payload.type && allowed.includes(payload.type) ? payload.type : 'other'
    const item = await Type.create({
      type: t,
      name: payload.name || null,
      category: payload.category || 'General',
      description: payload.description || null
    } as any)
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
    const payload = request.only(['type', 'name', 'category', 'description'])
    // respect enum constraint: only allow known values
    if (payload.type) {
      const allowed = Object.values((await import('../../contracts/requests')).RequestTypes)
      if (allowed.includes(payload.type)) {
        item.type = payload.type
      }
    }
    item.merge({
      name: payload.name ?? item.name,
      category: payload.category ?? item.category,
      description: payload.description ?? item.description
    } as any)
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
