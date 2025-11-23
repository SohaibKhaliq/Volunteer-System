import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Organization from 'App/Models/Organization'

export default class OrganizationsController {
  public async index({ response }: HttpContextContract) {
    const list = await Organization.all()
    return response.ok(list)
  }

  public async store({ request, response }: HttpContextContract) {
    const payload = request.only(['name', 'description', 'contact_email', 'contact_phone'])
    const org = await Organization.create(payload)
    return response.created(org)
  }

  public async show({ params, response }: HttpContextContract) {
    const org = await Organization.find(params.id)
    if (!org) return response.notFound()
    return response.ok(org)
  }

  public async update({ params, request, response }: HttpContextContract) {
    const org = await Organization.find(params.id)
    if (!org) return response.notFound()
    org.merge(
      request.only([
        'name',
        'description',
        'contact_email',
        'contact_phone',
        'is_approved',
        'is_active'
      ])
    )
    await org.save()
    return response.ok(org)
  }

  public async destroy({ params, response }: HttpContextContract) {
    const org = await Organization.find(params.id)
    if (!org) return response.notFound()
    await org.delete()
    return response.noContent()
  }
}
