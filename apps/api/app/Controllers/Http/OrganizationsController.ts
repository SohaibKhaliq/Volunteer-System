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

  // Dashboard Stats
  public async dashboardStats({ response }: HttpContextContract) {
    // Assuming the user belongs to an organization or we pass org ID. 
    // For now, let's assume we get the org ID from the user's context or params.
    // In a real app, we'd check auth.user.organizationId or similar.
    // Here, we'll assume the first org found for the user or passed via query.
    
    // Mocking org ID retrieval for now, or getting from query
    const orgId = 1 // Replace with actual logic: auth.user?.organizationId

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

    // Impact score logic (placeholder)
    const impactScore = 98.5

    return response.ok({
      activeVolunteers: activeVolunteers[0].$extras.total,
      upcomingEvents: upcomingEvents[0].$extras.total,
      totalHours: totalHours[0].$extras.total || 0,
      impactScore
    })
  }

  // Team Management
  public async team({ params, response }: HttpContextContract) {
    // params.id is organization id
    const members = await OrganizationTeamMember.query()
      .where('organization_id', params.id)
      .preload('user')
    return response.ok(members)
  }

  public async inviteMember({ params, request, response }: HttpContextContract) {
    const orgId = params.id
    const { email, role } = request.only(['email', 'role'])
    
    const user = await User.findBy('email', email)
    if (!user) {
      return response.badRequest({ message: 'User not found' })
    }

    const member = await OrganizationTeamMember.create({
      organizationId: orgId,
      userId: user.id,
      role: role || 'Member'
    })

    return response.created(member)
  }

  public async removeMember({ params, response }: HttpContextContract) {
    // params.id is organization id, params.memberId is user id or team member id
    // Let's assume route is /organizations/:id/team/:memberId
    // where memberId is the ID of the OrganizationTeamMember record
    const member = await OrganizationTeamMember.find(params.memberId)
    if (!member) return response.notFound()
    await member.delete()
    return response.noContent()
  }
}
