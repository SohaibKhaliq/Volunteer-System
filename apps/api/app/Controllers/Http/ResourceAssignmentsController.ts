import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Resource from 'App/Models/Resource'
import ResourceAssignment from 'App/Models/ResourceAssignment'
import { assignResourceSchema, returnResourceSchema } from 'App/Validators/assignmentValidator'

export default class ResourceAssignmentsController {
  public async index({ params }: HttpContextContract) {
    const resource = await Resource.findOrFail(params.id)
    await resource.load('assignments')
    return resource.assignments
  }

  public async store({ params, request }: HttpContextContract) {
    const payload = assignResourceSchema.parse(request.body())

    const resource = await Resource.findOrFail(params.id)

    // Basic availability check
    if ((resource.quantityAvailable ?? 0) < (payload.quantity ?? 1)) {
      return { error: 'Insufficient quantity available' }
    }

    const assignment = await ResourceAssignment.create({
      resourceId: resource.id,
      assignmentType: payload.assignmentType,
      relatedId: payload.relatedId || null,
      assignedAt: new Date(),
      expectedReturnAt: payload.expectedReturnAt || null,
      status: 'assigned',
      notes: payload.notes || null
    } as any)

    resource.quantityAvailable = (resource.quantityAvailable ?? 0) - (payload.quantity ?? 1)
    if (resource.quantityAvailable < 0) resource.quantityAvailable = 0
    await resource.save()

    return assignment
  }

  public async markReturned({ params, request }: HttpContextContract) {
    const payload = returnResourceSchema.parse(request.body())
    const assignment = await ResourceAssignment.findOrFail(params.id)
    if (assignment.returnedAt) {
      return { error: 'Already returned' }
    }

    assignment.returnedAt = payload.returnedAt ? new Date(payload.returnedAt) : new Date()
    assignment.status = 'returned'
    assignment.notes =
      [assignment.notes, payload.notes].filter(Boolean).join('\n') || assignment.notes
    await assignment.save()

    const resource = await Resource.find(assignment.resourceId)
    if (resource) {
      resource.quantityAvailable = (resource.quantityAvailable ?? 0) + 1
      await resource.save()
    }

    return assignment
  }
}
