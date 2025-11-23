import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Assignment from 'App/Models/Assignment'
import Event from 'App/Models/Event'
import User from 'App/Models/User'
import Database from '@ioc:Adonis/Lucid/Database'
import { DateTime } from 'luxon'
import ReportsService from 'App/Services/ReportsService'

export default class ReportsController {
  public async index({ request, response }: HttpContextContract) {
    // basic set of reports, extendable via query param `type`
    // default to overview so the frontend receives a nested object by default
    const type = request.input('type', 'overview')
    const range = request.input('range', '30days')

    // helper to convert range param into days window (null === all time)
    const rangeToDays = (r: string | null) => {
      switch (r) {
        case '7days':
          return 7
        case '30days':
          return 30
        case '90days':
          return 90
        case 'year':
          return 365
        case 'all':
          return null
        default:
          return 30
      }
    }
    const windowDays = rangeToDays(range)
    const now = DateTime.now()
    const thisPeriodStart = windowDays ? now.minus({ days: windowDays }).toISO() : null
    const prevPeriodStart = windowDays ? now.minus({ days: windowDays * 2 }).toISO() : null
    const prevPeriodEnd = windowDays ? now.minus({ days: windowDays }).toISO() : null

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
