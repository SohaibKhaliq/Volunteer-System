import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Assignment from 'App/Models/Assignment'
import AuditLog from 'App/Models/AuditLog'
import { AssignmentStatus, ALL_ASSIGNMENT_STATUSES } from 'App/Constants/assignmentStatus'

export default class AssignmentsController {
  public async index({ request, response }: HttpContextContract) {
    // Allow filtering by user_id via query string so clients (profile page)
    // can request only the current user's assignments without extra filtering.
    const { user_id } = request.qs()

    const q = Assignment.query()
      .preload('task', (taskQuery) => {
        // preload the task's event so frontend sees event data directly
        taskQuery.preload('event')
      })
      .preload('user')

    if (user_id) {
      // support string or numeric user_id values
      q.where('user_id', Number(user_id))
    }

    const items = await q
    return response.ok(items)
  }

  public async store({ request, response, auth }: HttpContextContract) {
    const payload = request.only(['task_id', 'user_id'])
    // assigned_by should be the auth user if available
    if (auth.user) payload['assigned_by'] = auth.user.id
    const assignment = await Assignment.create({ ...payload, status: AssignmentStatus.Pending })
    return response.created(assignment)
  }

  public async show({ params, response }: HttpContextContract) {
    const assignment = await Assignment.query()
      .where('id', params.id)
      .preload('task')
      .preload('user')
      .first()
    if (!assignment) return response.notFound()
    return response.ok(assignment)
  }

  public async update({ params, request, response, auth }: HttpContextContract) {
    const assignment = await Assignment.find(params.id)
    if (!assignment) return response.notFound()
    const { status } = request.only(['status'])
    if (status && !ALL_ASSIGNMENT_STATUSES.includes(status)) {
      return response.badRequest({
        error: { message: `Invalid status. Allowed: ${ALL_ASSIGNMENT_STATUSES.join(', ')}` }
      })
    }
    const previous = assignment.status
    assignment.merge({ status })
    await assignment.save()

    // If the assignment was cancelled, add an audit log entry for traceability
    try {
      if (status === AssignmentStatus.Cancelled) {
        await AuditLog.create({
          userId: auth.user ? auth.user.id : null,
          action: 'assignment_cancelled',
          details: JSON.stringify({ assignmentId: assignment.id, previousStatus: previous })
        })

        // Also create a user notification so volunteers are notified when an assignment is cancelled
        try {
          const Notification = await import('App/Models/Notification')
          await Notification.default.create({
            userId: assignment.userId,
            type: 'assignment_cancelled',
            payload: JSON.stringify({ assignmentId: assignment.id, previousStatus: previous }),
            read: false
          })
        } catch (nerr) {
          console.warn('Failed to create notification for assignment cancellation', nerr)
        }
      }
    } catch (e) {
      // Best-effort logging — don't fail the request if audit fails
      console.error('Failed to create audit log for assignment cancellation', e)
    }
    return response.ok(assignment)
  }

  public async destroy({ params, response }: HttpContextContract) {
    const assignment = await Assignment.find(params.id)
    if (!assignment) return response.notFound()
    await assignment.delete()
    return response.noContent()
  }
}
