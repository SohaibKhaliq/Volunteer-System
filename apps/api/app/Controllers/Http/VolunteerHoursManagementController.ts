import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import OrganizationTeamMember from 'App/Models/OrganizationTeamMember'

export default class VolunteerHoursManagementController {
  /**
   * Get pending volunteer hours for organization
   */
  public async pending({ auth, request, response }: HttpContextContract) {
    const user = auth.user!
    const memberRecord = await OrganizationTeamMember.query().where('user_id', user.id).first()

    if (!memberRecord) {
      return response.notFound({ message: 'User is not part of any organization' })
    }

    const orgId = memberRecord.organizationId
    const { page = 1, limit = 20, userId, startDate, endDate } = request.qs()

    let query = Database
      .from('volunteer_hours')
      .join('organization_volunteers', 'volunteer_hours.user_id', 'organization_volunteers.user_id')
      .join('users', 'users.id', 'volunteer_hours.user_id')
      .leftJoin('events', 'events.id', 'volunteer_hours.event_id')
      .where('organization_volunteers.organization_id', orgId)
      .where('volunteer_hours.status', 'pending')
      .select(
        'volunteer_hours.*',
        'users.first_name',
        'users.last_name',
        'users.email',
        'events.title as event_title'
      )
      .orderBy('volunteer_hours.date', 'desc')

    if (userId) {
      query = query.where('volunteer_hours.user_id', userId)
    }
    if (startDate) {
      query = query.where('volunteer_hours.date', '>=', startDate)
    }
    if (endDate) {
      query = query.where('volunteer_hours.date', '<=', endDate)
    }

    const hours = await query.paginate(page, limit)

    return response.ok(hours)
  }

  /**
   * Approve a single hour log
   */
  public async approve({ auth, params, request, response }: HttpContextContract) {
    const user = auth.user!
    const memberRecord = await OrganizationTeamMember.query().where('user_id', user.id).first()

    if (!memberRecord) {
      return response.notFound({ message: 'User is not part of any organization' })
    }

    const { notes } = request.only(['notes'])

    const hour = await Database
      .from('volunteer_hours')
      .where('id', params.id)
      .first()

    if (!hour) {
      return response.notFound({ message: 'Hour log not found' })
    }

    // Verify the hour belongs to a volunteer in this organization
    const volunteerBelongsToOrg = await Database
      .from('organization_volunteers')
      .where('organization_id', memberRecord.organizationId)
      .where('user_id', hour.user_id)
      .first()

    if (!volunteerBelongsToOrg) {
      return response.forbidden({ message: 'Hour log does not belong to your organization' })
    }

    await Database
      .from('volunteer_hours')
      .where('id', params.id)
      .update({
        status: 'approved',
        notes: notes ||hour.notes,
        approved_by: user.id,
        approved_at: Database.raw('NOW()')
      })

    return response.ok({ message: 'Hour log approved successfully' })
  }

  /**
   * Reject a single hour log
   */
  public async reject({ auth, params, request, response }: HttpContextContract) {
    const user = auth.user!
    const memberRecord = await OrganizationTeamMember.query().where('user_id', user.id).first()

    if (!memberRecord) {
      return response.notFound({ message: 'User is not part of any organization' })
    }

    const { reason } = request.only(['reason'])

    const hour = await Database
      .from('volunteer_hours')
      .where('id', params.id)
      .first()

    if (!hour) {
      return response.notFound({ message: 'Hour log not found' })
    }

    // Verify the hour belongs to a volunteer in this organization
    const volunteerBelongsToOrg = await Database
      .from('organization_volunteers')
      .where('organization_id', memberRecord.organizationId)
      .where('user_id', hour.user_id)
      .first()

    if (!volunteerBelongsToOrg) {
      return response.forbidden({ message: 'Hour log does not belong to your organization' })
    }

    await Database
      .from('volunteer_hours')
      .where('id', params.id)
      .update({
        status: 'rejected',
        notes: reason || 'Rejected by organization',
        approved_by: user.id,
        approved_at: Database.raw('NOW()')
      })

    return response.ok({ message: 'Hour log rejected successfully' })
  }

  /**
   * Bulk approve hour logs
   */
  public async bulkApprove({ auth, request, response }: HttpContextContract) {
    const user = auth.user!
    const memberRecord = await OrganizationTeamMember.query().where('user_id', user.id).first()

    if (!memberRecord) {
      return response.notFound({ message: 'User is not part of any organization' })
    }

    const { ids } = request.only(['ids'])

    if (!Array.isArray(ids) || ids.length === 0) {
      return response.badRequest({ message: 'ids must be a non-empty array' })
    }

    // Verify all hours belong to volunteers in this organization
    const hours = await Database
      .from('volunteer_hours')
      .join('organization_volunteers', 'volunteer_hours.user_id', 'organization_volunteers.user_id')
      .where('organization_volunteers.organization_id', memberRecord.organizationId)
      .whereIn('volunteer_hours.id', ids)
      .select('volunteer_hours.id')

    const validIds = hours.map(h => h.id)

    if (validIds.length !== ids.length) {
      return response.badRequest({ 
        message: 'Some hour logs do not belong to your organization',
        valid_count: validIds.length,
        requested_count: ids.length
      })
    }

    await Database
      .from('volunteer_hours')
      .whereIn('id', validIds)
      .update({
        status: 'approved',
        approved_by: user.id,
        approved_at: Database.raw('NOW()')
      })

    return response.ok({ 
      message: `${validIds.length} hour logs approved successfully`,
      approved_count: validIds.length
    })
  }

  /**
   * Get all hours for a specific volunteer
   */
  public async volunteerHours({ auth, params, request, response }: HttpContextContract) {
    const user = auth.user!
    const memberRecord = await OrganizationTeamMember.query().where('user_id', user.id).first()

    if (!memberRecord) {
      return response.notFound({ message: 'User is not part of any organization' })
    }

    const { status, startDate, endDate, page = 1, limit = 50 } = request.qs()

    // Verify volunteer belongs to org
    const volunteerBelongsToOrg = await Database
      .from('organization_volunteers')
      .where('organization_id', memberRecord.organizationId)
      .where('user_id', params.id)
      .first()

    if (!volunteerBelongsToOrg) {
      return response.forbidden({ message: 'Volunteer does not belong to your organization' })
    }

    let query = Database
      .from('volunteer_hours')
      .leftJoin('events', 'events.id', 'volunteer_hours.event_id')
      .where('volunteer_hours.user_id', params.id)
      .select(
        'volunteer_hours.*',
        'events.title as event_title'
      )
      .orderBy('volunteer_hours.date', 'desc')

    if (status) {
      query = query.where('volunteer_hours.status', status)
    }
    if (startDate) {
      query = query.where('volunteer_hours.date', '>=', startDate)
    }
    if (endDate) {
      query = query.where('volunteer_hours.date', '<=', endDate)
    }

    const hours = await query.paginate(page, limit)

    return response.ok(hours)
  }
}
