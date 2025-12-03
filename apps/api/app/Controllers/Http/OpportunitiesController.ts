import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Opportunity from 'App/Models/Opportunity'
import Application from 'App/Models/Application'
import Organization from 'App/Models/Organization'
import OrganizationTeamMember from 'App/Models/OrganizationTeamMember'
import { DateTime } from 'luxon'
import Database from '@ioc:Adonis/Lucid/Database'

export default class OpportunitiesController {
  /**
   * List all opportunities for an organization
   */
  public async index({ params, request, response }: HttpContextContract) {
    const { organizationId } = params
    const qs = request.qs()
    const page = qs.page || 1
    const perPage = qs.perPage || 20

    const org = await Organization.find(organizationId)
    if (!org) {
      return response.notFound({ message: 'Organization not found' })
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
    const memberRecord = await OrganizationTeamMember.query().where('user_id', user.id).first()

    if (!memberRecord) {
      return response.notFound({ message: 'User is not part of any organization' })
    }

    const qs = request.qs()
    const page = qs.page || 1
    const perPage = qs.perPage || 20

    let query = Opportunity.query()
      .where('organization_id', memberRecord.organizationId)
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

    const opportunities = await query.paginate(page, perPage)

    return response.ok(opportunities)
  }

  /**
   * Create a new opportunity
   */
  public async store({ params, request, response, auth }: HttpContextContract) {
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
      createdBy: auth.user?.id
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
    const memberRecord = await OrganizationTeamMember.query().where('user_id', user.id).first()

    if (!memberRecord) {
      return response.notFound({ message: 'User is not part of any organization' })
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
      organizationId: memberRecord.organizationId,
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
   * Update an opportunity
   */
  public async update({ params, request, response }: HttpContextContract) {
    const opportunity = await Opportunity.find(params.id)
    if (!opportunity) {
      return response.notFound({ message: 'Opportunity not found' })
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
  public async destroy({ params, response }: HttpContextContract) {
    const opportunity = await Opportunity.find(params.id)
    if (!opportunity) {
      return response.notFound({ message: 'Opportunity not found' })
    }

    await opportunity.delete()

    return response.noContent()
  }

  /**
   * Publish/unpublish an opportunity
   */
  public async publish({ params, request, response }: HttpContextContract) {
    const opportunity = await Opportunity.find(params.id)
    if (!opportunity) {
      return response.notFound({ message: 'Opportunity not found' })
    }

    const { publish } = request.only(['publish'])
    opportunity.status = publish === false ? 'draft' : 'published'
    await opportunity.save()

    return response.ok({ message: `Opportunity ${opportunity.status}`, opportunity })
  }
}
