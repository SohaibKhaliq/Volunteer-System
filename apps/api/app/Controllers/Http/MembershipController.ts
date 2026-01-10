import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Organization from 'App/Models/Organization'
import OrganizationVolunteer from 'App/Models/OrganizationVolunteer'
import OrganizationTeamMember from 'App/Models/OrganizationTeamMember'

export default class MembershipController {
  /**
   * Request to join an organization
   */
  public async join({ auth, params, request, response }: HttpContextContract) {
    const user = auth.user!
    const organizationId = params.id
    const { notes } = request.body()

    const organization = await Organization.findOrFail(organizationId)

    // Check if already a member or pending
    const existingMembership = await OrganizationVolunteer.query()
      .where('organization_id', organization.id)
      .where('user_id', user.id)
      .first()

    if (existingMembership) {
      if (['active', 'pending'].includes(existingMembership.status)) {
        return response.conflict({ message: 'You are already a member or have a pending request' })
      }

      // If previously rejected or left, allow re-joining
      existingMembership.status = 'pending'
      existingMembership.notes = notes
      existingMembership.joinedAt = undefined
      await existingMembership.save()

      return response.ok({ message: 'Membership request submitted successfully' })
    }

    // Create new membership request
    await OrganizationVolunteer.create({
      organizationId: organization.id,
      userId: user.id,
      status: organization.autoApproveVolunteers ? 'active' : 'pending',
      role: 'volunteer',
      notes: notes,
      joinedAt: organization.autoApproveVolunteers ? undefined : undefined // Set via DB default or logic
    })

    return response.created({ message: 'Membership request submitted successfully' })
  }

  /**
   * Leave an organization
   */
  public async leave({ auth, params, response }: HttpContextContract) {
    const user = auth.user!
    const organizationId = params.id

    const membership = await OrganizationVolunteer.query()
      .where('organization_id', organizationId)
      .where('user_id', user.id)
      .firstOrFail()

    await membership.delete()

    return response.ok({ message: 'You have left the organization' })
  }

  /**
   * List members (Admin only)
   */
  public async index({ auth, params, request, response }: HttpContextContract) {
    const user = auth.user!
    const organizationId = params.id
    const { page = 1, perPage = 20, status, search } = request.qs()

    // Verify admin permission
    const teamMember = await OrganizationTeamMember.query()
      .where('organization_id', organizationId)
      .where('user_id', user.id)
      .first()

    if (!user.isAdmin && !teamMember) {
        const canView = (await user.can('view_users')) || (await user.can('view_teams'))
        if (!canView) {
            return response.forbidden({ message: 'You do not have permission to view members' })
        }
    }

    let query = OrganizationVolunteer.query()
      .where('organization_id', organizationId)
      .preload('user')

    if (status) {
      query = query.where('status', status)
    }

    if (search) {
      query = query.whereHas('user', (userQuery) => {
        userQuery
          .where('first_name', 'ilike', `%${search}%`)
          .orWhere('last_name', 'ilike', `%${search}%`)
          .orWhere('email', 'ilike', `%${search}%`)
      })
    }

    const members = await query.paginate(page, perPage)
    return response.ok(members)
  }

  /**
   * Update member status (Approve/Reject/Suspend)
   */
  public async updateStatus({ auth, params, request, response }: HttpContextContract) {
    const user = auth.user!
    const organizationId = params.id
    const memberId = params.memberId
    const { status, notes } = request.body()

    // Verify admin permission
    const teamMember = await OrganizationTeamMember.query()
      .where('organization_id', organizationId)
      .where('user_id', user.id)
      .first()

    if (!user.isAdmin && (!teamMember || !['owner', 'admin', 'manager'].includes(teamMember.role))) {
        if (!(await user.can('manage_org_members'))) {
            return response.forbidden({ message: 'You do not have permission to manage members' })
        }
    }

    const membership = await OrganizationVolunteer.query()
      .where('organization_id', organizationId)
      .where('user_id', memberId)
      .firstOrFail()

    if (status) {
      membership.status = status
    }

    if (notes !== undefined) {
      membership.notes = notes
    }

    // Set joined_at if approving
    if (status === 'active' && !membership.joinedAt) {
      // Logic handled by DB default or explicit set if needed
    }

    await membership.save()

    return response.ok({ message: 'Member status updated', membership })
  }

  /**
   * Remove a member (Admin only)
   */
  public async remove({ auth, params, response }: HttpContextContract) {
    const user = auth.user!
    const organizationId = params.id
    const memberId = params.memberId

    // Verify admin permission
    const teamMember = await OrganizationTeamMember.query()
      .where('organization_id', organizationId)
      .where('user_id', user.id)
      .first()

    if (!user.isAdmin && (!teamMember || !['owner', 'admin'].includes(teamMember.role))) {
        if (!(await user.can('manage_org_members'))) {
             return response.forbidden({ message: 'You do not have permission to remove members' })
        }
    }

    const membership = await OrganizationVolunteer.query()
      .where('organization_id', organizationId)
      .where('user_id', memberId)
      .firstOrFail()

    await membership.delete()

    return response.ok({ message: 'Member removed successfully' })
  }
}
