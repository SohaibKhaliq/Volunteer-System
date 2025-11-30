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

    const query = Resource.query().preload('organization')

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
    const total = await Resource.query().count('* as total').first()
    const available = await Resource.query()
      .where('status', 'available')
      .count('* as total')
      .first()
    const inUse = await Resource.query().where('status', 'in_use').count('* as total').first()
    const maintenance = await Resource.query()
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
    const resources = await Resource.query().whereRaw(
      'quantity_total > 0 AND (quantity_available / quantity_total) < 0.1'
    )
    return resources
  }

  public async maintenanceDue({}: HttpContextContract) {
    const now = new Date()
    const soon = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) // next 7 days
    const resources = await Resource.query()
      .whereNotNull('maintenance_due')
      .whereBetween('maintenance_due', [now.toISOString(), soon.toISOString()])
    return resources
  }

  public async store({ request }: HttpContextContract) {
    const payload = createResourceSchema.parse(request.only(Object.keys(request.body()) as any))

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

    const resource = await Resource.create(data)
    return resource
  }

  public async show({ params }: HttpContextContract) {
    const resource = await Resource.findOrFail(params.id)
    await resource.load('assignments')
    return resource
  }

  public async update({ params, request }: HttpContextContract) {
    const resource = await Resource.findOrFail(params.id)
    const payload = updateResourceSchema.parse(request.only(Object.keys(request.body()) as any))
    resource.merge(payload as any)
    await resource.save()
    return resource
  }

  public async destroy({ params }: HttpContextContract) {
    const resource = await Resource.findOrFail(params.id)
    await resource.delete()
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
}
