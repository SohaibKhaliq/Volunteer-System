import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Assignment from 'App/Models/Assignment'

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
    const assignment = await Assignment.create({ ...payload, status: 'pending' })
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

  public async update({ params, request, response }: HttpContextContract) {
    const assignment = await Assignment.find(params.id)
    if (!assignment) return response.notFound()
    assignment.merge(request.only(['status']))
    await assignment.save()
    return response.ok(assignment)
  }

  public async destroy({ params, response }: HttpContextContract) {
    const assignment = await Assignment.find(params.id)
    if (!assignment) return response.notFound()
    await assignment.delete()
    return response.noContent()
  }
}
