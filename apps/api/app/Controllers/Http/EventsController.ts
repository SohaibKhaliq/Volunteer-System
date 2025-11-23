import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Event from 'App/Models/Event'

export default class EventsController {
  public async index({ request, response }: HttpContextContract) {
    const query = request.qs()
    const events = await Event.query().preload('tasks').orderBy('start_at', 'asc')

    return response.ok(events)
  }

  public async store({ request, response, auth }: HttpContextContract) {
    const payload = request.only([
      'title',
      'description',
      'location',
      'start_at',
      'end_at',
      'recurring_rule',
      'capacity',
      'organization_id'
    ])
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
    event.merge(
      request.only([
        'title',
        'description',
        'location',
        'start_at',
        'end_at',
        'recurring_rule',
        'capacity',
        'is_published'
      ])
    )
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
