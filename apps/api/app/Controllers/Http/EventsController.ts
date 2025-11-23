import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Event from 'App/Models/Event'

export default class EventsController {
  public async index({ response }: HttpContextContract) {
    const events = await Event.query().preload('tasks').orderBy('start_at', 'asc')

    return response.ok(events)
  }

  public async store({ request, response }: HttpContextContract) {
    const raw = request.only([
      'title',
      'description',
      'location',
      'start_at',
      'end_at',
      'recurring_rule',
      'is_recurring',
      'capacity',
      'organization_id',
      'is_published'
    ])

    // Normalize snake_case payload keys to model camelCase properties
    const payload: any = {}
    if (raw.title) payload.title = raw.title
    if (raw.description) payload.description = raw.description
    if (raw.location) payload.location = raw.location
    if (raw.start_at) payload.startAt = raw.start_at
    if (raw.end_at) payload.endAt = raw.end_at
    if (raw.recurring_rule) payload.recurringRule = raw.recurring_rule
    if (typeof raw.is_recurring !== 'undefined') payload.isRecurring = raw.is_recurring
    if (typeof raw.capacity !== 'undefined') payload.capacity = raw.capacity
    if (typeof raw.organization_id !== 'undefined') payload.organizationId = raw.organization_id
    if (typeof raw.is_published !== 'undefined') payload.isPublished = raw.is_published

    const event = await Event.create(payload)
    return response.created(event)
  }

  public async show({ params, response }: HttpContextContract) {
    const event = await Event.query().where('id', params.id).preload('tasks').first()
    if (!event) return response.notFound()
    return response.ok(event)
  }

  public async update({ params, request, response }: HttpContextContract) {
    const event = await Event.find(params.id)
    if (!event) return response.notFound()
    const raw = request.only([
      'title',
      'description',
      'location',
      'start_at',
      'end_at',
      'recurring_rule',
      'is_recurring',
      'capacity',
      'is_published',
      'organization_id'
    ])

    const normalized: any = {}
    if (raw.title) normalized.title = raw.title
    if (raw.description) normalized.description = raw.description
    if (raw.location) normalized.location = raw.location
    if (raw.start_at) normalized.startAt = raw.start_at
    if (raw.end_at) normalized.endAt = raw.end_at
    if (raw.recurring_rule) normalized.recurringRule = raw.recurring_rule
    if (typeof raw.is_recurring !== 'undefined') normalized.isRecurring = raw.is_recurring
    if (typeof raw.capacity !== 'undefined') normalized.capacity = raw.capacity
    if (typeof raw.is_published !== 'undefined') normalized.isPublished = raw.is_published
    if (typeof raw.organization_id !== 'undefined') normalized.organizationId = raw.organization_id

    event.merge(normalized)
    await event.save()
    return response.ok(event)
  }

  public async destroy({ params, response }: HttpContextContract) {
    const event = await Event.find(params.id)
    if (!event) return response.notFound()
    await event.delete()
    return response.noContent()
  }
  public async aiMatch({ params, response }: HttpContextContract) {
    const event = await Event.find(params.id)
    if (!event) return response.notFound()
    // AI matching logic stub
    return response.ok({ message: 'AI matching initiated', matches: [] })
  }
}
