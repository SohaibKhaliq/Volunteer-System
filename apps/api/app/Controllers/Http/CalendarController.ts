import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Logger from '@ioc:Adonis/Core/Logger'
import Opportunity from 'App/Models/Opportunity'
import Application from 'App/Models/Application'
import Event from 'App/Models/Event'
import Database from '@ioc:Adonis/Lucid/Database'

/**
 * CalendarController - iCal/Calendar export functionality
 *
 * Features:
 * - Export opportunities as iCal feed
 * - Export volunteer's schedule as iCal
 * - Export organization events as iCal
 * - Google Calendar compatible format
 */
export default class CalendarController {
  /**
   * Generate iCal header
   */
  private getICalHeader(calendarName: string): string {
    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Volunteer System//Calendar Export//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:${calendarName}
X-WR-TIMEZONE:UTC`
  }

  /**
   * Generate iCal event
   */
  private generateICalEvent(event: {
    uid: string
    title: string
    description?: string
    location?: string
    startAt: Date
    endAt: Date
    createdAt?: Date
    url?: string
    organizer?: string
  }): string {
    const formatDate = (date: Date) => {
      return date
        .toISOString()
        .replace(/[-:]/g, '')
        .replace(/\.\d{3}/, '')
    }

    const escapeText = (text: string) => {
      return text
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\n/g, '\\n')
    }

    let icalEvent = `BEGIN:VEVENT
UID:${event.uid}
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(event.startAt)}
DTEND:${formatDate(event.endAt)}
SUMMARY:${escapeText(event.title)}`

    if (event.description) {
      icalEvent += `\nDESCRIPTION:${escapeText(event.description)}`
    }

    if (event.location) {
      icalEvent += `\nLOCATION:${escapeText(event.location)}`
    }

    if (event.url) {
      icalEvent += `\nURL:${event.url}`
    }

    if (event.organizer) {
      icalEvent += `\nORGANIZER:${escapeText(event.organizer)}`
    }

    if (event.createdAt) {
      icalEvent += `\nCREATED:${formatDate(event.createdAt)}`
    }

    icalEvent += '\nEND:VEVENT'

    return icalEvent
  }

  /**
   * Export public opportunities as iCal feed
   */
  public async publicOpportunities({ request, response }: HttpContextContract) {
    try {
      const { organizationSlug, from, to } = request.qs()

      const query = Opportunity.query()
        .where('status', 'published')
        .andWhere('visibility', 'public')
        .preload('organization')

      if (organizationSlug) {
        query.whereHas('organization', (q) => {
          q.where('slug', organizationSlug)
        })
      }

      if (from) {
        query.where('start_at', '>=', from)
      }
      if (to) {
        query.where('end_at', '<=', to)
      }

      query.orderBy('start_at', 'asc')

      const opportunities = await query.exec()

      // Generate iCal
      let ical = this.getICalHeader('Volunteer Opportunities')

      for (const opp of opportunities) {
        const startAt =
          opp.startAt instanceof Date
            ? opp.startAt
            : new Date(opp.startAt?.toString() || Date.now())
        const endAt =
          opp.endAt instanceof Date
            ? opp.endAt
            : new Date(opp.endAt?.toString() || startAt.getTime() + 3600000)

        ical +=
          '\n' +
          this.generateICalEvent({
            uid: `opportunity-${opp.id}@volunteersystem`,
            title: opp.title,
            description: opp.description || '',
            location: opp.location || '',
            startAt,
            endAt,
            createdAt:
              opp.createdAt instanceof Date
                ? opp.createdAt
                : new Date(opp.createdAt?.toString() || Date.now()),
            organizer: opp.organization?.name || ''
          })
      }

      ical += '\nEND:VCALENDAR'

      response.header('Content-Type', 'text/calendar; charset=utf-8')
      response.header('Content-Disposition', 'attachment; filename="opportunities.ics"')
      return response.send(ical)
    } catch (error) {
      Logger.error('Calendar public opportunities error: %o', error)
      return response.internalServerError({ error: { message: 'Failed to generate calendar' } })
    }
  }

  /**
   * Export volunteer's accepted opportunities as iCal (my schedule)
   */
  public async mySchedule({ auth, request, response }: HttpContextContract) {
    try {
      await auth.use('api').authenticate()
      const user = auth.user!

      const { from, to } = request.qs()

      const query = Application.query()
        .where('user_id', user.id)
        .andWhere('status', 'accepted')
        .preload('opportunity', (q) => {
          q.preload('organization')
        })

      if (from) {
        query.whereHas('opportunity', (q) => {
          q.where('start_at', '>=', from)
        })
      }
      if (to) {
        query.whereHas('opportunity', (q) => {
          q.where('end_at', '<=', to)
        })
      }

      const applications = await query.exec()

      // Generate iCal
      let ical = this.getICalHeader('My Volunteer Schedule')

      for (const app of applications) {
        const opp = app.opportunity
        if (!opp) continue

        const startAt =
          opp.startAt instanceof Date
            ? opp.startAt
            : new Date(opp.startAt?.toString() || Date.now())
        const endAt =
          opp.endAt instanceof Date
            ? opp.endAt
            : new Date(opp.endAt?.toString() || startAt.getTime() + 3600000)

        ical +=
          '\n' +
          this.generateICalEvent({
            uid: `volunteer-${user.id}-opportunity-${opp.id}@volunteersystem`,
            title: opp.title,
            description: opp.description || '',
            location: opp.location || '',
            startAt,
            endAt,
            createdAt:
              opp.createdAt instanceof Date
                ? opp.createdAt
                : new Date(opp.createdAt?.toString() || Date.now()),
            organizer: opp.organization?.name || ''
          })
      }

      ical += '\nEND:VCALENDAR'

      response.header('Content-Type', 'text/calendar; charset=utf-8')
      response.header('Content-Disposition', 'attachment; filename="my-schedule.ics"')
      return response.send(ical)
    } catch (error) {
      Logger.error('Calendar my schedule error: %o', error)
      return response.internalServerError({ error: { message: 'Failed to generate calendar' } })
    }
  }

  /**
   * Export organization opportunities as iCal
   */
  public async organizationOpportunities({ auth, request, response }: HttpContextContract) {
    try {
      await auth.use('api').authenticate()
      const user = auth.user!

      // Get user's organization
      const membership = await Database.from('organization_volunteers')
        .where('user_id', user.id)
        .andWhere('status', 'active')
        .whereIn('role', ['owner', 'admin', 'manager', 'coordinator'])
        .first()

      if (!membership) {
        return response.forbidden({
          error: { message: 'Not authorized to access organization calendar' }
        })
      }

      const { from, to, status } = request.qs()

      const query = Opportunity.query()
        .where('organization_id', membership.organization_id)
        .preload('organization')

      if (status) {
        query.where('status', status)
      }

      if (from) {
        query.where('start_at', '>=', from)
      }
      if (to) {
        query.where('end_at', '<=', to)
      }

      query.orderBy('start_at', 'asc')

      const opportunities = await query.exec()

      // Generate iCal
      let ical = this.getICalHeader('Organization Opportunities')

      for (const opp of opportunities) {
        const startAt =
          opp.startAt instanceof Date
            ? opp.startAt
            : new Date(opp.startAt?.toString() || Date.now())
        const endAt =
          opp.endAt instanceof Date
            ? opp.endAt
            : new Date(opp.endAt?.toString() || startAt.getTime() + 3600000)

        ical +=
          '\n' +
          this.generateICalEvent({
            uid: `org-${membership.organization_id}-opportunity-${opp.id}@volunteersystem`,
            title: `[${opp.status?.toUpperCase()}] ${opp.title}`,
            description: opp.description || '',
            location: opp.location || '',
            startAt,
            endAt,
            createdAt:
              opp.createdAt instanceof Date
                ? opp.createdAt
                : new Date(opp.createdAt?.toString() || Date.now()),
            organizer: opp.organization?.name || ''
          })
      }

      ical += '\nEND:VCALENDAR'

      response.header('Content-Type', 'text/calendar; charset=utf-8')
      response.header(
        'Content-Disposition',
        'attachment; filename="organization-opportunities.ics"'
      )
      return response.send(ical)
    } catch (error) {
      Logger.error('Calendar organization opportunities error: %o', error)
      return response.internalServerError({ error: { message: 'Failed to generate calendar' } })
    }
  }

  /**
   * Export general events as iCal
   */
  public async events({ auth, request, response }: HttpContextContract) {
    try {
      await auth.use('api').authenticate()

      const { from, to, organizationId } = request.qs()

      const query = Event.query().preload('organization')

      if (organizationId) {
        query.where('organization_id', organizationId)
      }

      if (from) {
        query.where('start_date', '>=', from)
      }
      if (to) {
        query.where('end_date', '<=', to)
      }

      query.orderBy('start_date', 'asc')

      const events = await query.exec()

      // Generate iCal
      let ical = this.getICalHeader('Volunteer Events')

      for (const evt of events) {
        const startAt =
          evt.startDate instanceof Date
            ? evt.startDate
            : new Date(evt.startDate?.toString() || Date.now())
        const endAt =
          evt.endDate instanceof Date
            ? evt.endDate
            : new Date(evt.endDate?.toString() || startAt.getTime() + 3600000)

        ical +=
          '\n' +
          this.generateICalEvent({
            uid: `event-${evt.id}@volunteersystem`,
            title: evt.title || evt.name || 'Event',
            description: evt.description || '',
            location: evt.location || '',
            startAt,
            endAt,
            createdAt:
              evt.createdAt instanceof Date
                ? evt.createdAt
                : new Date(evt.createdAt?.toString() || Date.now()),
            organizer: evt.organization?.name || ''
          })
      }

      ical += '\nEND:VCALENDAR'

      response.header('Content-Type', 'text/calendar; charset=utf-8')
      response.header('Content-Disposition', 'attachment; filename="events.ics"')
      return response.send(ical)
    } catch (error) {
      Logger.error('Calendar events error: %o', error)
      return response.internalServerError({ error: { message: 'Failed to generate calendar' } })
    }
  }

  /**
   * Get iCal subscription URL for the user
   */
  public async getSubscriptionUrl({ auth, response }: HttpContextContract) {
    try {
      await auth.use('api').authenticate()
      const user = auth.user!

      // Generate a token for calendar subscription (in production, this should be a secure token)
      const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64')

      // Get base URL from environment or use a default
      const baseUrl = process.env.APP_URL || 'http://localhost:3333'

      return response.ok({
        myScheduleUrl: `${baseUrl}/calendar/my-schedule?token=${token}`,
        publicOpportunitiesUrl: `${baseUrl}/calendar/public-opportunities`,
        eventsUrl: `${baseUrl}/calendar/events?token=${token}`,
        instructions: {
          google: 'Open Google Calendar > Settings > Add calendar > From URL > Paste the URL',
          outlook: 'Open Outlook > Add calendar > Subscribe from web > Paste the URL',
          apple: 'Open Calendar app > File > New Calendar Subscription > Paste the URL'
        }
      })
    } catch (error) {
      Logger.error('Calendar subscription URL error: %o', error)
      return response.internalServerError({
        error: { message: 'Failed to generate subscription URL' }
      })
    }
  }
}
