import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Opportunity from 'App/Models/Opportunity'
import Application from 'App/Models/Application'
import Organization from 'App/Models/Organization'
import OrganizationTeamMember from 'App/Models/OrganizationTeamMember'
import { DateTime } from 'luxon'
import Database from '@ioc:Adonis/Lucid/Database'

export default class OpportunitiesController {
  private static readonly TEAM_ROLES = ['admin', 'coordinator', 'member']

  private normalizeTeamRole(role?: string): string {
    const normalized = (role || 'member').toString().trim().toLowerCase()
    if (!OpportunitiesController.TEAM_ROLES.includes(normalized)) return 'member'
    return normalized
  }

  private async resolveOrganizationForUser(
    user: HttpContextContract['auth']['user'],
    request: HttpContextContract['request']
  ): Promise<{
    organizationId: number | null
    membership: any | null
    multipleMemberships: boolean
    hasMembership: boolean
  }> {
    const rawOrgId =
      request.input('organizationId') ||
      request.qs().organizationId ||
      request.params().organizationId
    const parsedOrgId = rawOrgId ? Number(rawOrgId) : undefined

    const memberships = await OrganizationTeamMember.query().where('user_id', user!.id)

    if (parsedOrgId && !Number.isNaN(parsedOrgId)) {
      const membership = memberships.find((m) => m.organizationId === parsedOrgId) || null
      return {
        organizationId: parsedOrgId,
        membership,
        multipleMemberships: memberships.length > 1,
        hasMembership: memberships.length > 0
      }
    }

    if (memberships.length === 1) {
      return {
        organizationId: memberships[0].organizationId,
        membership: memberships[0],
        multipleMemberships: false,
        hasMembership: true
      }
    }

    if (memberships.length > 1) {
      const preferred =
        memberships.find((m) =>
          ['admin', 'coordinator'].includes(this.normalizeTeamRole(m.role))
        ) || memberships[0]

      return {
        organizationId: preferred.organizationId,
        membership: preferred,
        multipleMemberships: true,
        hasMembership: true
      }
    }

    return {
      organizationId: null,
      membership: null,
      multipleMemberships: false,
      hasMembership: false
    }
  }

  private async requireOrgMember(userId: number, organizationId: number): Promise<any | null> {
    return await OrganizationTeamMember.query()
      .where('user_id', userId)
      .where('organization_id', organizationId)
      .first()
  }

  /**
   * List all opportunities for an organization
   */
  public async index({ auth, params, request, response }: HttpContextContract) {
    const user = auth.user!
    const { organizationId } = params
    const qs = request.qs()
    const page = qs.page || 1
    const perPage = qs.perPage || 20

    const org = await Organization.find(organizationId)
    if (!org) {
      return response.notFound({ message: 'Organization not found' })
    }

    // Security: only system admins or org team members can list for arbitrary org
    if (!user.isAdmin) {
      const member = await this.requireOrgMember(user.id, Number(organizationId))
      if (!member) {
        return response.forbidden({
          message: 'You do not have permission to view these opportunities'
        })
      }
    }

    let query = Opportunity.query()
      .where('organization_id', organizationId)
      .preload('team')
      .preload('creator')
      .orderBy('start_at', 'desc')

    if (qs.status) {
      query = query.where('status', qs.status)
    }
    if (qs.team_id) {
      query = query.where('team_id', qs.team_id)
    }
    if (qs.type) {
      query = query.where('type', qs.type)
    }
    if (qs.from) {
      query = query.where('start_at', '>=', qs.from)
    }
    if (qs.to) {
      query = query.where('start_at', '<=', qs.to)
    }

    const opportunities = await query.paginate(page, perPage)

    // Add application counts
    const opportunityIds = opportunities.map((o) => o.id)
    const applicationCounts = await Database.from('applications')
      .whereIn('opportunity_id', opportunityIds)
      .select('opportunity_id')
      .count('* as count')
      .groupBy('opportunity_id')

    const countMap = new Map(applicationCounts.map((a) => [a.opportunity_id, a.count]))

    const data = opportunities.toJSON()
    data.data = data.data.map((opp: any) => ({
      ...opp,
      application_count: countMap.get(opp.id) || 0
    }))

    return response.ok(data)
  }

