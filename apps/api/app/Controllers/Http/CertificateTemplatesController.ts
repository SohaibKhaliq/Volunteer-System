import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import CertificateTemplate from 'App/Models/CertificateTemplate'

export default class CertificateTemplatesController {
  public async index({ request, response }: HttpContextContract) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 10)
    const templates = await CertificateTemplate.query().paginate(page, limit)
    return response.ok(templates)
  }

  public async store({ request, response, auth }: HttpContextContract) {
    const data = request.only(['name', 'background_image_url', 'layout_config', 'is_global'])
    const template = await CertificateTemplate.create({
      ...data,
      createdBy: auth.user?.id,
    })
    return response.created(template)
  }

  public async show({ params, response }: HttpContextContract) {
    const template = await CertificateTemplate.findOrFail(params.id)
    await template.load('creator')
    return response.ok(template)
  }

  public async update({ params, request, response }: HttpContextContract) {
    const template = await CertificateTemplate.findOrFail(params.id)
    const data = request.only(['name', 'background_image_url', 'layout_config', 'is_global'])
    template.merge(data)
    await template.save()
    return response.ok(template)
  }

  public async destroy({ params, response }: HttpContextContract) {
    const template = await CertificateTemplate.findOrFail(params.id)
    await template.delete()
    return response.noContent()
  }
}
