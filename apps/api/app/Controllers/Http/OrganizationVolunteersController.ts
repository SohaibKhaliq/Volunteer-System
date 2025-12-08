import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import OrganizationVolunteer from 'App/Models/OrganizationVolunteer'
import Event from '@ioc:Adonis/Core/Event'
import Organization from 'App/Models/Organization'

export default class OrganizationVolunteersController {
  public async index({ auth, request, response }: HttpContextContract) {
    const { organization_id } = request.qs()
    const query = OrganizationVolunteer.query().preload('user')

    if (organization_id) {
      query.where('organization_id', organization_id)
    } else if (auth?.user) {
      // Logic: Allow if Team Member OR Owner
      const OrganizationTeamMember = await import('App/Models/OrganizationTeamMember')
      const member = await OrganizationTeamMember.default
        .query()
        .where('user_id', auth.user!.id)
        .first()

      const ownerOrg = await Organization.findBy('ownerId', auth.user!.id)

      if (member) {
          query.where('organization_id', member.organizationId)
      } else if (ownerOrg) {
          query.where('organization_id', ownerOrg.id)
      } else {
          // If neither, return empty or unauthorized
          return response.ok([])
      }
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

    const data: any = {
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

      const ownerOrg = await Organization.findBy('ownerId', auth.user!.id)

      if (member) data.organizationId = member.organizationId
      else if (ownerOrg) data.organizationId = ownerOrg.id
    }

    const volunteer = await OrganizationVolunteer.create(data)
    return response.created(volunteer)
  }

  public async update({ auth, params, request, response }: HttpContextContract) {
    const volunteer = await OrganizationVolunteer.find(params.id)
    if (!volunteer) return response.notFound()

    if (auth?.user) {
      const OrganizationTeamMember = await import('App/Models/OrganizationTeamMember')
      const member = await OrganizationTeamMember.default
        .query()
        .where('user_id', auth.user!.id)
        .first()

      const isOwner = await Organization.query()
        .where('id', volunteer.organizationId)
        .andWhere('owner_id', auth.user!.id)
        .first()

      if (!member && !isOwner) {
        return response.forbidden({ message: 'Volunteer does not belong to your organization' })
      }
      if (member && volunteer.organizationId !== member.organizationId) {
        return response.forbidden({ message: 'Volunteer does not belong to your organization' })
      }
    }
    const payload = request.only(['status', 'role', 'hours', 'rating', 'skills'])
    volunteer.merge(payload)
    await volunteer.save()
    return response.ok(volunteer)
  }

  // Update status specifically (Rostering)
  public async updateStatus({ auth, params, request, response }: HttpContextContract) {
    const volunteer = await OrganizationVolunteer.find(params.id)
    if (!volunteer) return response.notFound('Volunteer record not found')

    // Auth check: Team Member OR Owner
    if (auth?.user) {
        const OrganizationTeamMember = await import('App/Models/OrganizationTeamMember')
        const member = await OrganizationTeamMember.default
            .query()
            .where('user_id', auth.user!.id)
            .first()

        const isOwner = await Organization.query()
            .where('id', volunteer.organizationId)
            .andWhere('owner_id', auth.user!.id)
            .first()

        if (!isOwner && (!member || member.organizationId !== volunteer.organizationId)) {
            return response.forbidden('You do not have permission to update this volunteer.')
        }
    } else {
        return response.unauthorized()
    }

    const { status } = request.only(['status']) // 'approved', 'rejected', 'active'
    if (status) {
        volunteer.status = status
        await volunteer.save()

        // Real-time notification simulation via Event
        Event.emit('volunteer:status_changed', {
            userId: volunteer.userId,
            status: volunteer.status,
            organizationId: volunteer.organizationId
        })
    }

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

      const isOwner = await Organization.query()
        .where('id', volunteer.organizationId)
        .andWhere('owner_id', auth.user!.id)
        .first()

      if (!isOwner && (!member || member.organizationId !== volunteer.organizationId)) {
        return response.forbidden({ message: 'Volunteer does not belong to your organization' })
      }
    }
    await volunteer.delete()
    return response.noContent()
  }
}
