import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Team from 'App/Models/Team'
import ResourceAssignment from 'App/Models/ResourceAssignment'
import Resource from 'App/Models/Resource'
import Organization from 'App/Models/Organization'

export default class TeamResourcesController {
  
  /**
   * List resources assigned to a team
   */
  public async index({ params, response }: HttpContextContract) {
    const assignments = await ResourceAssignment.query()
        .where('related_id', params.id)
        .where('assignment_type', 'team')
        .where('status', 'assigned')
        .preload('resource')
    
    return response.ok(assignments)
  }

  /**
   * Assign a resource to a team (Org Admin action)
   */
  public async store({ params, request, response, auth }: HttpContextContract) {
    const team = await Team.findOrFail(params.id)
    const { resource_id, quantity = 1, notes } = request.only(['resource_id', 'quantity', 'notes'])

    const resource = await Resource.findOrFail(resource_id)
    
    // Validate resource belongs to same org
    if (resource.organizationId !== team.organizationId) {
        return response.badRequest({ message: 'Resource must belong to the same organization' })
    }

    // Use current logic from ResourceAssignmentsController but tailored for team?
    // Or just create the record directly if we trust the inputs.
    // Ideally we re-use logic to check availability.
    
    if ((resource.quantityAvailable ?? 0) < quantity) {
        return response.badRequest({ message: 'Insufficient quantity available' })
    }

    // Create assignment
    const assignment = await ResourceAssignment.create({
        resourceId: resource.id,
        assignmentType: 'team',
        relatedId: team.id,
        status: 'assigned',
        quantity: quantity,
        assignedAt: ((await import('luxon')).DateTime).local(),
        notes: notes
    })

    // Update resource availability
    resource.quantityAvailable = (resource.quantityAvailable ?? 0) - quantity
    if (resource.quantityAvailable <= 0) {
        resource.quantityAvailable = 0
        resource.status = 'in_use' // partial logic
    }
    await resource.save()

    return response.created(assignment)
  }
}
