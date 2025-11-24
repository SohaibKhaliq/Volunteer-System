import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import OrganizationVolunteer from 'App/Models/OrganizationVolunteer'

export default class OrganizationVolunteersController {
  public async index({ request, response }: HttpContextContract) {
    const { organization_id } = request.qs()
    const query = OrganizationVolunteer.query().preload('user')
    
    if (organization_id) {
      query.where('organization_id', organization_id)
    }

    const volunteers = await query
    return response.ok(volunteers)
  }

  public async store({ request, response }: HttpContextContract) {
    const payload = request.only(['organization_id', 'user_id', 'status', 'role', 'hours', 'rating', 'skills'])
    
    // Normalize keys
    const data: any = {
      organizationId: payload.organization_id,
      userId: payload.user_id,
      status: payload.status,
      role: payload.role,
      hours: payload.hours,
      rating: payload.rating,
      skills: payload.skills
    }

    const volunteer = await OrganizationVolunteer.create(data)
    return response.created(volunteer)
  }

  public async update({ params, request, response }: HttpContextContract) {
    const volunteer = await OrganizationVolunteer.find(params.id)
    if (!volunteer) return response.notFound()

    const payload = request.only(['status', 'role', 'hours', 'rating', 'skills'])
    volunteer.merge(payload)
    await volunteer.save()
    return response.ok(volunteer)
  }

  public async destroy({ params, response }: HttpContextContract) {
    const volunteer = await OrganizationVolunteer.find(params.id)
    if (!volunteer) return response.notFound()
    await volunteer.delete()
    return response.noContent()
  }
}
