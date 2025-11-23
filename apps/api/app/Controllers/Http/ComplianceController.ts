import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import ComplianceDocument from 'App/Models/ComplianceDocument'

export default class ComplianceController {
  public async index({ response }: HttpContextContract) {
    const docs = await ComplianceDocument.query().preload('user')
    return response.ok(docs)
  }

  public async store({ request, response }: HttpContextContract) {
    const payload = request.only(['user_id', 'doc_type', 'issued_at', 'expires_at', 'metadata'])
    const doc = await ComplianceDocument.create(payload)
    return response.created(doc)
  }

  public async show({ params, response }: HttpContextContract) {
    const doc = await ComplianceDocument.find(params.id)
    if (!doc) return response.notFound()
    return response.ok(doc)
  }

  public async update({ params, request, response }: HttpContextContract) {
    const doc = await ComplianceDocument.find(params.id)
    if (!doc) return response.notFound()
    doc.merge(request.only(['doc_type', 'issued_at', 'expires_at', 'status', 'metadata']))
    await doc.save()
    return response.ok(doc)
  }

  public async destroy({ params, response }: HttpContextContract) {
    const doc = await ComplianceDocument.find(params.id)
    if (!doc) return response.notFound()
    await doc.delete()
    return response.noContent()
  }
  public async remind({ response }: HttpContextContract) {
    // Logic to send compliance reminder
    return response.ok({ message: 'Compliance reminder sent' })
  }
}