  /**
   * List opportunities for the current user's organization (org panel)
   */
  public async myOrganizationOpportunities({ auth, request, response }: HttpContextContract) {
    const user = auth.user!

    const { organizationId, membership, multipleMemberships, hasMembership } =
      await this.resolveOrganizationForUser(user, request)

    if (!organizationId) {
      if (multipleMemberships) {
        return response.badRequest({
          message: 'Multiple organizations found. Provide organizationId.'
        })
      }
      if (!hasMembership && !user.isAdmin) {
        return response.notFound({ message: 'User is not part of any organization' })
      }
      return response.badRequest({ message: 'organizationId is required' })
    }

    if (!user.isAdmin && (!membership || membership.organizationId !== organizationId)) {
      return response.forbidden({
        message: 'You do not have permission to view these opportunities'
      })
    }

    const qs = request.qs()
    const page = qs.page || 1
    const perPage = qs.perPage || 20
    const search = (qs.search || '').toString().trim()

    let query = Opportunity.query()
      .where('organization_id', organizationId)
      .preload('team')
      .preload('creator')
      .orderBy('start_at', 'desc')

    if (qs.status) {
      query = query.where('status', qs.status)
    }
    if (qs.team_id) {
      query = query.where('team_id', qs.team_id)
    }
    if (qs.type) {
      query = query.where('type', qs.type)
    }

    if (search) {
      query = query.where((builder) => {
        builder.whereILike('title', `%${search}%`).orWhereILike('description', `%${search}%`)
      })
    }

    const opportunities = await query.paginate(page, perPage)

    // Add application counts (for UI: application_count)
    const opportunityIds = opportunities.map((o) => o.id)
    const applicationCounts = await Database.from('applications')
      .whereIn('opportunity_id', opportunityIds)
      .select('opportunity_id')
      .count('* as count')
      .groupBy('opportunity_id')
    const countMap = new Map(applicationCounts.map((a) => [a.opportunity_id, a.count]))
    const data = opportunities.toJSON()
    data.data = data.data.map((opp: any) => ({
      ...opp,
      application_count: countMap.get(opp.id) || 0
    }))

    return response.ok(data)
  }

  /**
   * Create a new opportunity
   */
  public async store({ auth, params, request, response }: HttpContextContract) {
    const user = auth.user!
    const { organizationId } = params
    const payload = request.only([
      'title',
      'description',
      'location',
      'capacity',
      'type',
      'start_at',
      'end_at',
      'recurrence',
      'status',
      'visibility',
      'team_id'
    ])

    const org = await Organization.find(organizationId)
    if (!org) {
      return response.notFound({ message: 'Organization not found' })
    }

    // Security: only system admins or org admins/coordinators can create for arbitrary org
    if (!user.isAdmin) {
      const member = await this.requireOrgMember(user.id, Number(organizationId))
      const role = this.normalizeTeamRole(member?.role)
      if (!member || !['admin', 'coordinator'].includes(role)) {
        return response.forbidden({ message: 'You do not have permission to create opportunities' })
      }
    }

    const opportunity = await Opportunity.create({
      organizationId: parseInt(organizationId),
      teamId: payload.team_id,
      title: payload.title,
      slug: Opportunity.generateSlug(payload.title),
      description: payload.description,
      location: payload.location,
      capacity: payload.capacity || 0,
      type: payload.type || 'event',
      startAt: DateTime.fromISO(payload.start_at),
      endAt: payload.end_at ? DateTime.fromISO(payload.end_at) : undefined,
      recurrence: payload.recurrence,
      status: payload.status || 'draft',
      visibility: payload.visibility || 'public',
      createdBy: user.id
    })

    await opportunity.load('team')
    await opportunity.load('creator')

    return response.created(opportunity)
  }

  /**
   * Create an opportunity for the current user's organization (org panel)
   */
  public async storeForMyOrganization({ auth, request, response }: HttpContextContract) {
    const user = auth.user!

    const { organizationId, membership, multipleMemberships, hasMembership } =
      await this.resolveOrganizationForUser(user, request)

    if (!organizationId) {
      if (multipleMemberships) {
        return response.badRequest({
          message: 'Multiple organizations found. Provide organizationId.'
        })
      }
      if (!hasMembership && !user.isAdmin) {
        return response.notFound({ message: 'User is not part of any organization' })
      }
      return response.badRequest({ message: 'organizationId is required' })
    }

    if (!user.isAdmin && (!membership || membership.organizationId !== organizationId)) {
      return response.forbidden({ message: 'You do not have permission to create opportunities' })
    }

    const actorRole = user.isAdmin ? 'admin' : this.normalizeTeamRole(membership?.role)
    if (!['admin', 'coordinator'].includes(actorRole)) {
      return response.forbidden({ message: 'You do not have permission to create opportunities' })
    }

    const payload = request.only([
      'title',
      'description',
      'location',
      'capacity',
      'type',
      'start_at',
      'end_at',
      'recurrence',
      'status',
      'visibility',
      'team_id'
    ])

    const opportunity = await Opportunity.create({
      organizationId,
      teamId: payload.team_id,
      title: payload.title,
      slug: Opportunity.generateSlug(payload.title),
      description: payload.description,
      location: payload.location,
      capacity: payload.capacity || 0,
      type: payload.type || 'event',
      startAt: DateTime.fromISO(payload.start_at),
      endAt: payload.end_at ? DateTime.fromISO(payload.end_at) : undefined,
      recurrence: payload.recurrence,
      status: payload.status || 'draft',
      visibility: payload.visibility || 'public',
      createdBy: user.id
    })

    await opportunity.load('team')
    await opportunity.load('creator')

    return response.created(opportunity)
  }

