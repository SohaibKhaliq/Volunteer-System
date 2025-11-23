import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Role from 'App/Models/Role'

export default class RolesController {
  public async index({ response }: HttpContextContract) {
    const roles = await Role.all()
    return response.ok(roles)
  }

  public async store({ request, response }: HttpContextContract) {
    const payload = request.only(['name', 'description'])
    const role = await Role.create(payload)
    return response.created(role)
  }

  public async show({ params, response }: HttpContextContract) {
    const role = await Role.find(params.id)
    if (!role) return response.notFound()
    return response.ok(role)
  }

  public async update({ params, request, response }: HttpContextContract) {
    const role = await Role.find(params.id)
    if (!role) return response.notFound()
    role.merge(request.only(['name', 'description']))
    await role.save()
    return response.ok(role)
  }

  public async destroy({ params, response }: HttpContextContract) {
    const role = await Role.find(params.id)
    if (!role) return response.notFound()
    await role.delete()
    return response.noContent()
  }
}
