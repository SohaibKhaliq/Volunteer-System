import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Shift from 'App/Models/Shift'
import Opportunity from 'App/Models/Opportunity'
import { createShiftSchema, updateShiftSchema } from 'App/Validators/shiftValidator'
import User from 'App/Models/User'
import ShiftAssignment from 'App/Models/ShiftAssignment'
import Database from '@ioc:Adonis/Lucid/Database'
import RecurringShiftsService from 'App/Services/RecurringShiftsService'
import ConflictDetectionService from 'App/Services/ConflictDetectionService'
import { DateTime } from 'luxon'
import Logger from '@ioc:Adonis/Core/Logger'

export default class ShiftsController {
  public async indexForOpportunity({ params, request, auth, response }: HttpContextContract) {
    const { opportunityId } = params

    const opportunity = await Opportunity.find(opportunityId)
    if (!opportunity) {
      return response.notFound({ message: 'Opportunity not found' })
    }

    // Security check: ensure user is part of the org (or admin)
    // For now, assuming middleware 'auth' is enough to identify user, but we should ideally check generic org permissions
    // The route is protected by auth, and we trust org admins access this.
    // Ideally: await bouncer.with('OrganizationPolicy').authorize('view', opportunity.organizationId)

    const shifts = await Shift.query().where('event_id', opportunityId).orderBy('start_at', 'asc')

    return shifts
  }

  public async index({ request, auth, response }: HttpContextContract) {
    const eventId = request.input('event_id')
    const scope = request.input('scope')

    const query = Shift.query().preload('event')
    if (eventId) query.where('event_id', eventId)

    if (scope === 'organization') {
      await auth.use('api').authenticate()
      const user = auth.user!
      const OrganizationTeamMember = await import('App/Models/OrganizationTeamMember')
      const member = await OrganizationTeamMember.default.query().where('user_id', user.id).first()
      if (!member) return response.notFound({ message: 'User is not part of any organization' })

      query.where('organization_id', member.organizationId)
    }

    return query.orderBy('start_at', 'asc')
  }

  public async storeForOpportunity({ params, request, auth, response }: HttpContextContract) {
    const { opportunityId } = params
    const opportunity = await Opportunity.findOrFail(opportunityId)

    // Validate payload
    const payload = createShiftSchema.parse(request.only(Object.keys(request.body())))

    // Override eventId with opportunityId
    payload.event_id = Number(opportunityId)
    payload.organization_id = opportunity.organizationId

    if (
      payload.start_at &&
      payload.end_at &&
      new Date(payload.start_at) >= new Date(payload.end_at)
    ) {
      return response.badRequest({ message: 'start_at must be before end_at' })
    }

    const shift = await Shift.create(payload as any)
    return shift
  }

  // Suggest volunteers for a shift based on skills and past assignments
  public async suggest({ params, request, response }: HttpContextContract) {
    const shiftId = Number(params.id)
    const limit = Number(request.input('limit', 10))
    const shift = await Shift.find(shiftId)
    if (!shift) return response.notFound({ message: 'Shift not found' })

    // gather required skills from shift tasks
    await shift.load('tasks')
    const requiredSkills = new Set<string>()
    for (const t of shift.tasks) {
      if (t.skillTags) {
        t.skillTags.forEach((s) => requiredSkills.add(s.toLowerCase()))
      }
    }

    // load existing assignments to exclude them
    await shift.load('assignments')
    const assignedUserIds = new Set<number>()
    shift.assignments.forEach((a) => assignedUserIds.add(a.userId))

    // fetch potential candidates (active users)
    // simplistic fetch all active, optimizable in future
    const users = await User.query()
      .where('volunteer_status', 'active')
      .preload('assignments', (q) => q.limit(20)) // peek at recent assignments for experience score

    // Initial Scoring
    const scoredCandidates = users
      .filter((u) => !assignedUserIds.has(u.id))
      .map((u) => {
        let score = 0
        // Skill Match (+10 per skill)
        const userSkills = u.skills.map((s) => s.toLowerCase())
        const matchingSkills = userSkills.filter((s) => requiredSkills.has(s))
        if (matchingSkills.length > 0) {
          score += matchingSkills.length * 10
        }

        // Recent Activity (+5 if active in last 30 days)
        if (u.lastLoginAt) {
          const daysSince = Math.floor(
            (Date.now() - new Date(u.lastLoginAt.toString()).getTime()) / (1000 * 60 * 60 * 24)
          )
          if (daysSince <= 30) score += 5
        }

        // Experience (+1 per assignment)
        if (u.assignments && u.assignments.length > 0) {
          score += Math.min(u.assignments.length, 5)
        }

        return { user: u, score }
      })
      .sort((a, b) => b.score - a.score)
      // Take top subset to check for conflicts (avoid checking everyone)
      .slice(0, limit * 3)

    // Conflict Check
    const suggestions: any[] = []
    
    for (const candidate of scoredCandidates) {
      if (suggestions.length >= limit) break
      
      const available = await ConflictDetectionService.isUserAvailable(
        candidate.user.id,
        shift.startAt,
        shift.endAt
      )

      if (available) {
        suggestions.push({
          user: candidate.user,
          score: candidate.score
        })
      }
    }

    return { suggestions }
  }

  public async show({ params }: HttpContextContract) {
    const shift = await Shift.findOrFail(params.id)
    await shift.load('tasks')
    await shift.load('assignments')
    return shift
  }

