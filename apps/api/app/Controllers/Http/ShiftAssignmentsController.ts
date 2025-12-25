import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import ShiftAssignment from 'App/Models/ShiftAssignment'
import Shift from 'App/Models/Shift'
import ShiftTask from 'App/Models/ShiftTask'
import Notification from 'App/Models/Notification'
import { createAssignmentSchema, bulkAssignSchema } from 'App/Validators/assignmentValidator'
import { DateTime } from 'luxon'
import VolunteerHour from 'App/Models/VolunteerHour'


export default class ShiftAssignmentsController {
  public async index({ request }: HttpContextContract) {
    const shiftId = request.input('shift_id')
    const userId = request.input('user_id')
    const query = ShiftAssignment.query()
    if (shiftId) query.where('shift_id', shiftId)
    if (userId) query.where('user_id', userId)
    return query
  }

  // single assignment
  public async store({ request, response }: HttpContextContract) {
    const payload = createAssignmentSchema.parse(request.only(Object.keys(request.body())))

    const shift = await Shift.find(payload.shift_id)
    if (!shift) return response.badRequest({ message: 'Shift not found' })

    if (payload.task_id) {
      const task = await ShiftTask.find(payload.task_id)
      if (!task) return response.badRequest({ message: 'Task not found' })
    }

    // Conflict detection: prevent overlapping assignments for the same user
    // Load shift times
    await shift.load('assignments')
    const shiftStart = shift.startAt ? new Date(shift.startAt.toISO()) : null
    const shiftEnd = shift.endAt ? new Date(shift.endAt.toISO()) : null

    if (shiftStart && shiftEnd) {
      const overlapping = await ShiftAssignment.query()
        .where('user_id', payload.user_id)
        .preload('shift')
      for (const a of overlapping) {
        if (a.shift && a.shift.startAt && a.shift.endAt) {
          const aStart = new Date(a.shift.startAt.toISO())
          const aEnd = new Date(a.shift.endAt.toISO())
          const isOverlap = !(shiftEnd <= aStart || shiftStart >= aEnd)
          if (isOverlap) {
            return response.badRequest({ message: 'Volunteer has overlapping assignment' })
          }
        }
      }
    }

    // Daily hours check (env or default 12 hours)
    const DAILY_LIMIT = Number(process.env.DAILY_HOURS_LIMIT || 12)
    if (shiftStart && shiftEnd) {
      const dayStart = new Date(shiftStart)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(shiftStart)
      dayEnd.setHours(23, 59, 59, 999)

      const assignmentsToday = await ShiftAssignment.query()
        .where('user_id', payload.user_id)
        .preload('shift')
      let totalHours = 0
      for (const a of assignmentsToday) {
        if (a.shift && a.shift.startAt && a.shift.endAt) {
          const s = new Date(a.shift.startAt.toISO())
          const e = new Date(a.shift.endAt.toISO())
          if (s >= dayStart && e <= dayEnd) {
            totalHours += (e.getTime() - s.getTime()) / (1000 * 60 * 60)
          }
        }
      }
      const newHours = (shiftEnd.getTime() - shiftStart.getTime()) / (1000 * 60 * 60)
      if (totalHours + newHours > DAILY_LIMIT) {
        return response.badRequest({ message: 'Assigning exceeds daily hours limit for volunteer' })
      }
    }

    const assignment = await ShiftAssignment.create(payload as any)

    // Notify volunteer (best-effort)
    try {
      await Notification.create({
        userId: payload.user_id,
        type: 'shift_assigned',
        payload: JSON.stringify({ shiftId: payload.shift_id, taskId: payload.task_id }),
        read: false
      } as any)
    } catch (e) {
      // ignore notification errors
    }

    return assignment
  }

