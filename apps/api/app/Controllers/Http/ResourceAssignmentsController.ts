import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Resource from 'App/Models/Resource'
import ResourceAssignment from 'App/Models/ResourceAssignment'
import { DateTime } from 'luxon'
import { assignResourceSchema, returnResourceSchema } from 'App/Validators/assignmentValidator'

export default class ResourceAssignmentsController {
  public async index({ params }: HttpContextContract) {
    const resource = await Resource.findOrFail(params.id)
    await resource.load('assignments')
    return resource.assignments
  }

  public async store({ params, request }: HttpContextContract) {
    // Parse and normalize payload. Allow frontend to send either { event_id } or
    // explicit { assignmentType, relatedId }.
    const raw = request.body()
    const payload = assignResourceSchema.parse(raw)

    // Expect `assignmentType` and `relatedId` to be provided by the frontend.
    // Legacy `event_id` fallback has been removed to keep server-side validation strict.

    const resource = await Resource.findOrFail(params.id)
    const qty = payload.quantity ?? 1

    // Prevent assignment if resource is retired or under maintenance
    if (['retired', 'maintenance'].includes((resource.status || '').toString())) {
      return { error: 'Resource is not available for assignment' }
    }

    // Check quantity availability
    if ((resource.quantityAvailable ?? 0) < qty) {
      return { error: 'Insufficient quantity available' }
    }

    // Conflict check: overlapping active assignments
    const overlapping = ResourceAssignment.query()
      .where('resource_id', resource.id)
      .where('status', 'assigned')
      .whereNull('returned_at')

    // If expectedReturnAt provided, check overlaps by time
    if (payload.expectedReturnAt) {
      const expectedISO = DateTime.fromISO(payload.expectedReturnAt).toISO()
      overlapping.where((builder) => {
        builder.whereNull('expected_return_at').orWhere('expected_return_at', '>', expectedISO)
      })
    }

    const activeAssignments = await overlapping
    let assignedCount = 0
    for (const a of activeAssignments) assignedCount += a.quantity ?? 1

    if (assignedCount + qty > (resource.quantityTotal ?? resource.quantityAvailable ?? 0)) {
      return {
        error: 'Assignment conflict: not enough items available for the requested time range'
      }
    }

    // Create assignment record with quantity
    const assignment = await ResourceAssignment.create({
      resourceId: resource.id,
      assignmentType: payload.assignmentType,
      relatedId: payload.relatedId || null,
      assignedAt: DateTime.local(),
      expectedReturnAt: payload.expectedReturnAt
        ? DateTime.fromISO(payload.expectedReturnAt)
        : null,
      status: 'assigned',
      notes: payload.notes || null,
      quantity: qty
    } as any)

    // Update resource availability
    resource.quantityAvailable = (resource.quantityAvailable ?? 0) - qty
    if (resource.quantityAvailable < 0) resource.quantityAvailable = 0

    // If this is a maintenance assignment, lock the resource status
    if (payload.assignmentType === 'maintenance') {
      resource.status = 'maintenance'
    }

    await resource.save()

    // Notify assigned technician or organizer if possible
    try {
      const Notification = await import('App/Models/Notification')
      const notifPayload = {
        userId:
          payload.assignmentType === 'maintenance'
            ? resource.assignedTechnicianId
            : payload.relatedId,
        type: 'resource.assignment.created',
        payload: JSON.stringify({
          resourceId: resource.id,
          assignmentId: assignment.id,
          quantity: qty
        })
      }
      // best-effort create
      // @ts-ignore
      await Notification.default.create(notifPayload)
    } catch (e) {
      // ignore notification errors
    }

    return assignment
  }

  public async markReturned({ params, request }: HttpContextContract) {
    const payload = returnResourceSchema.parse(request.body())
    const assignment = await ResourceAssignment.findOrFail(params.id)
    if (assignment.returnedAt) {
      return { error: 'Already returned' }
    }

    assignment.returnedAt = payload.returnedAt
      ? DateTime.fromISO(payload.returnedAt)
      : DateTime.local()
    assignment.status = 'returned'
    assignment.notes =
      [assignment.notes, payload.notes].filter(Boolean).join('\n') || assignment.notes
    await assignment.save()

    const resource = await Resource.find(assignment.resourceId)
    if (resource) {
      resource.quantityAvailable = (resource.quantityAvailable ?? 0) + (assignment.quantity ?? 1)
      await resource.save()
    }

    return assignment
  }
}
