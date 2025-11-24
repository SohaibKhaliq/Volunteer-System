import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import ComplianceDocument from 'App/Models/ComplianceDocument'


export default class OrganizationComplianceController {
  public async index({ request, response }: HttpContextContract) {
    // In a real app, we'd filter by organization's users
    // For now, we'll just return all docs or filter by user_id if provided
    const { user_id } = request.qs()
    const query = ComplianceDocument.query().preload('user')

    if (user_id) {
      query.where('user_id', user_id)
    }

    const docs = await query
    return response.ok(docs)
  }

  public async store({ request, response }: HttpContextContract) {
    const payload = request.only(['user_id', 'doc_type', 'issued_at', 'expires_at', 'metadata', 'status'])
    const doc = await ComplianceDocument.create(payload)
    return response.created(doc)
  }

  public async update({ params, request, response }: HttpContextContract) {
    const doc = await ComplianceDocument.find(params.id)
    if (!doc) return response.notFound()
    
    const payload = request.only(['doc_type', 'issued_at', 'expires_at', 'metadata', 'status'])
    doc.merge(payload)
    await doc.save()
    return response.ok(doc)
  }

  public async destroy({ params, response }: HttpContextContract) {
    const doc = await ComplianceDocument.find(params.id)
    if (!doc) return response.notFound()
    await doc.delete()
    return response.noContent()
  }

  public async stats({ response }: HttpContextContract) {
    // Mock stats for now, or aggregate real data
    // In real implementation:
    // 1. Get all volunteers for the org
    // 2. Check their compliance documents
    
    const compliantVolunteers = 94 // Percentage
    const pendingDocuments = await ComplianceDocument.query().where('status', 'Pending').count('* as total')
    const expiringSoon = await ComplianceDocument.query()
      .where('expires_at', '<', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) // 30 days
      .count('* as total')

    return response.ok({
      compliantVolunteers,
      pendingDocuments: pendingDocuments[0].$extras.total,
      expiringSoon: expiringSoon[0].$extras.total
    })
  }
}
