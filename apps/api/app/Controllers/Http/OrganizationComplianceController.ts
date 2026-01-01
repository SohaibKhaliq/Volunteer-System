import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import ComplianceDocument from 'App/Models/ComplianceDocument'

export default class OrganizationComplianceController {
  public async index({ auth, request, response }: HttpContextContract) {
    const { user_id } = request.qs()
    const user = auth.user!

    const OrganizationTeamMember = await import('App/Models/OrganizationTeamMember')
    const member = await OrganizationTeamMember.default.query().where('user_id', user.id).first()

    if (!member) {
      return response.forbidden({ message: 'You are not an organization admin' })
    }

    const orgId = member.organizationId

    // Get all users in this organization (team members + volunteers)
    const OrganizationVolunteer = await import('App/Models/OrganizationVolunteer')

    // Subquery for volunteers
    const volunteerUserIds = await OrganizationVolunteer.default
      .query()
      .where('organization_id', orgId)
      .select('user_id')

    // Subquery for team members
    const teamUserIds = await OrganizationTeamMember.default
      .query()
      .where('organization_id', orgId)
      .select('user_id')

    const userIds = [...volunteerUserIds.map((v) => v.userId), ...teamUserIds.map((t) => t.userId)]

    // Filter by specific user if requested, but ensure they are in the org
    if (user_id) {
      if (!userIds.includes(Number(user_id))) {
        return response.ok([]) // Or forbidden, but empty list is safer for search
      }
      const docs = await ComplianceDocument.query().where('user_id', user_id).preload('user')
      return response.ok(docs)
    }

    const docs = await ComplianceDocument.query().whereIn('user_id', userIds).preload('user')

    return response.ok(docs)
  }

  public async store({ auth, request, response }: HttpContextContract) {
    // Admin creating doc for a user?
    // For now, let's assume this is for manual uploading by admins for a user
    // We must verify the target user is in the org
    const user = auth.user!
    const OrganizationTeamMember = await import('App/Models/OrganizationTeamMember')
    const member = await OrganizationTeamMember.default.query().where('user_id', user.id).first()

    if (!member) return response.forbidden({ message: 'Not an org admin' })

    const payload = request.only([
      'user_id',
      'doc_type',
      'issued_at',
      'expires_at',
      'metadata',
      'status'
    ])

    // Verify target user is in org
    const targetUserId = payload.user_id
    const OrganizationVolunteer = await import('App/Models/OrganizationVolunteer')
    const isVolunteer = await OrganizationVolunteer.default
      .query()
      .where('organization_id', member.organizationId)
      .where('user_id', targetUserId)
      .first()

    const isTeam = await OrganizationTeamMember.default
      .query()
      .where('organization_id', member.organizationId)
      .where('user_id', targetUserId)
      .first()

    if (!isVolunteer && !isTeam) {
      return response.forbidden({ message: 'User does not belong to your organization' })
    }

    const doc = await ComplianceDocument.create(payload)
    return response.created(doc)
  }

  public async update({ auth, params, request, response }: HttpContextContract) {
    const user = auth.user!
    const OrganizationTeamMember = await import('App/Models/OrganizationTeamMember')
    const member = await OrganizationTeamMember.default.query().where('user_id', user.id).first()

    if (!member) return response.forbidden({ message: 'Not an org admin' })

    const doc = await ComplianceDocument.find(params.id)
    if (!doc) return response.notFound()

    // Verify doc owner is in org
    const OrganizationVolunteer = await import('App/Models/OrganizationVolunteer')
    const isVolunteer = await OrganizationVolunteer.default
      .query()
      .where('organization_id', member.organizationId)
      .where('user_id', doc.userId)
      .first()

    const isTeam = await OrganizationTeamMember.default
      .query()
      .where('organization_id', member.organizationId)
      .where('user_id', doc.userId)
      .first()

    if (!isVolunteer && !isTeam) {
      return response.forbidden({ message: 'Document does not belong to your organization' })
    }

    const payload = request.only(['doc_type', 'issued_at', 'expires_at', 'metadata', 'status'])
    doc.merge(payload)
    await doc.save()
    return response.ok(doc)
  }

  public async destroy({ auth, params, response }: HttpContextContract) {
    const user = auth.user!
    const OrganizationTeamMember = await import('App/Models/OrganizationTeamMember')
    const member = await OrganizationTeamMember.default.query().where('user_id', user.id).first()

    if (!member) return response.forbidden({ message: 'Not an org admin' })

    const doc = await ComplianceDocument.find(params.id)
    if (!doc) return response.notFound()

    // Verify doc owner is in org
    const OrganizationVolunteer = await import('App/Models/OrganizationVolunteer')
    const isVolunteer = await OrganizationVolunteer.default
      .query()
      .where('organization_id', member.organizationId)
      .where('user_id', doc.userId)
      .first()

    const isTeam = await OrganizationTeamMember.default
      .query()
      .where('organization_id', member.organizationId)
      .where('user_id', doc.userId)
      .first()

    if (!isVolunteer && !isTeam) {
      return response.forbidden({ message: 'Document does not belong to your organization' })
    }

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
    let orgId: number | undefined
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
