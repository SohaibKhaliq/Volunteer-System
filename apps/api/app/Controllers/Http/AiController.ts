import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Task from 'App/Models/Task'
import User from 'App/Models/User'

export default class AiController {
  public async match({ request, response }: HttpContextContract) {
    // For now return a simple heuristic based match: select active users who have recent activity
    const { task_id } = request.only(['task_id'])
    const task = await Task.find(task_id)
    if (!task) return response.notFound({ error: 'Task not found' })

    // naive: pick up to slot_count active users (last_active_at within 30 days)
    const candidates = await User.query()
      .where('volunteer_status', 'active')
      .whereNotNull('last_active_at')
      .orderBy('last_active_at', 'desc')
      .limit(task.slotCount || 5)

    return response.ok({ candidates })
  }

  public async forecast({ request, response }: HttpContextContract) {
    // stubbed forecasting: return daily expected demand for a date range
    const { start, end } = request.only(['start', 'end'])

    // very naive forecast: count events within range and multiply by avg slots
    const events = await Task.query().whereBetween('start_at', [start, end])
    const demand = events.length * 3

    return response.ok({ start, end, demand, eventsCount: events.length })
  }
}
