import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Assignment from 'App/Models/Assignment'

export default class AssignmentsController {
  public async index({ response }: HttpContextContract) {
    const items = await Assignment.query().preload('task').preload('user')
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
