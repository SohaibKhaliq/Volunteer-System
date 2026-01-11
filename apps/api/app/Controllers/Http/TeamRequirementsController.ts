import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Team from 'App/Models/Team'
import TeamCertificationRequirement from 'App/Models/TeamCertificationRequirement'

export default class TeamRequirementsController {
  
  public async index({ params, response }: HttpContextContract) {
    const requirements = await TeamCertificationRequirement.query()
        .where('team_id', params.id)
        .preload('template')
    return response.ok(requirements)
  }

  public async store({ params, request, response }: HttpContextContract) {
      const team = await Team.findOrFail(params.id)
      const { template_id } = request.only(['template_id'])

      const requirement = await TeamCertificationRequirement.create({
          teamId: team.id,
          templateId: template_id
      })

      return response.created(requirement)
  }

  public async destroy({ params, response }: HttpContextContract) {
      const requirement = await TeamCertificationRequirement.findOrFail(params.requirementId)
      await requirement.delete()
      
      return response.noContent()
  }
}
