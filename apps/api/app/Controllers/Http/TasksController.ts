import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Task from 'App/Models/Task'

export default class TasksController {
  public async index({ response }: HttpContextContract) {
    const tasks = await Task.query()
      .preload('assignments')
      .preload('event')
      .orderBy('start_at', 'asc')

    const payload = tasks.map((t) => {
      const tj: any = t.toJSON()
      const required = Number(tj.slot_count ?? tj.slotCount ?? 0) || 0
      const assigned = Array.isArray(tj.assignments) ? tj.assignments.length : 0
      return {
        ...tj,
        required_volunteers: required,
        assigned_volunteers: assigned,
        requiredVolunteers: required,
        assignedVolunteers: assigned,
        eventTitle: tj.event?.title ?? tj.event_title ?? undefined
      }
    })

    return response.ok(payload)
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
