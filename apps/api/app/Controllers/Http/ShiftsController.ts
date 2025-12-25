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
    
    const shifts = await Shift.query()
      .where('event_id', opportunityId)
      .orderBy('start_at', 'asc')
      
    return shifts
  }

  public async index({ request }: HttpContextContract) {
    const eventId = request.input('event_id')
    const query = Shift.query()
    if (eventId) query.where('event_id', eventId)
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

    // gather required skills from shift tasks (best-effort)
    await shift.load('tasks')
    const requiredSkills: string[] = []
    for (const t of shift.tasks) {
      try {
        const skills = typeof t.skills === 'string' ? JSON.parse(t.skills) : t.skills
        if (Array.isArray(skills))
          requiredSkills.push(...skills.map((s: any) => String(s).toLowerCase()))
      } catch (e) {
        // ignore parse errors
      }
    }

    // heuristics: users with matching skills + history of similar tasks
    // fetch users with non-empty profileMetadata (may contain skills) and recent assignments
    const users = await Database.from('users').select(
      'id',
      'first_name',
      'last_name',
      'profile_metadata'
    )

    const scores: Record<number, number> = {}

    // map skill matches
    for (const u of users) {
      let score = 0
      try {
        const meta = u.profile_metadata ? JSON.parse(u.profile_metadata) : null
        const userSkills: string[] = meta?.skills ?? meta?.skill_tags ?? []
        if (Array.isArray(userSkills)) {
          for (const s of userSkills) {
            if (requiredSkills.includes(String(s).toLowerCase())) score += 2
          }
        }
      } catch (e) {}
      scores[u.id] = score
    }

    // boost users with past assignments for the same event or similar task titles
    const past = await ShiftAssignment.query().preload('shift')
    for (const a of past) {
      if (!a.shift) continue
      // if same event, boost
      if (a.shift.eventId && a.shift.eventId === shift.eventId) {
        scores[a.userId] = (scores[a.userId] || 0) + 3
      }
      // if task title similarity, small boost (we don't have task here)
    }

    // convert to list and sort by score
    const result = Object.keys(scores)
      .map((k) => ({ user_id: Number(k), score: scores[Number(k)] }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)

    // enrich with user names
    const userIds = result.map((r) => r.user_id)
    const userRows = await User.query().whereIn('id', userIds)
    const byId: Record<number, any> = {}
    userRows.forEach((u) => (byId[u.id] = u))

    const suggestions = result.map((r) => ({
      user: byId[r.user_id] ?? { id: r.user_id },
      score: r.score
    }))
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
