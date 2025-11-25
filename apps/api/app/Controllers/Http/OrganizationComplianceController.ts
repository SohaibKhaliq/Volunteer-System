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

      // If the current user is authenticated but is not a member of any org, mirror
      // the behavior from dashboardStats and return Not Found (404)
      if (!member) return response.notFound({ message: 'User is not part of any organization' })

      orgId = member.organizationId
    }

    // Build a base query scoped to the organization's users when orgId is provided.
    // ComplianceDocument doesn't have an `organization_id` column. Instead, we compute
    // the set of user IDs that belong to the organization (team members + volunteers)
    // and filter ComplianceDocument by those user_ids.
    const baseQuery = ComplianceDocument.query()
    if (typeof orgId !== 'undefined') {
      // load user ids that belong to the organization from team members & volunteers
      const OrganizationTeamMember = await import('App/Models/OrganizationTeamMember')
      const OrganizationVolunteer = await import('App/Models/OrganizationVolunteer')

      const memberRows = await OrganizationTeamMember.default
        .query()
        .where('organization_id', orgId)
        .select('user_id')

      const volunteerRows = await OrganizationVolunteer.default
        .query()
        .where('organization_id', orgId)
        .select('user_id')

      const userIds = new Set<number>()

      // Helper to safely extract a numeric user id and add only valid ids
      const addIfValid = (row: any) => {
        if (!row) return
        // support snake_case, camelCase and id fields
        const raw = row.user_id ?? row.userId ?? row.id
        if (raw === undefined || raw === null) return
        const n = Number(raw)
        if (Number.isInteger(n) && n > 0) userIds.add(n)
      }

      memberRows.forEach((r: any) => addIfValid(r))
      volunteerRows.forEach((r: any) => addIfValid(r))

      if (userIds.size === 0) {
        // no scoped users — return zeros
        return response.ok({ compliantVolunteers: 0, pendingDocuments: 0, expiringSoon: 0 })
      }

      baseQuery.whereIn('user_id', Array.from(userIds))
    }

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
