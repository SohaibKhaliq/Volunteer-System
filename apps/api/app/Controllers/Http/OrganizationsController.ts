import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Organization from 'App/Models/Organization'
import User from 'App/Models/User'
import Database from '@ioc:Adonis/Lucid/Database'
import { DateTime } from 'luxon'
import OrganizationTeamMember from 'App/Models/OrganizationTeamMember'
import User from 'App/Models/User'
import Event from 'App/Models/Event'
import OrganizationVolunteer from 'App/Models/OrganizationVolunteer'

export default class OrganizationsController {
  public async index({ response, request }: HttpContextContract) {
    const { withCounts } = request.qs()
    
    const query = Organization.query()
    
    if (withCounts === 'true') {
      // Load counts for frontend
      const orgs = await query
      const orgsWithCounts = await Promise.all(
        orgs.map(async (org) => {
          const volunteerCount = await org.getVolunteerCount()
          const eventCount = await org.getEventCount()
          return {
            ...org.toJSON(),
            volunteer_count: volunteerCount,
            event_count: eventCount
          }
        })
      )
      return response.ok(orgsWithCounts)
    }
    
    const list = await query
    return response.ok(list)
  }

  public async store({ request, response }: HttpContextContract) {
    const payload = request.only(['name', 'description', 'contact_email', 'contact_phone'])
    const org = await Organization.create(payload)
    return response.created(org)
  }

  public async show({ auth, params, response }: HttpContextContract) {
    // Support two uses:
    // - GET /organizations/:id -> admin/resource-style lookup by id (params.id)
    // - GET /organization/profile -> when no id provided, return the current user's organization

    // If an id param is present, return that organization directly
    if (params?.id) {
      const org = await Organization.find(params.id)
      if (!org) return response.notFound()
      return response.ok(org)
    }

    // Otherwise, resolve the organization for the authenticated user (org panel)
    const user = auth.user!
    const memberRecord = await OrganizationTeamMember.query().where('user_id', user.id).first()
    if (!memberRecord) return response.notFound({ message: 'User is not part of any organization' })

    const org = await Organization.find(memberRecord.organizationId)
    if (!org) return response.notFound()
    
    // Include counts
    const volunteerCount = await org.getVolunteerCount()
    const eventCount = await org.getEventCount()
    
    return response.ok({
      ...org.toJSON(),
      volunteer_count: volunteerCount,
      event_count: eventCount
    })
  }

  public async update({ auth, params, request, response }: HttpContextContract) {
    // Support two uses:
    // - PUT /organizations/:id -> resource-style update by id
    // - PUT /organization/profile -> update the current user's organization

    let org: Organization | null = null

    if (params?.id) {
      org = await Organization.find(params.id)
      if (!org) return response.notFound()
    } else {
      const user = auth.user!
      const memberRecord = await OrganizationTeamMember.query().where('user_id', user.id).first()
      if (!memberRecord)
        return response.notFound({ message: 'User is not part of any organization' })

      org = await Organization.find(memberRecord.organizationId)
      if (!org) return response.notFound()
    }
    org.merge(
      request.only([
        'name',
        'description',
        'contact_email',
        'contact_phone',
        'is_approved',
        'is_active'
      ])
    )
    await org.save()
    return response.ok(org)
  }

  public async destroy({ params, response }: HttpContextContract) {
    const org = await Organization.find(params.id)
    if (!org) return response.notFound()
    await org.delete()
    return response.noContent()
  }