  public async store({ request, auth, response }: HttpContextContract) {
    const payload = createShiftSchema.parse(request.only(Object.keys(request.body())))
    // basic validation: start < end
    if (
      payload.start_at &&
      payload.end_at &&
      new Date(payload.start_at) >= new Date(payload.end_at)
    ) {
      return response.badRequest({ message: 'start_at must be before end_at' })
    }
    const shift = await Shift.create(payload as any)
    return shift
  }

  /**
   * Create recurring shifts
   */
  public async createRecurring({ request, response, auth }: HttpContextContract) {
    try {
      await auth.use('api').authenticate()

      const {
        title,
        description,
        eventId,
        startAt,
        endAt,
        capacity,
        recurrenceRule,
        endDate,
        organizationId
      } = request.only([
        'title',
        'description',
        'eventId',
        'startAt',
        'endAt',
        'capacity',
        'recurrenceRule',
        'endDate',
        'organizationId'
      ])

      if (!recurrenceRule) {
        return response.badRequest({
          message: 'recurrenceRule is required for recurring shifts'
        })
      }

      if (!endDate) {
        return response.badRequest({
          message: 'endDate is required for recurring shifts'
        })
      }

      const shifts = await RecurringShiftsService.createRecurringShifts(
        {
          title,
          description,
          eventId: eventId ? Number(eventId) : undefined,
          startAt: DateTime.fromISO(startAt),
          endAt: DateTime.fromISO(endAt),
          capacity: capacity ? Number(capacity) : undefined,
          organizationId: organizationId ? Number(organizationId) : undefined,
          templateName: `${title}-${Date.now()}`
        },
        recurrenceRule,
        DateTime.fromISO(endDate)
      )

      return response.created({
        message: `Created ${shifts.length} recurring shift instances`,
        count: shifts.length,
        shifts
      })
    } catch (error) {
      Logger.error('Failed to create recurring shifts:', error)
      return response.status(500).send({
        message: 'Failed to create recurring shifts',
        error: error.message
      })
    }
  }

  /**
   * Check for conflicts when assigning a user to a shift
   */
  public async checkConflicts({ params, request, response }: HttpContextContract) {
    try {
      const shiftId = params.id
      const userId = request.input('userId')

      if (!userId) {
        return response.badRequest({ message: 'userId is required' })
      }

      const shift = await Shift.find(shiftId)
      if (!shift) {
        return response.notFound({ message: 'Shift not found' })
      }

      const conflictCheck = await ConflictDetectionService.checkShiftConflicts(
        Number(userId),
        shift.startAt,
        shift.endAt
      )

      return response.ok({
        hasConflict: conflictCheck.hasConflict,
        conflicts: conflictCheck.conflicts,
        message: ConflictDetectionService.formatConflictMessage(conflictCheck.conflicts)
      })
    } catch (error) {
      Logger.error('Failed to check conflicts:', error)
      return response.status(500).send({
        message: 'Failed to check conflicts',
        error: error.message
      })
    }
  }

  /**
   * Assign a user to a shift with conflict detection
   */
  public async assignWithConflictCheck({ params, request, response, auth }: HttpContextContract) {
    try {
      await auth.use('api').authenticate()

      const shiftId = params.id
      const { userId, ignoreConflicts } = request.only(['userId', 'ignoreConflicts'])

      if (!userId) {
        return response.badRequest({ message: 'userId is required' })
      }

      const shift = await Shift.find(shiftId)
      if (!shift) {
        return response.notFound({ message: 'Shift not found' })
      }

      // Check for conflicts
      const conflictCheck = await ConflictDetectionService.checkShiftConflicts(
        Number(userId),
        shift.startAt,
        shift.endAt
      )

      if (conflictCheck.hasConflict && !ignoreConflicts) {
        return response.status(409).send({
          message: 'User has conflicting commitments',
          hasConflict: true,
          conflicts: conflictCheck.conflicts,
          conflictMessage: ConflictDetectionService.formatConflictMessage(conflictCheck.conflicts)
        })
      }

      // Check if already assigned
      const existing = await ShiftAssignment.query()
        .where('shift_id', shiftId)
        .where('user_id', userId)
        .first()

      if (existing) {
        return response.conflict({ message: 'User is already assigned to this shift' })
      }

      // Create assignment
      const assignment = await ShiftAssignment.create({
        shiftId: Number(shiftId),
        userId: Number(userId),
        status: 'confirmed'
      })

      return response.created({
        message: 'User assigned to shift successfully',
        assignment,
        hadConflicts: conflictCheck.hasConflict,
        conflictsIgnored: ignoreConflicts || false
      })
    } catch (error) {
      Logger.error('Failed to assign user to shift:', error)
      return response.status(500).send({
        message: 'Failed to assign user to shift',
        error: error.message
      })
    }
  }

  public async update({ params, request }: HttpContextContract) {
    const shift = await Shift.findOrFail(params.id)
    const payload = updateShiftSchema.parse(request.only(Object.keys(request.body())))
    if (
      payload.start_at &&
      payload.end_at &&
      new Date(payload.start_at) >= new Date(payload.end_at)
    ) {
      return { message: 'start_at must be before end_at' } as any
    }
    shift.merge(payload as any)
    await shift.save()
    return shift
  }

  public async destroy({ params }: HttpContextContract) {
    const shift = await Shift.findOrFail(params.id)
    await shift.delete()
  }
}
