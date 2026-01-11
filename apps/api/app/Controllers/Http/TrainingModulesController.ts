import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import TrainingModule from 'App/Models/TrainingModule'
import OrganizationTeamMember from 'App/Models/OrganizationTeamMember'

export default class TrainingModulesController {
  private async getOrganizationId(auth: any): Promise<number | null> {
    if (!auth?.user) return null
    const member = await OrganizationTeamMember.query().where('user_id', auth.user.id).first()
    return member ? member.organizationId : null
  }

  public async index({ auth, request, response }: HttpContextContract) {
    const orgId = await this.getOrganizationId(auth)
    if (!orgId) return response.forbidden({ message: 'User not part of an organization' })

    const page = request.input('page', 1)
    const limit = request.input('limit', 10)
    const query = TrainingModule.query().where('organization_id', orgId)

    if (request.input('type')) {
       query.where('type', request.input('type'))
    }

    const modules = await query.paginate(page, limit)
    return response.ok(modules)
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const orgId = await this.getOrganizationId(auth)
    if (!orgId) return response.forbidden({ message: 'User not part of an organization' })

    const data = request.only(['title', 'description', 'type', 'content_data', 'passing_criteria', 'is_active'])
    
    const module = await TrainingModule.create({
      ...data,
      organizationId: orgId
    })
    return response.created(module)
  }

  public async show({ auth, params, response }: HttpContextContract) {
    const orgId = await this.getOrganizationId(auth)
    const module = await TrainingModule.findOrFail(params.id)
    
    if (orgId && module.organizationId !== orgId) {
        return response.forbidden({ message: 'Access denied' })
    }
    return response.ok(module)
  }

  public async update({ auth, params, request, response }: HttpContextContract) {
    const orgId = await this.getOrganizationId(auth)
    const module = await TrainingModule.findOrFail(params.id)
    
     if (orgId && module.organizationId !== orgId) {
        return response.forbidden({ message: 'Access denied' })
    }

    const data = request.only(['title', 'description', 'type', 'content_data', 'passing_criteria', 'is_active'])
    module.merge(data)
    await module.save()
    return response.ok(module)
  }

  public async destroy({ auth, params, response }: HttpContextContract) {
    const orgId = await this.getOrganizationId(auth)
    const module = await TrainingModule.findOrFail(params.id)
     if (orgId && module.organizationId !== orgId) {
        return response.forbidden({ message: 'Access denied' })
    }
    await module.delete()
    return response.noContent()
  }
}
