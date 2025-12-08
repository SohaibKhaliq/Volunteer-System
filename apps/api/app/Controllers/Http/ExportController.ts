import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import OrganizationTeamMember from 'App/Models/OrganizationTeamMember'
import OrganizationVolunteer from 'App/Models/OrganizationVolunteer'
import Opportunity from 'App/Models/Opportunity'
import Application from 'App/Models/Application'
import Attendance from 'App/Models/Attendance'
import Database from '@ioc:Adonis/Lucid/Database'
import { DateTime } from 'luxon'

// Allowed roles for export operations
const EXPORT_ALLOWED_ROLES = ['admin', 'coordinator', 'Admin', 'Coordinator']

export default class ExportController {
  /**
   * Check if user has export permission
   */
  private hasExportPermission(role: string | null): boolean {
    return EXPORT_ALLOWED_ROLES.includes(role || '')
  }

  /**
   * Export volunteers as CSV
   */
  public async exportVolunteers({ auth, request, response }: HttpContextContract) {
    const user = auth.user!
    const memberRecord = await OrganizationTeamMember.query().where('user_id', user.id).first()

    if (!memberRecord) {
      return response.notFound({ message: 'User is not part of any organization' })
    }

    // Check permission
    if (!this.hasExportPermission(memberRecord.role)) {
      return response.forbidden({ message: 'You do not have permission to export data' })
    }

    const { status, startDate, endDate } = request.qs()

    let query = Database.from('organization_volunteers')
      .join('users', 'organization_volunteers.user_id', 'users.id')
      .where('organization_volunteers.organization_id', memberRecord.organizationId)
      .select(
        'users.id',
        'users.email',
        'users.first_name',
        'users.last_name',
        'organization_volunteers.role',
        'organization_volunteers.status',
        'organization_volunteers.hours',
        'organization_volunteers.rating',
        'organization_volunteers.created_at as joined_at'
      )

    if (status) {
      query = query.where('organization_volunteers.status', status)
    }

    if (startDate) {
      query = query.where('organization_volunteers.created_at', '>=', startDate)
    }

    if (endDate) {
      query = query.where('organization_volunteers.created_at', '<=', endDate)
    }

    const volunteers = await query.orderBy('organization_volunteers.created_at', 'desc')

    // Generate CSV
    const headers = [
      'ID',
      'Email',
      'First Name',
      'Last Name',
      'Role',
      'Status',
      'Hours',
      'Rating',
      'Joined At'
    ]
    const rows = volunteers.map((v) => [
      v.id,
      this.escapeCsv(v.email),
      this.escapeCsv(v.first_name || ''),
      this.escapeCsv(v.last_name || ''),
      this.escapeCsv(v.role || ''),
      this.escapeCsv(v.status || ''),
      v.hours || 0,
      v.rating || 0,
      v.joined_at ? new Date(v.joined_at).toISOString() : ''
    ])

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')

    response.header('Content-Type', 'text/csv')
    response.header('Content-Disposition', `attachment; filename="volunteers-${Date.now()}.csv"`)
    return response.send(csv)
  }

  /**
   * Export opportunities as CSV
   */
  public async exportOpportunities({ auth, request, response }: HttpContextContract) {
    const user = auth.user!
    const memberRecord = await OrganizationTeamMember.query().where('user_id', user.id).first()

    if (!memberRecord) {
      return response.notFound({ message: 'User is not part of any organization' })
    }

    if (!allowedRoles.includes(memberRecord.role || '')) {
      return response.forbidden({ message: 'You do not have permission to export data' })
    }

    const { status, startDate, endDate } = request.qs()

    let query = Opportunity.query()
      .where('organization_id', memberRecord.organizationId)
      .preload('team')

    if (status) {
      query = query.where('status', status)
    }

    if (startDate) {
      query = query.where('start_at', '>=', DateTime.fromISO(startDate).toSQL())
    }

    if (endDate) {
      query = query.where('start_at', '<=', DateTime.fromISO(endDate).toSQL())
    }

    const opportunities = await query.orderBy('start_at', 'desc')

    const headers = [
      'ID',
      'Title',
      'Description',
      'Location',
      'Team',
      'Type',
      'Status',
      'Visibility',
      'Capacity',
      'Start At',
      'End At'
    ]
    const rows = opportunities.map((o) => [
      o.id,
      this.escapeCsv(o.title),
      this.escapeCsv(o.description || ''),
      this.escapeCsv(o.location || ''),
      this.escapeCsv(o.team?.name || ''),
      this.escapeCsv(o.type),
      this.escapeCsv(o.status),
      this.escapeCsv(o.visibility),
      o.capacity,
      o.startAt?.toISO() || '',
      o.endAt?.toISO() || ''
    ])

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')

    response.header('Content-Type', 'text/csv')
    response.header('Content-Disposition', `attachment; filename="opportunities-${Date.now()}.csv"`)
    return response.send(csv)
  }

