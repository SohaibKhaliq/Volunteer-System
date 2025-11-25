import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Task from 'App/Models/Task'

export default class TasksController {
  public async index({ request, response }: HttpContextContract) {
    const { event_id } = request.qs()
    const query = Task.query()
      .preload('assignments')
      .preload('event')
      .orderBy('start_at', 'asc')

    if (event_id) {
      query.where('event_id', event_id)
    }

    const tasks = await query

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
        eventTitle: tj.event?.title ?? tj.event_title ?? undefined,
        priority: tj.priority ?? 'medium'
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
      'required_skills',
      'priority'
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
    // allow updating of status as well (completed/cancelled)
    const payload = request.only([
      'title',
      'description',
      'start_at',
      'end_at',
      'slot_count',
      'status',
      'priority'
    ])
    task.merge(payload)
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
