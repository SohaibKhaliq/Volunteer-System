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
    // Flatten user fields for frontend convenience
    const payload = volunteers.map((v) => {
      const obj: any = v.toJSON()
      if (obj.user) {
        obj.name = obj.user.name || obj.user.first_name || obj.user.firstName || obj.user.email
        obj.email = obj.user.email
        obj.avatar = obj.user.avatar || obj.user.profile_picture || null
      }
      return obj
    })

    return response.ok(payload)
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

      // Only allow privileged roles to change membership status for other users
      const payload = request.only(['status', 'role', 'hours', 'rating', 'skills'])
      const changingStatus = Object.prototype.hasOwnProperty.call(payload, 'status')
      if (changingStatus) {
        const allowedRoles = ['admin', 'owner', 'manager']
        const memberRole = (member?.role || '').toLowerCase()
        const isPrivileged = allowedRoles.includes(memberRole)
        // allow a user to update their own volunteer record (e.g., update hours/profile),
        // but only privileged users may change another user's membership status
        if (!isPrivileged && auth.user!.id !== volunteer.userId) {
          return response.forbidden({
            message: 'Insufficient permissions to change membership status'
          })
        }
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