  /**
   * Export applications as CSV
   */
  public async exportApplications({ auth, request, response }: HttpContextContract) {
    const user = auth.user!
    const memberRecord = await OrganizationTeamMember.query().where('user_id', user.id).first()

    if (!memberRecord) {
      return response.notFound({ message: 'User is not part of any organization' })
    }

    if (!allowedRoles.includes(memberRecord.role || '')) {
      return response.forbidden({ message: 'You do not have permission to export data' })
    }

    const { status, opportunityId, startDate, endDate } = request.qs()

    let query = Database.from('applications')
      .join('opportunities', 'applications.opportunity_id', 'opportunities.id')
      .join('users', 'applications.user_id', 'users.id')
      .where('opportunities.organization_id', memberRecord.organizationId)
      .select(
        'applications.id',
        'opportunities.title as opportunity_title',
        'users.email',
        'users.first_name',
        'users.last_name',
        'applications.status',
        'applications.applied_at',
        'applications.responded_at',
        'applications.notes'
      )

    if (status) {
      query = query.where('applications.status', status)
    }

    if (opportunityId) {
      query = query.where('applications.opportunity_id', opportunityId)
    }

    if (startDate) {
      query = query.where('applications.applied_at', '>=', startDate)
    }

    if (endDate) {
      query = query.where('applications.applied_at', '<=', endDate)
    }

    const applications = await query.orderBy('applications.applied_at', 'desc')

    const headers = [
      'ID',
      'Opportunity',
      'Email',
      'First Name',
      'Last Name',
      'Status',
      'Applied At',
      'Responded At',
      'Notes'
    ]
    const rows = applications.map((a) => [
      a.id,
      this.escapeCsv(a.opportunity_title),
      this.escapeCsv(a.email),
      this.escapeCsv(a.first_name || ''),
      this.escapeCsv(a.last_name || ''),
      this.escapeCsv(a.status),
      a.applied_at ? new Date(a.applied_at).toISOString() : '',
      a.responded_at ? new Date(a.responded_at).toISOString() : '',
      this.escapeCsv(a.notes || '')
    ])

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')

    response.header('Content-Type', 'text/csv')
    response.header('Content-Disposition', `attachment; filename="applications-${Date.now()}.csv"`)
    return response.send(csv)
  }

