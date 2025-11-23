import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Task from 'App/Models/Task'

export default class TasksController {
  public async index({ request, response }: HttpContextContract) {
    const tasks = await Task.query().orderBy('start_at', 'asc')
    return response.ok(tasks)
  }

  public async store({ request, response }: HttpContextContract) {
    const payload = request.only([
      'event_id',
      'title',
      'description',
      'start_at',
      'end_at',
      'slot_count',
      'required_skills'
    ])
    const task = await Task.create(payload)
    return response.created(task)
  }

  public async show({ params, response }: HttpContextContract) {
    const task = await Task.find(params.id)
    if (!task) return response.notFound()
    await task.load('assignments')
    return response.ok(task)
  }

  public async update({ params, request, response }: HttpContextContract) {
    const task = await Task.find(params.id)
    if (!task) return response.notFound()
    task.merge(request.only(['title', 'description', 'start_at', 'end_at', 'slot_count']))
    await task.save()
    return response.ok(task)
  }

  public async destroy({ params, response }: HttpContextContract) {
    const task = await Task.find(params.id)
    if (!task) return response.notFound()
    await task.delete()
    return response.noContent()
  }
}
