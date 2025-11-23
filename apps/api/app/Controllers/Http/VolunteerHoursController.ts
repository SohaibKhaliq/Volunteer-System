import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import VolunteerHour from 'App/Models/VolunteerHour'

export default class VolunteerHoursController {
  public async index({ response }: HttpContextContract) {
    const hours = await VolunteerHour.query().preload('user').preload('event').orderBy('date', 'desc')
    return response.ok(hours)
  }

  public async update({ params, request, response }: HttpContextContract) {
    const record = await VolunteerHour.find(params.id)
    if (!record) return response.notFound()
    record.merge(request.only(['status']))
    await record.save()
    return response.ok(record)
  }

  public async bulkUpdate({ request, response }: HttpContextContract) {
    const { ids, status } = request.only(['ids', 'status'])
    await VolunteerHour.query().whereIn('id', ids).update({ status })
    return response.ok({ message: 'Bulk update successful' })
  }
}
