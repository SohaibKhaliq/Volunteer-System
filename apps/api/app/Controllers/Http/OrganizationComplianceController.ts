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
    const payload = request.only([
      'user_id',
      'doc_type',
      'issued_at',
      'expires_at',
      'metadata',
      'status'
    ])
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

  public async stats({ auth, response }: HttpContextContract) {
    // Find organization for the current user to scope the stats
    // Assuming we want stats for the organization the user belongs to
    // We need to import OrganizationTeamMember to find the org
    // For now, if we can't find org, we return 0
    // Ideally, this logic should be in a service or shared

    // Scope stats to the authenticated user's organization (preferred) or fall back to global counts
    let orgId: number | undefined = undefined
    if (auth?.user) {
      const OrganizationTeamMember = await import('App/Models/OrganizationTeamMember')
      const member = await OrganizationTeamMember.default
        .query()
        .where('user_id', auth.user!.id)
        .first()
      if (member) orgId = member.organizationId
    }

    const baseQuery = ComplianceDocument.query()
    if (typeof orgId !== 'undefined') baseQuery.where('organization_id', orgId)

    const pendingDocuments = await baseQuery.clone().where('status', 'Pending').count('* as total')
    const expiringSoon = await baseQuery
      .clone()
      .where('expires_at', '<', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) // 30 days
      .count('* as total')

    const totalDocs = await baseQuery.clone().count('* as total')
    const approvedDocs = await baseQuery.clone().where('status', 'Approved').count('* as total')

    const total = totalDocs[0].$extras.total
    const approved = approvedDocs[0].$extras.total

    const compliantVolunteers = total > 0 ? Math.round((approved / total) * 100) : 0

    return response.ok({
      compliantVolunteers,
      pendingDocuments: pendingDocuments[0].$extras.total,
      expiringSoon: expiringSoon[0].$extras.total
    })
  }
}