  /**
   * Get all volunteers for an organization
   */
  public async getVolunteers({ params, request, response }: HttpContextContract) {
    const org = await Organization.find(params.id)
    if (!org) return response.notFound({ message: 'Organization not found' })

    const { status, role, search, page = 1, limit = 20 } = request.qs()

    let query = Database
      .from('users')
      .join('organization_volunteers', 'users.id', 'organization_volunteers.user_id')
      .where('organization_volunteers.organization_id', org.id)
      .select(
        'users.*',
        'organization_volunteers.role as org_role',
        'organization_volunteers.status as org_status',
        'organization_volunteers.joined_at'
      )

    // Filters
    if (status) {
      query = query.where('organization_volunteers.status', status)
    }
    if (role) {
      query = query.where('organization_volunteers.role', role)
    }
    if (search) {
      query = query.where((builder) => {
        builder
          .whereILike('users.first_name', `%${search}%`)
          .orWhereILike('users.last_name', `%${search}%`)
          .orWhereILike('users.email', `%${search}%`)
      })
    }

    const volunteers = await query.paginate(page, limit)

    // Add volunteer hours for each
    const volunteersWithStats = await Promise.all(
      volunteers.map(async (volunteer) => {
        const hoursResult = await Database
          .from('volunteer_hours')
          .where('user_id', volunteer.id)
          .where('status', 'approved')
          .sum('hours as total_hours')
        
        const eventsResult = await Database
          .from('assignments')
          .join('tasks', 'tasks.id', 'assignments.task_id')
          .where('assignments.user_id', volunteer.id)
          .whereNotNull('tasks.event_id')
          .countDistinct('tasks.event_id as event_count')

        return {
          ...volunteer,
          total_hours: hoursResult[0]?.total_hours || 0,
          events_attended: eventsResult[0]?.event_count || 0
        }
      })
    )

    return response.ok(volunteersWithStats)
  }

  /**
   * Add a volunteer to organization
   */
  public async addVolunteer({ params, request, response }: HttpContextContract) {
    const org = await Organization.find(params.id)
    if (!org) return response.notFound({ message: 'Organization not found' })

    const { user_id, role = 'volunteer', status = 'active', notes } = request.only([
      'user_id',
      'role',
      'status',
      'notes'
    ])

    const user = await User.find(user_id)
    if (!user) return response.notFound({ message: 'User not found' })

    // Check if already exists
    const existing = await Database
      .from('organization_volunteers')
      .where('organization_id', org.id)
      .where('user_id', user_id)
      .first()

    if (existing) {
      return response.conflict({ message: 'Volunteer already added to this organization' })
    }

    await org.related('volunteers').attach({
      [user_id]: {
        role,
        status,
        notes,
        joined_at: DateTime.now().toSQL()
      }
    })

    return response.created({ message: 'Volunteer added successfully' })
  }

  /**
   * Update volunteer role/status in organization
   */
  public async updateVolunteer({ params, request, response }: HttpContextContract) {
    const org = await Organization.find(params.id)
    if (!org) return response.notFound({ message: 'Organization not found' })

    const { userId } = params
    const { role, status, notes } = request.only(['role', 'status', 'notes'])

    const updateData: any = {}
    if (role) updateData.role = role
    if (status) updateData.status = status
    if (notes !== undefined) updateData.notes = notes

    await Database
      .from('organization_volunteers')
      .where('organization_id', org.id)
      .where('user_id', userId)
      .update(updateData)

    return response.ok({ message: 'Volunteer updated successfully' })
  }

  /**
   * Remove volunteer from organization
   */
  public async removeVolunteer({ params, response }: HttpContextContract) {
    const org = await Organization.find(params.id)
    if (!org) return response.notFound({ message: 'Organization not found' })

    const { userId } = params

    await org.related('volunteers').detach([userId])

    return response.ok({ message: 'Volunteer removed successfully' })
  }

  /**
   * Get organization events
   */
  public async getEvents({ params, response }: HttpContextContract) {
    const org = await Organization.find(params.id)
    if (!org) return response.notFound({ message: 'Organization not found' })

    const events = await Database
      .from('events')
      .where('organization_id', org.id)
      .orderBy('start_date', 'desc')

    // Add attendance for each event
    const eventsWithStats = await Promise.all(
      events.map(async (event) => {
        const tasksResult = await Database
          .from('tasks')
          .where('event_id', event.id)
          .count('* as task_count')

        const assignmentsResult = await Database
          .from('assignments')
          .join('tasks', 'tasks.id', 'assignments.task_id')
          .where('tasks.event_id', event.id)
          .count('* as volunteer_count')

        return {
          ...event,
          task_count: tasksResult[0]?.task_count || 0,
          volunteer_count: assignmentsResult[0]?.volunteer_count || 0
        }
      })
    )

    return response.ok(eventsWithStats)
  }

