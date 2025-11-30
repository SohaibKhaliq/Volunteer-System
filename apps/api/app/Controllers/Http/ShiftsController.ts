import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Shift from 'App/Models/Shift'
import { createShiftSchema, updateShiftSchema } from 'App/Validators/shiftValidator'

export default class ShiftsController {
  public async index({ request }: HttpContextContract) {
    const eventId = request.input('event_id')
    const query = Shift.query()
    if (eventId) query.where('event_id', eventId)
    return query.orderBy('start_at', 'asc')
  }

  public async show({ params }: HttpContextContract) {
    const shift = await Shift.findOrFail(params.id)
    await shift.loadMany(['tasks', 'assignments'])
    return shift
  }

  public async store({ request, auth, response }: HttpContextContract) {
    const payload = createShiftSchema.parse(request.only(Object.keys(request.body())))
    // basic validation: start < end
    if (
      payload.start_at &&
      payload.end_at &&
      new Date(payload.start_at) >= new Date(payload.end_at)
    ) {
      return response.badRequest({ message: 'start_at must be before end_at' })
    }
    const shift = await Shift.create(payload as any)
    return shift
  }

  public async update({ params, request }: HttpContextContract) {
    const shift = await Shift.findOrFail(params.id)
    const payload = updateShiftSchema.parse(request.only(Object.keys(request.body())))
    if (
      payload.start_at &&
      payload.end_at &&
      new Date(payload.start_at) >= new Date(payload.end_at)
    ) {
      return { message: 'start_at must be before end_at' } as any
    }
    shift.merge(payload as any)
    await shift.save()
    return shift
  }

  public async destroy({ params }: HttpContextContract) {
    const shift = await Shift.findOrFail(params.id)
    await shift.delete()
  }
}
