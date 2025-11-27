import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import AuditLog from 'App/Models/AuditLog'

export default class AuditLogsController {
  public async index({ request }: HttpContextContract) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 20)
    return AuditLog.query().preload('user').orderBy('createdAt', 'desc').paginate(page, limit)
  }

  public async show({ params }: HttpContextContract) {
    return AuditLog.findOrFail(params.id)
  }
}
