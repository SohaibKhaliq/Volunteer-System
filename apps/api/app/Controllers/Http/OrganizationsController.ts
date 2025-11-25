import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Organization from 'App/Models/Organization'
import OrganizationTeamMember from 'App/Models/OrganizationTeamMember'
import User from 'App/Models/User'
import Event from 'App/Models/Event'
import OrganizationVolunteer from 'App/Models/OrganizationVolunteer'

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

  public async show({ auth, response }: HttpContextContract) {
    const user = auth.user!

    const memberRecord = await OrganizationTeamMember.query().where('user_id', user.id).first()
    if (!memberRecord) return response.notFound({ message: 'User is not part of any organization' })

    const org = await Organization.find(memberRecord.organizationId)
    if (!org) return response.notFound()
    return response.ok(org)
  }

  public async update({ auth, request, response }: HttpContextContract) {
    const user = auth.user!
    const memberRecord = await OrganizationTeamMember.query().where('user_id', user.id).first()
    if (!memberRecord) return response.notFound({ message: 'User is not part of any organization' })

    const org = await Organization.find(memberRecord.organizationId)
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

  // Dashboard Stats
  public async dashboardStats({ auth, response }: HttpContextContract) {
    const user = auth.user!

    // Find organization for the current user
    const memberRecord = await OrganizationTeamMember.query().where('user_id', user.id).first()

    if (!memberRecord) {
      return response.notFound({ message: 'User is not part of any organization' })
    }

    const orgId = memberRecord.organizationId

    const activeVolunteers = await OrganizationVolunteer.query()
      .where('organization_id', orgId)
      .where('status', 'Active')
      .count('* as total')

    const upcomingEvents = await Event.query()
      .where('organization_id', orgId)
      .where('start_at', '>', new Date())
      .count('* as total')

    const totalHours = await OrganizationVolunteer.query()
      .where('organization_id', orgId)
      .sum('hours as total')

    const volCount = activeVolunteers[0].$extras.total
    const hoursCount = totalHours[0].$extras.total || 0

    // Simple impact score calculation: (Total Hours / Active Volunteers) * 10, capped at 100
    let impactScore = 0
    if (volCount > 0) {
      impactScore = Math.min(100, Math.round((hoursCount / volCount) * 10))
    }

    return response.ok({
      activeVolunteers: volCount,
      upcomingEvents: upcomingEvents[0].$extras.total,
      totalHours: hoursCount,
      impactScore
    })
  }

  // Team Management
  public async team({ auth, response }: HttpContextContract) {
    const user = auth.user!
    const memberRecord = await OrganizationTeamMember.query().where('user_id', user.id).first()
    if (!memberRecord) return response.notFound({ message: 'User is not part of any organization' })

    const orgId = memberRecord.organizationId
    const members = await OrganizationTeamMember.query()
      .where('organization_id', orgId)
      .preload('user')
    return response.ok(members)
  }

  public async inviteMember({ auth, request, response }: HttpContextContract) {
    const currentUser = auth.user!
    const memberRecord = await OrganizationTeamMember.query()
      .where('user_id', currentUser.id)
      .first()
    if (!memberRecord) return response.notFound({ message: 'User is not part of any organization' })

    const orgId = memberRecord.organizationId
    // Only allow invites from Admins or Coordinators
    const allowedInviteRoles = ['admin', 'coordinator']
    if (!allowedInviteRoles.includes((memberRecord.role || '').toLowerCase())) {
      return response.forbidden({ message: 'You do not have permission to invite members' })
    }
    const { email, role } = request.only(['email', 'role'])

    const targetUser = await User.findBy('email', email)
    if (!targetUser) {
      return response.badRequest({ message: 'User not found' })
    }

    // Prevent duplicate membership
    const existing = await OrganizationTeamMember.query()
      .where('organization_id', orgId)
      .andWhere('user_id', targetUser.id)
      .first()

    if (existing) {
      return response.conflict({ message: 'User is already a member of this organization' })
    }

    const member = await OrganizationTeamMember.create({
      organizationId: orgId,
      userId: targetUser.id,
      role: role || 'Member'
    })

    return response.created(member)
  }

  public async removeMember({ auth, params, response }: HttpContextContract) {
    // params.id is organization id, params.memberId is user id or team member id
    // Let's assume route is /organizations/:id/team/:memberId
    // where memberId is the ID of the OrganizationTeamMember record
    const user = auth.user!
    const currentOrgRec = await OrganizationTeamMember.query().where('user_id', user.id).first()
    if (!currentOrgRec)
      return response.notFound({ message: 'User is not part of any organization' })

    const member = await OrganizationTeamMember.find(params.memberId)
    if (!member) return response.notFound()

    if (member.organizationId !== currentOrgRec.organizationId) {
      return response.forbidden({ message: 'Member does not belong to your organization' })
    }

    // Only allow deletion by Admins or Coordinators
    const allowedRemoveRoles = ['admin', 'coordinator']
    if (!allowedRemoveRoles.includes((currentOrgRec.role || '').toLowerCase())) {
      return response.forbidden({ message: 'You do not have permission to remove members' })
    }

    await member.delete()
    return response.noContent()
  }

  // Update team member (role etc). Only allowed by org admins/coordinators
  public async updateMember({ auth, params, request, response }: HttpContextContract) {
    const currentUser = auth.user!
    const currentOrgRec = await OrganizationTeamMember.query()
      .where('user_id', currentUser.id)
      .first()
    if (!currentOrgRec)
      return response.notFound({ message: 'User is not part of any organization' })

    // Only admins/coordinators can update other members
    const allowedRoles = ['admin', 'coordinator']
    if (!allowedRoles.includes((currentOrgRec.role || '').toLowerCase())) {
      return response.forbidden({ message: 'You do not have permission to update team members' })
    }

    const member = await OrganizationTeamMember.find(params.memberId)
    if (!member) return response.notFound()

    if (member.organizationId !== currentOrgRec.organizationId) {
      return response.forbidden({ message: 'Member does not belong to your organization' })
    }

    const payload = request.only(['role'])
    if (payload.role) member.role = payload.role

    await member.save()
    await member.refresh()
    await member.preload('user')

    return response.ok(member)
  }
}
