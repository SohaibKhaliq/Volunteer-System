import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Team from 'App/Models/Team'
import Organization from 'App/Models/Organization'
import OrganizationTeamMember from 'App/Models/OrganizationTeamMember'

export default class TeamsController {
  /**
   * List all teams for an organization
   */
  public async index({ params, request, response }: HttpContextContract) {
    const { organizationId } = params
    const { page = 1, perPage = 20 } = request.qs()

    const org = await Organization.find(organizationId)
    if (!org) {
      return response.notFound({ message: 'Organization not found' })
    }

    const teams = await Team.query()
      .where('organization_id', organizationId)
      .preload('lead')
      .paginate(page, perPage)

    return response.ok(teams)
  }

  /**
   * List teams for the current user's organization (org panel)
   */
  public async myOrganizationTeams({ auth, request, response }: HttpContextContract) {
    const user = auth.user!
    const memberRecord = await OrganizationTeamMember.query().where('user_id', user.id).first()

    if (!memberRecord) {
      return response.notFound({ message: 'User is not part of any organization' })
    }

    const { page = 1, perPage = 20 } = request.qs()

    const teams = await Team.query()
      .where('organization_id', memberRecord.organizationId)
      .preload('lead')
      .paginate(page, perPage)

    return response.ok(teams)
  }

  /**
   * Create a new team
   */
  public async store({ params, request, response, auth }: HttpContextContract) {
    const { organizationId } = params
    const body = request.only(['name', 'description', 'lead_user_id'])

    const org = await Organization.find(organizationId)
    if (!org) {
      return response.notFound({ message: 'Organization not found' })
    }

    const team = await Team.create({
      organizationId: parseInt(organizationId),
      name: body.name,
      description: body.description,
      leadUserId: body.lead_user_id
    })

    await team.load('lead')

    return response.created(team)
  }

  /**
   * Create a team for the current user's organization (org panel)
   */
  public async storeForMyOrganization({ auth, request, response }: HttpContextContract) {
    const user = auth.user!
    const memberRecord = await OrganizationTeamMember.query().where('user_id', user.id).first()

    if (!memberRecord) {
      return response.notFound({ message: 'User is not part of any organization' })
    }

    const body = request.only(['name', 'description', 'lead_user_id'])

    const team = await Team.create({
      organizationId: memberRecord.organizationId,
      name: body.name,
      description: body.description,
      leadUserId: body.lead_user_id
    })

    await team.load('lead')

    return response.created(team)
  }

  /**
   * Get a single team
   */
  public async show({ params, response }: HttpContextContract) {
    const team = await Team.query()
      .where('id', params.id)
      .preload('lead')
      .preload('organization')
      .first()

    if (!team) {
      return response.notFound({ message: 'Team not found' })
    }

    return response.ok(team)
  }

  /**
   * Update a team
   */
  public async update({ params, request, response }: HttpContextContract) {
    const team = await Team.find(params.id)
    if (!team) {
      return response.notFound({ message: 'Team not found' })
    }

    const body = request.only(['name', 'description', 'lead_user_id'])

    if (body.name) team.name = body.name
    if (body.description !== undefined) team.description = body.description
    if (body.lead_user_id !== undefined) team.leadUserId = body.lead_user_id

    await team.save()
    await team.load('lead')

    return response.ok(team)
  }

  /**
   * Delete a team
   */
  public async destroy({ params, response }: HttpContextContract) {
    const team = await Team.find(params.id)
    if (!team) {
      return response.notFound({ message: 'Team not found' })
    }

    await team.delete()

    return response.noContent()
  }
}
