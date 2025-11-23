import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Assignment from 'App/Models/Assignment'
import Event from 'App/Models/Event'
import User from 'App/Models/User'

export default class ReportsController {
  public async index({ request, response }: HttpContextContract) {
    // basic set of reports, extendable via query param `type`
    const type = request.input('type', 'participation')

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
      const events = await Event.query().preload('tasks')
      return response.ok(events)
    }

    // default: basic counts
    const users = await User.query().count('* as total')
    const events = await Event.query().count('* as total')
    const assignments = await Assignment.query().count('* as total')

    return response.ok({ users, events, assignments })
  }
}