  /**
   * Export attendances as CSV
   */
  public async exportAttendances({ auth, request, response }: HttpContextContract) {
    const user = auth.user!
    const memberRecord = await OrganizationTeamMember.query().where('user_id', user.id).first()

    if (!memberRecord) {
      return response.notFound({ message: 'User is not part of any organization' })
    }

    if (!allowedRoles.includes(memberRecord.role || '')) {
      return response.forbidden({ message: 'You do not have permission to export data' })
    }

    const { opportunityId, startDate, endDate } = request.qs()

    let query = Database.from('attendances')
      .join('opportunities', 'attendances.opportunity_id', 'opportunities.id')
      .join('users', 'attendances.user_id', 'users.id')
      .where('opportunities.organization_id', memberRecord.organizationId)
      .select(
        'attendances.id',
        'opportunities.title as opportunity_title',
        'users.email',
        'users.first_name',
        'users.last_name',
        'attendances.check_in_at',
        'attendances.check_out_at',
        'attendances.method'
      )

    if (opportunityId) {
      query = query.where('attendances.opportunity_id', opportunityId)
    }

    if (startDate) {
      query = query.where('attendances.check_in_at', '>=', startDate)
    }

    if (endDate) {
      query = query.where('attendances.check_in_at', '<=', endDate)
    }

    const attendances = await query.orderBy('attendances.check_in_at', 'desc')

    const headers = [
      'ID',
      'Opportunity',
      'Email',
      'First Name',
      'Last Name',
      'Check-in At',
      'Check-out At',
      'Method',
      'Duration (hours)'
    ]
    const rows = attendances.map((a) => {
      const checkIn = a.check_in_at ? new Date(a.check_in_at) : null
      const checkOut = a.check_out_at ? new Date(a.check_out_at) : null
      const durationHours =
        checkIn && checkOut
          ? Math.round(((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60)) * 100) / 100
          : ''

      return [
        a.id,
        this.escapeCsv(a.opportunity_title),
        this.escapeCsv(a.email),
        this.escapeCsv(a.first_name || ''),
        this.escapeCsv(a.last_name || ''),
        checkIn?.toISOString() || '',
        checkOut?.toISOString() || '',
        this.escapeCsv(a.method || ''),
        durationHours
      ]
    })

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')

    response.header('Content-Type', 'text/csv')
    response.header('Content-Disposition', `attachment; filename="attendances-${Date.now()}.csv"`)
    return response.send(csv)
  }

  /**
   * Export volunteer hours as CSV
   */
  public async exportHours({ auth, request, response }: HttpContextContract) {
    const user = auth.user!
    const memberRecord = await OrganizationTeamMember.query().where('user_id', user.id).first()

    if (!memberRecord) {
      return response.notFound({ message: 'User is not part of any organization' })
    }

    if (!allowedRoles.includes(memberRecord.role || '')) {
      return response.forbidden({ message: 'You do not have permission to export data' })
    }

    const { status, startDate, endDate, volunteerId } = request.qs()

    let query = Database.from('volunteer_hours')
      .join('organization_volunteers', 'volunteer_hours.user_id', 'organization_volunteers.user_id')
      .join('users', 'volunteer_hours.user_id', 'users.id')
      .leftJoin('events', 'volunteer_hours.event_id', 'events.id')
      .where('organization_volunteers.organization_id', memberRecord.organizationId)
      .select(
        'volunteer_hours.id',
        'users.email',
        'users.first_name',
        'users.last_name',
        'volunteer_hours.hours',
        'volunteer_hours.date',
        'volunteer_hours.description',
        'volunteer_hours.status',
        'events.title as event_title'
      )

    if (status) {
      query = query.where('volunteer_hours.status', status)
    }

    if (volunteerId) {
      query = query.where('volunteer_hours.user_id', volunteerId)
    }

    if (startDate) {
      query = query.where('volunteer_hours.date', '>=', startDate)
    }

    if (endDate) {
      query = query.where('volunteer_hours.date', '<=', endDate)
    }

    const hours = await query.orderBy('volunteer_hours.date', 'desc')

    const headers = [
      'ID',
      'Email',
      'First Name',
      'Last Name',
      'Hours',
      'Date',
      'Description',
      'Status',
      'Event'
    ]
    const rows = hours.map((h) => [
      h.id,
      this.escapeCsv(h.email),
      this.escapeCsv(h.first_name || ''),
      this.escapeCsv(h.last_name || ''),
      h.hours,
      h.date ? new Date(h.date).toISOString().split('T')[0] : '',
      this.escapeCsv(h.description || ''),
      this.escapeCsv(h.status || ''),
      this.escapeCsv(h.event_title || '')
    ])

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')

    response.header('Content-Type', 'text/csv')
    response.header(
      'Content-Disposition',
      `attachment; filename="volunteer-hours-${Date.now()}.csv"`
    )
    return response.send(csv)
  }

  /**
   * Escape CSV value
   */
  private escapeCsv(value: string): string {
    if (!value) return ''
    // If contains comma, newline, or quote, wrap in quotes and escape existing quotes
    if (value.includes(',') || value.includes('\n') || value.includes('"')) {
      return `"${value.replace(/"/g, '""')}"`
    }
    return value
  }
}
