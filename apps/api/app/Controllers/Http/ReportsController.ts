import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Assignment from 'App/Models/Assignment'
import Event from 'App/Models/Event'
import User from 'App/Models/User'
import ReportsService from 'App/Services/ReportsService'

export default class ReportsController {
  public async index({ request, response }: HttpContextContract) {
    // basic set of reports, extendable via query param `type`
    // default to overview so the frontend receives a nested object by default
    const type = request.input('type', 'overview')
    const range = request.input('range', '30days')

    // range is passed to service; service will resolve window and dates

    if (type === 'participation') {
      // volunteer participation: counts of completed assignments per user
      const rows = await Assignment.query()
        .select('user_id')
        .count('* as hours')
        .where('status', 'completed')
        .groupBy('user_id')

      return response.ok(rows)
    }

    if (type === 'events') {
      // return event list with per-event completion details
      const svc = new ReportsService()
      const events = await svc.eventsWithCompletion()
      return response.ok(events)
    }

    // default / overview: compute richer, predictable object so frontend receives a stable shape
    const svc = new ReportsService()
    const overview = await svc.overview(range)
    return response.ok(overview)
  }
}
