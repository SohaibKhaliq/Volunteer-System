import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import ComplianceRequirement from 'App/Models/ComplianceRequirement'

export default class ComplianceRequirementsController {
  public async index({ auth, response }: HttpContextContract) {
    const user = auth.user!
    const OrganizationTeamMember = await import('App/Models/OrganizationTeamMember')
    const member = await OrganizationTeamMember.default.query().where('user_id', user.id).first()

    if (!member) {
      return response.forbidden({ message: 'You are not an organization admin' })
    }

    const requirements = await ComplianceRequirement.query()
      .where('organization_id', member.organizationId)
      .orderBy('name', 'asc')

    return response.ok(requirements)
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const user = auth.user!
    const OrganizationTeamMember = await import('App/Models/OrganizationTeamMember')
    const member = await OrganizationTeamMember.default.query().where('user_id', user.id).first()

    if (!member) {
      return response.forbidden({ message: 'You are not an organization admin' })
    }

    const payload = request.only([
      'name',
      'doc_type',
      'description',
      'is_mandatory',
      'enforcement_level',
      'opportunity_id'
    ])

    const requirement = await ComplianceRequirement.create({
      ...payload,
      organizationId: member.organizationId
    })

    return response.created(requirement)
  }

  public async update({ auth, params, request, response }: HttpContextContract) {
    const user = auth.user!
    const OrganizationTeamMember = await import('App/Models/OrganizationTeamMember')
    const member = await OrganizationTeamMember.default.query().where('user_id', user.id).first()

    if (!member) {
      return response.forbidden({ message: 'You are not an organization admin' })
    }

    const requirement = await ComplianceRequirement.find(params.id)
    if (!requirement) {
      return response.notFound({ message: 'Requirement not found' })
    }

    if (requirement.organizationId !== member.organizationId) {
      return response.forbidden({
        message: 'This requirement does not belong to your organization'
      })
    }

    const payload = request.only([
      'name',
      'doc_type',
      'description',
      'is_mandatory',
      'enforcement_level',
      'opportunity_id'
    ])

    requirement.merge(payload)
    await requirement.save()

    return response.ok(requirement)
  }

  public async destroy({ auth, params, response }: HttpContextContract) {
    const user = auth.user!
    const OrganizationTeamMember = await import('App/Models/OrganizationTeamMember')
    const member = await OrganizationTeamMember.default.query().where('user_id', user.id).first()

    if (!member) {
      return response.forbidden({ message: 'You are not an organization admin' })
    }

    const requirement = await ComplianceRequirement.find(params.id)
    if (!requirement) {
      return response.notFound({ message: 'Requirement not found' })
    }

    if (requirement.organizationId !== member.organizationId) {
      return response.forbidden({
        message: 'This requirement does not belong to your organization'
      })
    }

    await requirement.delete()
    return response.noContent()
  }
}
