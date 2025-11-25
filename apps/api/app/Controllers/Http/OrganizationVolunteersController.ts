import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import OrganizationVolunteer from 'App/Models/OrganizationVolunteer'

export default class OrganizationVolunteersController {
  public async index({ auth, request, response }: HttpContextContract) {
    const { organization_id } = request.qs()
    const query = OrganizationVolunteer.query().preload('user')

    if (organization_id) {
      query.where('organization_id', organization_id)
    } else if (auth?.user) {
      const OrganizationTeamMember = await import('App/Models/OrganizationTeamMember')
      const member = await OrganizationTeamMember.default
        .query()
        .where('user_id', auth.user!.id)
        .first()
      if (member) query.where('organization_id', member.organizationId)
    }

    const volunteers = await query
    return response.ok(volunteers)
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const payload = request.only([
      'organization_id',
      'user_id',
      'status',
      'role',
      'hours',
      'rating',
      'skills'
    ])

    // Normalize keys
    const data: any = {
      // prefer authenticated user's organization when available
      organizationId: payload.organization_id,
      userId: payload.user_id,
      status: payload.status,
      role: payload.role,
      hours: payload.hours,
      rating: payload.rating,
      skills: payload.skills
    }

    if (auth?.user) {
      const OrganizationTeamMember = await import('App/Models/OrganizationTeamMember')
      const member = await OrganizationTeamMember.default
        .query()
        .where('user_id', auth.user!.id)
        .first()
      if (member) data.organizationId = member.organizationId
    }

    const volunteer = await OrganizationVolunteer.create(data)
    return response.created(volunteer)
  }

  public async update({ auth, params, request, response }: HttpContextContract) {
    const volunteer = await OrganizationVolunteer.find(params.id)
    if (!volunteer) return response.notFound()
    // ensure volunteer belongs to the same org as the authenticated user
    if (auth?.user) {
      const OrganizationTeamMember = await import('App/Models/OrganizationTeamMember')
      const member = await OrganizationTeamMember.default
        .query()
        .where('user_id', auth.user!.id)
        .first()
      if (member && volunteer.organizationId !== member.organizationId) {
        return response.forbidden({ message: 'Volunteer does not belong to your organization' })
      }
    }
    const payload = request.only(['status', 'role', 'hours', 'rating', 'skills'])
    volunteer.merge(payload)
    await volunteer.save()
    return response.ok(volunteer)
  }

  public async destroy({ auth, params, response }: HttpContextContract) {
    const volunteer = await OrganizationVolunteer.find(params.id)
    if (!volunteer) return response.notFound()
    if (auth?.user) {
      const OrganizationTeamMember = await import('App/Models/OrganizationTeamMember')
      const member = await OrganizationTeamMember.default
        .query()
        .where('user_id', auth.user!.id)
        .first()
      if (member && volunteer.organizationId !== member.organizationId) {
        return response.forbidden({ message: 'Volunteer does not belong to your organization' })
      }
    }
    await volunteer.delete()
    return response.noContent()
  }
}
