import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Resource from 'App/Models/Resource'
import ResourceAssignment from 'App/Models/ResourceAssignment'
import { createResourceSchema, updateResourceSchema } from 'App/Validators/resourceValidator'
import { z } from 'zod'

export default class ResourcesController {
  public async index({ request }: HttpContextContract) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 10)
    const search = request.input('search')
    const status = request.input('status')
    const category = request.input('category')

    const query = Resource.query().preload('organization').whereNull('deleted_at')

    if (search) {
      query.where('name', 'like', `%${search}%`)
    }
    if (status) {
      query.where('status', status)
    }
    if (category) {
      query.where('category', category)
    }

    return query.paginate(page, limit)
  }

  public async dashboard({}: HttpContextContract) {
    const total = await Resource.query().whereNull('deleted_at').count('* as total').first()
    const available = await Resource.query()
      .whereNull('deleted_at')
      .where('status', 'available')
      .count('* as total')
      .first()
    const inUse = await Resource.query()
      .whereNull('deleted_at')
      .where('status', 'in_use')
      .count('* as total')
      .first()
    const maintenance = await Resource.query()
      .whereNull('deleted_at')
      .where('status', 'maintenance')
      .count('* as total')
      .first()

    return {
      total: (total && (total.$extras?.total ?? (total as any).total)) || 0,
      available: (available && (available.$extras?.total ?? (available as any).total)) || 0,
      inUse: (inUse && (inUse.$extras?.total ?? (inUse as any).total)) || 0,
      maintenance: (maintenance && (maintenance.$extras?.total ?? (maintenance as any).total)) || 0
    }
  }

  public async lowStock({}: HttpContextContract) {
    // resources where available < 10% of total
    const resources = await Resource.query()
      .whereNull('deleted_at')
      .whereRaw('quantity_total > 0 AND (quantity_available / quantity_total) < 0.1')
    return resources
  }

  public async maintenanceDue({}: HttpContextContract) {
    const now = new Date()
    const soon = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) // next 7 days
    const resources = await Resource.query()
      .whereNull('deleted_at')
      .whereNotNull('maintenance_due')
      .whereBetween('maintenance_due', [now.toISOString(), soon.toISOString()])
    return resources
  }

  public async store({ request, auth }: HttpContextContract) {
    const payload = createResourceSchema.parse(request.only(Object.keys(request.body()) as any))
    const user = auth.user

    const data = {
      name: payload.name,
      category: payload.category,
      description: payload.description,
      quantityTotal: payload.quantityTotal ?? 0,
      quantityAvailable: payload.quantityAvailable ?? payload.quantityTotal ?? 0,
      status: payload.status,
      location: payload.location,
      serialNumber: payload.serialNumber,
      maintenanceDue: payload.maintenanceDue || null,
      attributes: payload.attributes || null,
      organizationId: payload.organizationId || null
    }

    if (user && user.id) data['createdById'] = (user as any).id
    const resource = await Resource.create(data)
    return resource
  }

  public async show({ params }: HttpContextContract) {
    const resource = await Resource.query()
      .where('id', params.id)
      .whereNull('deleted_at')
      .firstOrFail()
    await resource.load('assignments')
    return resource
  }

  public async update({ params, request }: HttpContextContract) {
    const resource = await Resource.query()
      .where('id', params.id)
      .whereNull('deleted_at')
      .firstOrFail()
    const payload = updateResourceSchema.parse(request.only(Object.keys(request.body()) as any))
    resource.merge(payload as any)
    await resource.save()
    return resource
  }

  public async destroy({ params }: HttpContextContract) {
    const resource = await Resource.findOrFail(params.id)
    // Soft-delete: set deleted_at timestamp
    resource.deletedAt = new Date()
    await resource.save()
  }

  public async patchStatus({ params, request }: HttpContextContract) {
    const resource = await Resource.findOrFail(params.id)
    const schema = z.object({
      status: z.enum(['available', 'maintenance', 'reserved', 'in_use', 'retired'])
    })
    const { status } = schema.parse(request.only('status'))
    resource.status = status
    await resource.save()
    return resource
  }

  // Create a maintenance assignment (take units out of service)
  public async maintenance({ params, request, auth }: HttpContextContract) {
    const resource = await Resource.findOrFail(params.id)
    const schema = z.object({
      quantity: z.number().int().min(1).optional(),
      expectedReturnAt: z.string().nullable().optional(),
      notes: z.string().nullable().optional()
    })
    const payload = schema.parse(request.only(['quantity', 'expectedReturnAt', 'notes']))

    const qty = payload.quantity ?? resource.quantityTotal ?? 1

    // create maintenance assignment record
    const assignment = await ResourceAssignment.create({
      resourceId: resource.id,
      assignmentType: 'maintenance',
      relatedId: null,
      assignedAt: new Date(),
      expectedReturnAt: payload.expectedReturnAt ?? null,
      status: 'assigned',
      notes: payload.notes || null,
      quantity: qty
    } as any)

    // decrement available units and lock resource status
    resource.quantityAvailable = Math.max(0, (resource.quantityAvailable ?? 0) - qty)
    resource.status = 'maintenance'
    await resource.save()

    // Notify technician/owner if present
    try {
      const Notification = await import('App/Models/Notification')
      const notifPayload = {
        userId: resource.assignedTechnicianId || null,
        type: 'resource.maintenance.created',
        payload: JSON.stringify({
          resourceId: resource.id,
          assignmentId: assignment.id,
          quantity: qty
        })
      }
      // @ts-ignore
      await Notification.default.create(notifPayload)
    } catch (e) {
      // ignore notification errors
    }

    return assignment
  }

  public async retire({ params }: HttpContextContract) {
    const resource = await Resource.findOrFail(params.id)
    resource.status = 'retired'
    // Optionally set quantityAvailable to zero so it's not assignable
    resource.quantityAvailable = 0
    await resource.save()
    // best-effort notification
    try {
      const Notification = await import('App/Models/Notification')
      const notifPayload = {
        userId: resource.createdById || null,
        type: 'resource.retired',
        payload: JSON.stringify({ resourceId: resource.id })
      }
      // @ts-ignore
      await Notification.default.create(notifPayload)
    } catch (e) {}
    return resource
  }

  public async reactivate({ params }: HttpContextContract) {
    const resource = await Resource.findOrFail(params.id)
    resource.status = 'available'
    // if available count is zero, restore to total
    if (!resource.quantityAvailable || resource.quantityAvailable <= 0) {
      resource.quantityAvailable = resource.quantityTotal ?? 0
    }
    await resource.save()
    try {
      const Notification = await import('App/Models/Notification')
      const notifPayload = {
        userId: resource.createdById || null,
        type: 'resource.reactivated',
        payload: JSON.stringify({ resourceId: resource.id })
      }
      // @ts-ignore
      await Notification.default.create(notifPayload)
    } catch (e) {}
    return resource
  }
}
