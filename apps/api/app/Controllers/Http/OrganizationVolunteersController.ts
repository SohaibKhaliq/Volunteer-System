import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import OrganizationVolunteer from 'App/Models/OrganizationVolunteer'
import Organization from 'App/Models/Organization'
import Notification from 'App/Models/Notification'
import AuditLog from 'App/Models/AuditLog'
import { DateTime } from 'luxon'
// Mail is optional — we'll attempt to send email if configured, but don't fail on errors
// import Mail from '@ioc:Adonis/Addons/Mail'

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
      status: payload.status ? String(payload.status).toLowerCase() : 'pending',
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
    if (payload.status) payload.status = String(payload.status).toLowerCase()
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

  public async approve({ auth, params, response }: HttpContextContract) {
    const volunteer = await OrganizationVolunteer.find(params.id)
    if (!volunteer) return response.notFound()

    // ensure privileged user for this org
    if (auth?.user) {
      const OrganizationTeamMember = await import('App/Models/OrganizationTeamMember')
      const member = await OrganizationTeamMember.default
        .query()
        .where('user_id', auth.user!.id)
        .first()
      if (member && volunteer.organizationId !== member.organizationId) {
        return response.forbidden({ message: 'Volunteer does not belong to your organization' })
      }
      const allowedRoles = ['admin', 'owner', 'manager']
      const memberRole = (member?.role || '').toLowerCase()
      if (!allowedRoles.includes(memberRole)) {
        return response.forbidden({ message: 'Insufficient permissions to approve volunteers' })
      }
    }

    volunteer.status = 'active'
    volunteer.joinedAt = DateTime.local()
    await volunteer.save()

    // Load organization and user for notifications
    await volunteer.load('user')
    const org = await Organization.find(volunteer.organizationId)

    // Create in-app notification (socket server will pick this up)
    try {
      await Notification.create({
        userId: volunteer.userId,
        type: 'membership_approved',
        payload: JSON.stringify({
          volunteerId: volunteer.id,
          organizationId: org?.id,
          organizationName: org?.name
        })
      })
    } catch (err) {
      console.warn('Failed to create membership approval notification', err)
    }

    // Create an audit record
    try {
      await AuditLog.safeCreate({
        userId: auth.user?.id,
        action: 'organization_volunteer.approve',
        targetType: 'organization_volunteer',
        targetId: volunteer.id,
        details: JSON.stringify({ organizationId: org?.id, volunteerUserId: volunteer.userId })
      })
    } catch (err) {
      console.warn('Failed to create audit log for volunteer approval', err)
    }

    // Send an email if Mail is configured (best-effort)
    try {
      if (volunteer.user && volunteer.user.email) {
        /*
        await Mail.send((message) => {
          message.to(volunteer.user.email)
          message.subject(
            `Your membership request to ${org?.name || 'the organization'} has been approved`
          )
          message.text(
            `Hello ${volunteer.user.name || ''},\n\nYour request to join ${org?.name || 'the organization'} has been approved. You can now access the organization's volunteer resources and opportunities.\n\nThank you.`
          )
        })
        */
      }
    } catch (err) {
      // don't fail on mail errors
      // eslint-disable-next-line no-console
      console.warn('Failed to send membership approval email', err)
    }

    return response.ok(volunteer)
  }

  public async reject({ auth, params, request, response }: HttpContextContract) {
    const volunteer = await OrganizationVolunteer.find(params.id)
    if (!volunteer) return response.notFound()

    // ensure privileged user for this org
    if (auth?.user) {
      const OrganizationTeamMember = await import('App/Models/OrganizationTeamMember')
      const member = await OrganizationTeamMember.default
        .query()
        .where('user_id', auth.user!.id)
        .first()
      if (member && volunteer.organizationId !== member.organizationId) {
        return response.forbidden({ message: 'Volunteer does not belong to your organization' })
      }
      const allowedRoles = ['admin', 'owner', 'manager']
      const memberRole = (member?.role || '').toLowerCase()
      if (!allowedRoles.includes(memberRole)) {
        return response.forbidden({ message: 'Insufficient permissions to reject volunteers' })
      }
    }

    const { reason } = request.only(['reason'])

    // Load org & user for notifications before deleting
    await volunteer.load('user')
    const org = await Organization.find(volunteer.organizationId)

    // Create an in-app notification to inform user of rejection (best-effort)
    try {
      await Notification.create({
        userId: volunteer.userId,
        type: 'membership_rejected',
        payload: JSON.stringify({
          volunteerId: volunteer.id,
          organizationId: org?.id,
          organizationName: org?.name,
          reason: reason || null
        })
      })
    } catch (err) {
      console.warn('Failed to create membership rejection notification', err)
    }

    // Try to send an email — best-effort
    try {
      if (volunteer.user && volunteer.user.email) {
        /*
        await Mail.send((message) => {
          message.to(volunteer.user.email)
          message.subject(
            `Your membership request to ${org?.name || 'the organization'} was not approved`
          )
          message.text(
            `Hello ${volunteer.user.name || ''},\n\nWe reviewed your request to join ${org?.name || 'the organization'}. Unfortunately it was not approved.${reason ? `\n\nReason: ${reason}` : ''}\n\nIf you have questions, contact the organization admins.`
          )
        })
        */
      }
    } catch (err) {
      // don't fail on mail errors
      // eslint-disable-next-line no-console
      console.warn('Failed to send membership rejection email', err)
    }

    // Create audit record, then delete the pivot row
    try {
      await AuditLog.safeCreate({
        userId: auth.user?.id,
        action: 'organization_volunteer.reject',
        targetType: 'organization_volunteer',
        targetId: volunteer.id,
        details: JSON.stringify({
          organizationId: org?.id,
          volunteerUserId: volunteer.userId,
          reason: reason || null
        })
      })
    } catch (err) {
      console.warn('Failed to create audit log for volunteer rejection', err)
    }

    await volunteer.delete()
    return response.noContent()
  }
}
