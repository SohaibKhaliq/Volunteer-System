import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Resource from 'App/Models/Resource'

export default class ResourcesController {
  public async index({ request }: HttpContextContract) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 10)
    return Resource.query().preload('organization').paginate(page, limit)
  }

  public async store({ request }: HttpContextContract) {
    const data = request.only(['name', 'quantity', 'status', 'organizationId'])
    return Resource.create(data)
  }

  public async show({ params }: HttpContextContract) {
    return Resource.findOrFail(params.id)
  }

  public async update({ params, request }: HttpContextContract) {
    const resource = await Resource.findOrFail(params.id)
    const data = request.only(['name', 'quantity', 'status', 'organizationId'])
    resource.merge(data)
    await resource.save()
    return resource
  }

  public async destroy({ params }: HttpContextContract) {
    const resource = await Resource.findOrFail(params.id)
    await resource.delete()
  }
}
