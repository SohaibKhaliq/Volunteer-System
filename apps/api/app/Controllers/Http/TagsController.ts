import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Tag from 'App/Models/Tag'

export default class TagsController {
  public async index({ response }: HttpContextContract) {
    const tags = await Tag.all()
    return response.ok(tags)
  }

  public async store({ auth, request, response }: HttpContextContract) {
    // Only Admin
    await auth.use('api').authenticate()
    if (!auth.user?.isAdmin) return response.forbidden()

    const data = request.only(['name', 'type'])
    const tag = await Tag.create(data)
    return response.created(tag)
  }

  public async destroy({ auth, params, response }: HttpContextContract) {
    // Only Admin
    await auth.use('api').authenticate()
    if (!auth.user?.isAdmin) return response.forbidden()

    const tag = await Tag.find(params.id)
    if (tag) await tag.delete()
    return response.noContent()
  }
}
