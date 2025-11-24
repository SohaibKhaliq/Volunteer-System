import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import VolunteerHour from 'App/Models/VolunteerHour'

export default class VolunteerHoursController {
  public async index({ response }: HttpContextContract) {
    const hours = await VolunteerHour.query()
      .preload('user')
      .preload('event')
      .orderBy('date', 'desc')

    // Normalize Lucid models into plain objects for the frontend
    const mapped = hours.map((h) => {
      const attrs: any = (h as any).$attributes ?? (h as any).$original ?? h.toJSON()

      // user may be a Lucid relation with internals
      const rawUser = (h as any).$preloaded?.user ?? (h as any).user ?? attrs.user ?? null
      const userSrc = rawUser ? (rawUser.$attributes ?? rawUser.$original ?? rawUser) : null

      const rawEvent = (h as any).$preloaded?.event ?? (h as any).event ?? attrs.event ?? null
      const eventSrc = rawEvent ? (rawEvent.$attributes ?? rawEvent.$original ?? rawEvent) : null

      return {
        id: attrs.id,
        date: attrs.date ? (attrs.date.toString?.() ?? attrs.date) : attrs.date,
        hours: attrs.hours,
        status: attrs.status,
        createdAt: attrs.createdAt ?? attrs.created_at,
        updatedAt: attrs.updatedAt ?? attrs.updated_at,
        user: userSrc
          ? {
              id: userSrc.id,
              email: userSrc.email,
              firstName: userSrc.firstName ?? userSrc.first_name,
              lastName: userSrc.lastName ?? userSrc.last_name
            }
          : null,
        event: eventSrc
          ? {
              id: eventSrc.id,
              title: eventSrc.title
            }
          : null
      }
    })

    return response.ok(mapped)
  }

  public async update({ params, request, response }: HttpContextContract) {
    const record = await VolunteerHour.find(params.id)
    if (!record) return response.notFound()
    record.merge(request.only(['status']))
    await record.save()
    // return a normalized shape
    const rec = record.toJSON() as any
    return response.ok({ id: rec.id, status: rec.status })
  }

  public async bulkUpdate({ request, response }: HttpContextContract) {
    const { ids, status } = request.only(['ids', 'status'])
    await VolunteerHour.query().whereIn('id', ids).update({ status })
    return response.ok({ message: 'Bulk update successful' })
  }
}