  /**
   * Get organization tasks
   */
  public async getTasks({ params, response }: HttpContextContract) {
    const org = await Organization.find(params.id)
    if (!org) return response.notFound({ message: 'Organization not found' })

    const tasks = await Database
      .from('tasks')
      .join('events', 'events.id', 'tasks.event_id')
      .where('events.organization_id', org.id)
      .select('tasks.*', 'events.title as event_title')
      .orderBy('tasks.created_at', 'desc')

    // Add assignment counts
    const tasksWithAssignments = await Promise.all(
      tasks.map(async (task) => {
        const assignmentsResult = await Database
          .from('assignments')
          .where('task_id', task.id)
          .count('* as assignment_count')

        return {
          ...task,
          assignment_count: assignmentsResult[0]?.assignment_count || 0
        }
      })
    )

    return response.ok(tasksWithAssignments)
  }

  /**
   * Get volunteer hours for organization
   */
  public async getHours({ params, request, response }: HttpContextContract) {
    const org = await Organization.find(params.id)
    if (!org) return response.notFound({ message: 'Organization not found' })

    const { status, userId, startDate, endDate, page = 1, limit = 50 } = request.qs()

    let query = Database
      .from('volunteer_hours')
      .join('organization_volunteers', 'volunteer_hours.user_id', 'organization_volunteers.user_id')
      .join('users', 'users.id', 'volunteer_hours.user_id')
      .where('organization_volunteers.organization_id', org.id)
      .select(
        'volunteer_hours.*',
        'users.first_name',
        'users.last_name',
        'users.email'
      )
      .orderBy('volunteer_hours.date', 'desc')

    if (status) {
      query = query.where('volunteer_hours.status', status)
    }
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
   * Approve volunteer hours (bulk)
   */
  public async approveHours({ params, request, response }: HttpContextContract) {
    const org = await Organization.find(params.id)
    if (!org) return response.notFound({ message: 'Organization not found' })

    const { hour_ids, status = 'approved', notes } = request.only(['hour_ids', 'status', 'notes'])

    if (!Array.isArray(hour_ids) || hour_ids.length === 0) {
      return response.badRequest({ message: 'hour_ids must be a non-empty array' })
    }

    const updateData: any = { status }
    if (notes) updateData.notes = notes

    await Database
      .from('volunteer_hours')
      .whereIn('id', hour_ids)
      .update(updateData)

    return response.ok({ message: `${hour_ids.length} hours ${status}` })
  }

  /**
   * Get organization analytics
   */
  public async getAnalytics({ params, request, response }: HttpContextContract) {
    const org = await Organization.find(params.id)
    if (!org) return response.notFound({ message: 'Organization not found' })

    const { startDate, endDate } = request.qs()

    const start = startDate ? DateTime.fromISO(startDate) : undefined
    const end = endDate ? DateTime.fromISO(endDate) : undefined

    const analytics = await org.getAnalytics(start, end)

    // Get volunteer growth (monthly)
    const volunteerGrowth = await Database
      .from('organization_volunteers')
      .where('organization_id', org.id)
      .select(Database.raw("DATE_TRUNC('month', joined_at) as month"))
      .count('* as count')
      .groupByRaw("DATE_TRUNC('month', joined_at)")
      .orderBy('month', 'desc')
      .limit(12)

    // Get top volunteers by hours
    const topVolunteers = await Database
      .from('volunteer_hours')
      .join('organization_volunteers', 'volunteer_hours.user_id', 'organization_volunteers.user_id')
      .join('users', 'users.id', 'volunteer_hours.user_id')
      .where('organization_volunteers.organization_id', org.id)
      .where('volunteer_hours.status', 'approved')
      .select(
        'users.id',
        'users.first_name',
        'users.last_name',
        Database.raw('SUM(volunteer_hours.hours) as total_hours')
      )
      .groupBy('users.id', 'users.first_name', 'users.last_name')
      .orderBy('total_hours', 'desc')
      .limit(10)

    return response.ok({
      ...analytics,
      volunteer_growth: volunteerGrowth,
      top_volunteers: topVolunteers
    })
  }

  /**
   * Get compliance overview for organization
   */
  public async getCompliance({ params, response }: HttpContextContract) {
    const org = await Organization.find(params.id)
    if (!org) return response.notFound({ message: 'Organization not found' })

    // Get compliance documents for all volunteers
    const compliance = await Database
      .from('compliance_documents')
      .join('organization_volunteers', 'compliance_documents.user_id', 'organization_volunteers.user_id')
      .join('users', 'users.id', 'compliance_documents.user_id')
      .where('organization_volunteers.organization_id', org.id)
      .select(
        'compliance_documents.*',
        'users.first_name',
        'users.last_name',
        'users.email'
      )
      .orderBy('compliance_documents.expiration_date', 'asc')

    // Categorize by status
    const now = DateTime.now()
    const categorized = {
      valid: compliance.filter((doc) => doc.status === 'approved' && (!doc.expiration_date || DateTime.fromJSDate(doc.expiration_date) > now)),
      expiring_soon: compliance.filter((doc) => doc.status === 'approved' && doc.expiration_date && DateTime.fromJSDate(doc.expiration_date).diff(now, 'days').days <= 30),
      expired: compliance.filter((doc) => doc.status === 'approved' && doc.expiration_date && DateTime.fromJSDate(doc.expiration_date) < now),
      pending: compliance.filter((doc) => doc.status === 'pending'),
      rejected: compliance.filter((doc) => doc.status === 'rejected')
    }

    return response.ok({
      total: compliance.length,
      valid: categorized.valid.length,
      expiring_soon: categorized.expiring_soon.length,
      expired: categorized.expired.length,
      pending: categorized.pending.length,
      rejected: categorized.rejected.length,
      documents: categorized
    })
  // Dashboard Stats
  public async dashboardStats({ auth, response }: HttpContextContract) {
    const user = auth.user!

    // Find organization for the current user
    const memberRecord = await OrganizationTeamMember.query().where('user_id', user.id).first()

    if (!memberRecord) {
      return response.notFound({ message: 'User is not part of any organization' })
    }

    const orgId = memberRecord.organizationId

    const activeVolunteers = await OrganizationVolunteer.query()
      .where('organization_id', orgId)
      .where('status', 'Active')
      .count('* as total')

    const upcomingEvents = await Event.query()
      .where('organization_id', orgId)
      .where('start_at', '>', new Date())
      .count('* as total')

    const totalHours = await OrganizationVolunteer.query()
      .where('organization_id', orgId)
      .sum('hours as total')

    const volCount = activeVolunteers[0].$extras.total
    const hoursCount = totalHours[0].$extras.total || 0

    // Simple impact score calculation: (Total Hours / Active Volunteers) * 10, capped at 100
    let impactScore = 0
    if (volCount > 0) {
      impactScore = Math.min(100, Math.round((hoursCount / volCount) * 10))
    }

    return response.ok({
      activeVolunteers: volCount,
      upcomingEvents: upcomingEvents[0].$extras.total,
      totalHours: hoursCount,
      impactScore
    })
  }

  // Team Management
  public async team({ auth, response }: HttpContextContract) {
    const user = auth.user!
    const memberRecord = await OrganizationTeamMember.query().where('user_id', user.id).first()
    if (!memberRecord) return response.notFound({ message: 'User is not part of any organization' })

    const orgId = memberRecord.organizationId
    const members = await OrganizationTeamMember.query()
      .where('organization_id', orgId)
      .preload('user')
    // Flatten user fields for frontend convenience
    const payload = members.map((m) => {
      const obj: any = m.toJSON()
      if (obj.user) {
        obj.name =
          obj.user.first_name ||
          obj.user.firstName ||
          `${obj.user.first_name ?? ''} ${obj.user.last_name ?? ''}`.trim()
        obj.email = obj.user.email
      }
      return obj
    })

    return response.ok(payload)
  }

  public async inviteMember({ auth, request, response }: HttpContextContract) {
    const currentUser = auth.user!
    const memberRecord = await OrganizationTeamMember.query()
      .where('user_id', currentUser.id)
      .first()
    if (!memberRecord) return response.notFound({ message: 'User is not part of any organization' })

    const orgId = memberRecord.organizationId
    // Only allow invites from Admins or Coordinators
    const allowedInviteRoles = ['admin', 'coordinator']
    if (!allowedInviteRoles.includes((memberRecord.role || '').toLowerCase())) {
      return response.forbidden({ message: 'You do not have permission to invite members' })
    }
    const { email, role } = request.only(['email', 'role'])

    const targetUser = await User.findBy('email', email)
    if (!targetUser) {
      return response.badRequest({ message: 'User not found' })
    }

    // Prevent duplicate membership
    const existing = await OrganizationTeamMember.query()
      .where('organization_id', orgId)
      .andWhere('user_id', targetUser.id)
      .first()

    if (existing) {
      return response.conflict({ message: 'User is already a member of this organization' })
    }

    const member = await OrganizationTeamMember.create({
      organizationId: orgId,
      userId: targetUser.id,
      role: role || 'Member'
    })

    return response.created(member)
  }

  public async removeMember({ auth, params, response }: HttpContextContract) {
    // params.id is organization id, params.memberId is user id or team member id
    // Let's assume route is /organizations/:id/team/:memberId
    // where memberId is the ID of the OrganizationTeamMember record
    const user = auth.user!
    const currentOrgRec = await OrganizationTeamMember.query().where('user_id', user.id).first()
    if (!currentOrgRec)
      return response.notFound({ message: 'User is not part of any organization' })

    const member = await OrganizationTeamMember.find(params.memberId)
    if (!member) return response.notFound()

    if (member.organizationId !== currentOrgRec.organizationId) {
      return response.forbidden({ message: 'Member does not belong to your organization' })
    }

    // Only allow deletion by Admins or Coordinators
    const allowedRemoveRoles = ['admin', 'coordinator']
    if (!allowedRemoveRoles.includes((currentOrgRec.role || '').toLowerCase())) {
      return response.forbidden({ message: 'You do not have permission to remove members' })
    }

    await member.delete()
    return response.noContent()
  }

  // Update team member (role etc). Only allowed by org admins/coordinators
  public async updateMember({ auth, params, request, response }: HttpContextContract) {
    const currentUser = auth.user!
    const currentOrgRec = await OrganizationTeamMember.query()
      .where('user_id', currentUser.id)
      .first()
    if (!currentOrgRec)
      return response.notFound({ message: 'User is not part of any organization' })

    // Only admins/coordinators can update other members
    const allowedRoles = ['admin', 'coordinator']
    if (!allowedRoles.includes((currentOrgRec.role || '').toLowerCase())) {
      return response.forbidden({ message: 'You do not have permission to update team members' })
    }

    const member = await OrganizationTeamMember.find(params.memberId)
    if (!member) return response.notFound()

    if (member.organizationId !== currentOrgRec.organizationId) {
      return response.forbidden({ message: 'Member does not belong to your organization' })
    }

    const payload = request.only(['role'])
    if (payload.role) member.role = payload.role

    await member.save()
    await member.refresh()
    await member.preload('user')

    return response.ok(member)
  }
}
