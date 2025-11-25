import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Event from 'App/Models/Event'

export default class EventsController {
  public async index({ auth, request, response }: HttpContextContract) {
    // preload tasks and their assignments so we can compute volunteer counts
    const { organization_id } = request.qs()

    const query = Event.query().preload('tasks', (taskQuery) => {
      taskQuery.preload('assignments')
    })

    // If query provided an explicit org, prefer that
    if (organization_id) {
      query.where('organization_id', organization_id)
    } else if (auth?.user) {
      const OrganizationTeamMember = await import('App/Models/OrganizationTeamMember')
      const member = await OrganizationTeamMember.default
        .query()
        .where('user_id', auth.user!.id)
        .first()
      if (member) query.where('organization_id', member.organizationId)
    }

    const events = await query.orderBy('start_at', 'asc')

    // enrich events with required_volunteers and assigned_volunteers for frontend convenience
    const payload = events.map((ev) => {
      const evJson: any = ev.toJSON()
      const required = (ev.tasks || []).reduce((sum, t: any) => {
        // try both slotCount and slot_count
        const slots = (t.slotCount ?? t.slot_count ?? 0) || 0
        return sum + Number(slots)
      }, 0)
      const assigned = (ev.tasks || []).reduce((sum, t: any) => {
        const assigns = Array.isArray(t.assignments) ? t.assignments.length : 0
        return sum + assigns
      }, 0)
      evJson.required_volunteers = required
      evJson.assigned_volunteers = assigned
      // Friendly properties for frontend (date/time, registered/capacity)
      try {
        const d = new Date(ev.startAt as any)
        evJson.date = d.toLocaleDateString()
        evJson.time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      } catch (e) {
        evJson.date = ev.startAt
        evJson.time = ''
      }
      evJson.registered = assigned
      evJson.capacity = ev.capacity ?? ev.capacity
      evJson.type = ev.type ?? 'Community'
      try {
        const start = new Date(ev.startAt as any)
        evJson.status = start > new Date() ? 'Upcoming' : 'Past'
      } catch (e) {
        evJson.status = 'Upcoming'
      }
      return evJson
    })

    return response.ok(payload)
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const raw = request.only([
      'title',
      'description',
      'location',
      'start_at',
      'end_at',
      'recurring_rule',
      'is_recurring',
      'capacity',
      'organization_id',
      'is_published'
    ])

    // Normalize snake_case payload keys to model camelCase properties
    const payload: any = {}
    if (raw.title) payload.title = raw.title
    if (raw.description) payload.description = raw.description
    if (raw.location) payload.location = raw.location
    if (raw.start_at) payload.startAt = raw.start_at
    if (raw.end_at) payload.endAt = raw.end_at
    if (raw.recurring_rule) payload.recurringRule = raw.recurring_rule
    if (typeof raw.is_recurring !== 'undefined') payload.isRecurring = raw.is_recurring
    if (typeof raw.capacity !== 'undefined') payload.capacity = raw.capacity
    // If the authenticated user belongs to an organization, prefer that organization
    if (auth?.user) {
      const OrganizationTeamMember = await import('App/Models/OrganizationTeamMember')
      const member = await OrganizationTeamMember.default
        .query()
        .where('user_id', auth.user!.id)
        .first()
      if (member) payload.organizationId = member.organizationId
      else if (typeof raw.organization_id !== 'undefined')
        payload.organizationId = raw.organization_id
    } else if (typeof raw.organization_id !== 'undefined') {
      payload.organizationId = raw.organization_id
    }
    if (typeof raw.is_published !== 'undefined') payload.isPublished = raw.is_published

    // Support frontend sending separate `date` and `time` fields (e.g. from forms)
    if (!payload.startAt && raw.date && raw.time) {
      try {
        payload.startAt = new Date(`${raw.date}T${raw.time}`)
      } catch (e) {
        // ignore — leave undefined
      }
    }

    const event = await Event.create(payload)
    return response.created(event)
  }

  public async show({ auth, params, response }: HttpContextContract) {
    const event = await Event.query().where('id', params.id).preload('tasks').first()
    if (!event) return response.notFound()

    // If user is an org user, ensure the event matches their organization
    if (auth?.user) {
      const OrganizationTeamMember = await import('App/Models/OrganizationTeamMember')
      const member = await OrganizationTeamMember.default
        .query()
        .where('user_id', auth.user!.id)
        .first()
      if (member && event.organizationId !== member.organizationId) {
        return response.forbidden({ message: 'Event does not belong to your organization' })
      }
    }

    return response.ok(event)
  }

  public async update({ auth, params, request, response }: HttpContextContract) {
    const event = await Event.find(params.id)
    if (!event) return response.notFound()
    if (auth?.user) {
      const OrganizationTeamMember = await import('App/Models/OrganizationTeamMember')
      const member = await OrganizationTeamMember.default
        .query()
        .where('user_id', auth.user!.id)
        .first()
      if (member && event.organizationId !== member.organizationId) {
        return response.forbidden({ message: 'Event does not belong to your organization' })
      }
    }
    const raw = request.only([
      'title',
      'description',
      'location',
      'start_at',
      'end_at',
      'recurring_rule',
      'is_recurring',
      'capacity',
      'is_published',
      'organization_id'
    ])

    const normalized: any = {}
    if (raw.title) normalized.title = raw.title
    if (raw.description) normalized.description = raw.description
    if (raw.location) normalized.location = raw.location
    if (raw.start_at) normalized.startAt = raw.start_at
    if (raw.end_at) normalized.endAt = raw.end_at
    if (raw.recurring_rule) normalized.recurringRule = raw.recurring_rule
    if (typeof raw.is_recurring !== 'undefined') normalized.isRecurring = raw.is_recurring
    if (typeof raw.capacity !== 'undefined') normalized.capacity = raw.capacity
    if (typeof raw.is_published !== 'undefined') normalized.isPublished = raw.is_published
    if (typeof raw.organization_id !== 'undefined') normalized.organizationId = raw.organization_id

    // support date/time fields for updates
    if (!normalized.startAt && raw.date && raw.time) {
      try {
        normalized.startAt = new Date(`${raw.date}T${raw.time}`)
      } catch (e) {
        // ignore
      }
    }

    event.merge(normalized)
    await event.save()
    return response.ok(event)
  }

  public async destroy({ auth, params, response }: HttpContextContract) {
    const event = await Event.find(params.id)
    if (!event) return response.notFound()
    if (auth?.user) {
      const OrganizationTeamMember = await import('App/Models/OrganizationTeamMember')
      const member = await OrganizationTeamMember.default
        .query()
        .where('user_id', auth.user!.id)
        .first()
      if (member && event.organizationId !== member.organizationId) {
        return response.forbidden({ message: 'Event does not belong to your organization' })
      }
    }

    await event.delete()
    return response.noContent()
  }
  public async aiMatch({ params, response }: HttpContextContract) {
    const event = await Event.find(params.id)
    if (!event) return response.notFound()
    // AI matching logic stub
    return response.ok({ message: 'AI matching initiated', matches: [] })
  }
}