  // bulk assign multiple users to the same shift/task
  public async bulk({ request, response }: HttpContextContract) {
    const payload = bulkAssignSchema.parse(request.only(Object.keys(request.body())))
    const shift = await Shift.find(payload.shift_id)
    if (!shift) return response.badRequest({ message: 'Shift not found' })

    if (payload.task_id) {
      const task = await ShiftTask.find(payload.task_id)
      if (!task) return response.badRequest({ message: 'Task not found' })
    }

    const created: any[] = []
    const errors: any[] = []
    for (const uid of payload.user_ids) {
      try {
        // Reuse single-assignment checks by calling store logic partially
        const single = {
          shift_id: payload.shift_id,
          task_id: payload.task_id,
          user_id: uid,
          assigned_by: payload.assigned_by
        }
        // naive: call conflict checks inline
        // Overlap check
        const shiftStart = shift.startAt ? new Date(shift.startAt.toISO()) : null
        const shiftEnd = shift.endAt ? new Date(shift.endAt.toISO()) : null
        if (shiftStart && shiftEnd) {
          const overlapping = await ShiftAssignment.query().where('user_id', uid).preload('shift')
          let conflict = false
          for (const a of overlapping) {
            if (a.shift && a.shift.startAt && a.shift.endAt) {
              const aStart = new Date(a.shift.startAt.toISO())
              const aEnd = new Date(a.shift.endAt.toISO())
              const isOverlap = !(shiftEnd <= aStart || shiftStart >= aEnd)
              if (isOverlap) {
                conflict = true
                break
              }
            }
          }
          if (conflict) {
            errors.push({ user_id: uid, error: 'overlap' })
            continue
          }
        }

        const ass = await ShiftAssignment.create(single as any)
        created.push(ass)
        try {
          await Notification.create({
            userId: uid,
            type: 'shift_assigned',
            payload: JSON.stringify({ shiftId: payload.shift_id, taskId: payload.task_id }),
            read: false
          } as any)
        } catch (e) {}
      } catch (e) {
        errors.push({ user_id: uid, error: (e as any).message || 'failed' })
      }
    }

    return { created, errors }
  }

  public async update({ params, request }: HttpContextContract) {
    const assignment = await ShiftAssignment.findOrFail(params.id)
    const payload = request.only(Object.keys(request.body()))
    assignment.merge(payload as any)
    await assignment.save()
    return assignment
  }

  public async destroy({ params }: HttpContextContract) {
    const assignment = await ShiftAssignment.findOrFail(params.id)
    await assignment.delete()
  }

  /**
   * Check in a volunteer to a shift assignment
   */
  public async checkIn({ request, auth, response }: HttpContextContract) {
      const user = auth.user!
      const { shiftId } = request.only(['shiftId'])

      const assignment = await ShiftAssignment.query()
        .where('shift_id', shiftId)
        .where('user_id', user.id)
        .first()

      if (!assignment) {
        return response.notFound({ message: 'Assignment not found' })
      }

      if (assignment.checkedInAt) {
          return response.badRequest({ message: 'Already checked in' })
      }
      
      // TODO: Add location verification logic here if shift has location

      assignment.checkedInAt = DateTime.now()
      assignment.status = 'in-progress'
      await assignment.save()

      return assignment
  }

  /**
   * Check out a volunteer
   */
  public async checkOut({ request, auth, response }: HttpContextContract) {
      const user = auth.user!
      const { shiftId } = request.only(['shiftId'])

      const assignment = await ShiftAssignment.query()
        .where('shift_id', shiftId)
        .where('user_id', user.id)
        .first()

      if (!assignment) {
        return response.notFound({ message: 'Assignment not found' })
      }

      if (!assignment.checkedInAt) {
          return response.badRequest({ message: 'Not checked in' })
      }

      assignment.checkedOutAt = DateTime.now()
      assignment.status = 'completed'
      
      // Calculate hours
      const duration = assignment.checkedOutAt.diff(assignment.checkedInAt, 'hours').hours
      assignment.hours = Math.round(duration * 100) / 100
      
      await assignment.save()

      // Auto-create volunteer hour record
      const shift = await Shift.find(shiftId)
      if (shift) {
         await VolunteerHour.create({
             userId: user.id,
             organizationId: shift.organizationId,
             eventId: shift.eventId,
             shiftId: shift.id,
             date: DateTime.now(),
             hours: assignment.hours,
             notes: 'Automatically logged via shift check-out',
             status: 'pending' 
         })
      }

      return assignment
  }
}
