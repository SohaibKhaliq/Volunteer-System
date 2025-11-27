import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import BackgroundCheck from 'App/Models/BackgroundCheck'

export default class BackgroundChecksController {
  public async index({ response }: HttpContextContract) {
    const checks = await BackgroundCheck.query().preload('user')
    return response.ok(checks)
  }

  public async store({ request, response }: HttpContextContract) {
    const payload = request.only(['user_id', 'notes', 'requested_at'])
    const check = await BackgroundCheck.create(payload)
    return response.created(check)
  }

  public async show({ params, response }: HttpContextContract) {
    const check = await BackgroundCheck.find(params.id)
    if (!check) return response.notFound()
    await check.load('user')
    return response.ok(check)
  }

  public async update({ params, request, response }: HttpContextContract) {
    const check = await BackgroundCheck.find(params.id)
    if (!check) return response.notFound()
    check.merge(request.only(['status', 'result', 'completed_at', 'notes']))
    await check.save()
    return response.ok(check)
  }

  public async destroy({ params, response }: HttpContextContract) {
    const check = await BackgroundCheck.find(params.id)
    if (!check) return response.notFound()
    await check.delete()
    return response.noContent()
  }
}