  /**
   * Get a single opportunity (public view)
   */
  public async show({ params, response }: HttpContextContract) {
    const opportunity = await Opportunity.query()
      .where('id', params.id)
      .preload('team')
      .preload('creator')
      .preload('organization')
      .first()

    if (!opportunity) {
      return response.notFound({ message: 'Opportunity not found' })
    }

    // Get application count
    const applicationCount = await Application.query()
      .where('opportunity_id', opportunity.id)
      .count('* as count')

    const result = {
      ...opportunity.toJSON(),
      application_count: applicationCount[0].$extras.count || 0
    }

    return response.ok(result)
  }

  /**
   * Get a single opportunity (org panel)
   */
  public async showForOrganization({ auth, params, response }: HttpContextContract) {
    const user = auth.user!
    const opportunity = await Opportunity.query()
      .where('id', params.id)
      .preload('team')
      .preload('creator')
      .preload('organization')
      .first()

    if (!opportunity) {
      return response.notFound({ message: 'Opportunity not found' })
    }

    if (!user.isAdmin) {
      const member = await this.requireOrgMember(user.id, opportunity.organizationId)
      if (!member) {
        return response.forbidden({
          message: 'You do not have permission to view this opportunity'
        })
      }
    }

    const applicationCount = await Application.query()
      .where('opportunity_id', opportunity.id)
      .count('* as count')

    return response.ok({
      ...opportunity.toJSON(),
      application_count: applicationCount[0].$extras.count || 0
    })
  }

  /**
   * Update an opportunity
   */
  public async update({ auth, params, request, response }: HttpContextContract) {
    const user = auth.user!
    const opportunity = await Opportunity.find(params.id)
    if (!opportunity) {
      return response.notFound({ message: 'Opportunity not found' })
    }

    if (!user.isAdmin) {
      const member = await this.requireOrgMember(user.id, opportunity.organizationId)
      const role = this.normalizeTeamRole(member?.role)
      if (!member || !['admin', 'coordinator'].includes(role)) {
        return response.forbidden({
          message: 'You do not have permission to update this opportunity'
        })
      }
    }

    const payload = request.only([
      'title',
      'description',
      'location',
      'capacity',
      'type',
      'start_at',
      'end_at',
      'recurrence',
      'status',
      'visibility',
      'team_id'
    ])

    if (payload.title) opportunity.title = payload.title
    if (payload.description !== undefined) opportunity.description = payload.description
    if (payload.location !== undefined) opportunity.location = payload.location
    if (payload.capacity !== undefined) opportunity.capacity = payload.capacity
    if (payload.type) opportunity.type = payload.type
    if (payload.start_at) opportunity.startAt = DateTime.fromISO(payload.start_at)
    if (payload.end_at !== undefined) {
      opportunity.endAt = payload.end_at ? DateTime.fromISO(payload.end_at) : undefined
    }
    if (payload.recurrence !== undefined) opportunity.recurrence = payload.recurrence
    if (payload.status) opportunity.status = payload.status
    if (payload.visibility) opportunity.visibility = payload.visibility
    if (payload.team_id !== undefined) opportunity.teamId = payload.team_id

    await opportunity.save()
    await opportunity.load('team')
    await opportunity.load('creator')

    return response.ok(opportunity)
  }

  /**
   * Delete an opportunity
   */
  public async destroy({ auth, params, response }: HttpContextContract) {
    const user = auth.user!
    const opportunity = await Opportunity.find(params.id)
    if (!opportunity) {
      return response.notFound({ message: 'Opportunity not found' })
    }

    if (!user.isAdmin) {
      const member = await this.requireOrgMember(user.id, opportunity.organizationId)
      const role = this.normalizeTeamRole(member?.role)
      if (!member || !['admin', 'coordinator'].includes(role)) {
        return response.forbidden({
          message: 'You do not have permission to delete this opportunity'
        })
      }
    }

    await opportunity.delete()

    return response.noContent()
  }

  /**
   * Publish/unpublish an opportunity
   */
  public async publish({ auth, params, request, response }: HttpContextContract) {
    const user = auth.user!
    const opportunity = await Opportunity.find(params.id)
    if (!opportunity) {
      return response.notFound({ message: 'Opportunity not found' })
    }

    if (!user.isAdmin) {
      const member = await this.requireOrgMember(user.id, opportunity.organizationId)
      const role = this.normalizeTeamRole(member?.role)
      if (!member || !['admin', 'coordinator'].includes(role)) {
        return response.forbidden({
          message: 'You do not have permission to publish this opportunity'
        })
      }
    }

    const { publish } = request.only(['publish'])
    opportunity.status = publish === false ? 'draft' : 'published'
    await opportunity.save()

    return response.ok({ message: `Opportunity ${opportunity.status}`, opportunity })
  }
}
