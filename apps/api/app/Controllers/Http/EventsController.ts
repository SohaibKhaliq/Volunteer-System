import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import AppEvent from 'App/Models/Event'

export default class EventsController {
  public async index({ auth, request, response }: HttpContextContract) {
    // Debug logging for easier diagnostics in dev
    if (process.env.NODE_ENV !== 'production') {
      try {
        // eslint-disable-next-line no-console
        console.debug('EventsController.index called', { url: request.url(), qs: request.qs() })
      } catch (e) {
        // ignore
      }
    }
    // preload tasks and their assignments so we can compute volunteer counts
    const { organization_id, q, type, startDate, endDate, lat, lng, radius } = request.qs()

    const query = AppEvent.query().preload('tasks', (taskQuery) => {
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
      // When calling the namespaced route used by the organization panel
      // (/organization/events) we expect the authenticated user to be a
      // member of an organization. If they're not, return Not Found to
      // match the dashboard/compliance behavior.
      if (request.url().startsWith('/organization')) {
        if (!member) return response.notFound({ message: 'User is not part of any organization' })
        query.where('organization_id', member.organizationId)
      } else if (member) {
        query.where('organization_id', member.organizationId)
      }
    }

    // add filters
    if (q) {
      query.where((builder) => {
        builder.where('title', 'like', `%${q}%`).orWhere('description', 'like', `%${q}%`).orWhere('location', 'like', `%${q}%`)
      })
    }
    if (type) query.where('type', type)
    if (startDate) query.where('start_at', '>=', startDate)
    if (endDate) query.where('start_at', '<=', endDate)

    // geospatial filter: accept lat,lng and radius (km) and compute rough bounding box
    if (lat && lng && radius) {
      const latNum = parseFloat(lat as any)
      const lngNum = parseFloat(lng as any)
      const radiusKm = parseFloat(radius as any)
      if (!Number.isNaN(latNum) && !Number.isNaN(lngNum) && !Number.isNaN(radiusKm)) {
        const degDelta = radiusKm / 111 // approx degrees per km
        const minLat = latNum - degDelta
        const maxLat = latNum + degDelta
        const minLng = lngNum - degDelta
        const maxLng = lngNum + degDelta
        query.whereBetween('latitude', [minLat, maxLat]).whereBetween('longitude', [minLng, maxLng])
      }
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

      // coordinates: prefer explicit latitude/longitude columns, otherwise check metadata.coordinates
      const latVal = (ev as any).latitude
      const lngVal = (ev as any).longitude
      if (typeof latVal !== 'undefined' && typeof lngVal !== 'undefined' && latVal !== null && lngVal !== null) {
        evJson.coordinates = [Number(latVal), Number(lngVal)]
      } else if (evJson.metadata && evJson.metadata.coordinates) {
        evJson.coordinates = evJson.metadata.coordinates
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
      'latitude',
      'longitude',
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
    if (typeof raw.latitude !== 'undefined') payload.latitude = raw.latitude
    if (typeof raw.longitude !== 'undefined') payload.longitude = raw.longitude
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
      else if (request.url().startsWith('/organization')) {
        // If this call is the namespaced /organization/events route, the
        // caller must be a member of an organization.
        return response.notFound({ message: 'User is not part of any organization' })
      } else if (typeof raw.organization_id !== 'undefined')
        payload.organizationId = raw.organization_id
    } else if (typeof raw.organization_id !== 'undefined') {
      payload.organizationId = raw.organization_id
    }
    if (typeof raw.is_published !== 'undefined') payload.isPublished = raw.is_published

    // Support frontend sending separate `date` and `time` fields (e.g. from forms)
    if (!payload.startAt && (raw as any).date && (raw as any).time) {
      try {
        payload.startAt = new Date(`${(raw as any).date}T${(raw as any).time}`)
      } catch (e) {
        // ignore — leave undefined
      }
    }

    const event = await AppEvent.create(payload)
    return response.created(event)
  }

  public async show({ params, response }: HttpContextContract) {
    const event = await AppEvent.query()
      .where('id', params.id)
      .preload('tasks', (taskQuery) => taskQuery.preload('assignments'))
      .first()
    if (!event) return response.notFound()

    // If user is an org user, ensure the event matches their organization
    // If user is an org user, we don't need to restrict view access to only their org's events.
    // Public users and other org members should be able to see events.
    // The restriction should only be for update/delete/create which is handled by middleware/other methods.

    const evJson: any = event.toJSON()
    const assigned = (event.tasks || []).reduce(
      (sum: number, t: any) => sum + (Array.isArray(t.assignments) ? t.assignments.length : 0),
      0
    )
    evJson.spots = { filled: assigned }
    evJson.capacity = event.capacity ?? event.capacity
    return response.ok(evJson)
  }

  public async update({ auth, params, request, response }: HttpContextContract) {
    const event = await AppEvent.find(params.id)
    if (!event) return response.notFound()
    if (auth?.user) {
      const OrganizationTeamMember = await import('App/Models/OrganizationTeamMember')
      const member = await OrganizationTeamMember.default
        .query()
        .where('user_id', auth.user!.id)
        .first()
      if (!member && request.url().startsWith('/organization')) {
        return response.notFound({ message: 'User is not part of any organization' })
      }

      if (member && event.organizationId !== member.organizationId) {
        return response.forbidden({ message: 'AppEvent does not belong to your organization' })
      }
    }
    const raw = request.only([
      'title',
      'description',
      'location',
      'latitude',
      'longitude',
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
    if (typeof raw.latitude !== 'undefined') normalized.latitude = raw.latitude
    if (typeof raw.longitude !== 'undefined') normalized.longitude = raw.longitude
    if (raw.start_at) normalized.startAt = raw.start_at
    if (raw.end_at) normalized.endAt = raw.end_at
    if (raw.recurring_rule) normalized.recurringRule = raw.recurring_rule
    if (typeof raw.is_recurring !== 'undefined') normalized.isRecurring = raw.is_recurring
    if (typeof raw.capacity !== 'undefined') normalized.capacity = raw.capacity
    if (typeof raw.is_published !== 'undefined') normalized.isPublished = raw.is_published
    if (typeof raw.organization_id !== 'undefined') normalized.organizationId = raw.organization_id

    // support date/time fields for updates
    if (!normalized.startAt && (raw as any).date && (raw as any).time) {
      try {
        normalized.startAt = new Date(`${(raw as any).date}T${(raw as any).time}`)
      } catch (e) {
        // ignore
      }
    }

    event.merge(normalized)
    await event.save()
    return response.ok(event)
  }

  public async destroy({ auth, params, request, response }: HttpContextContract) {
    const event = await AppEvent.find(params.id)
    if (!event) return response.notFound()
    if (auth?.user) {
      const OrganizationTeamMember = await import('App/Models/OrganizationTeamMember')
      const member = await OrganizationTeamMember.default
        .query()
        .where('user_id', auth.user!.id)
        .first()
      if (!member && request.url().startsWith('/organization')) {
        return response.notFound({ message: 'User is not part of any organization' })
      }

      if (member && event.organizationId !== member.organizationId) {
        return response.forbidden({ message: 'AppEvent does not belong to your organization' })
      }
    }

    await event.delete()
    return response.noContent()
  }
  public async aiMatch({ params, response }: HttpContextContract) {
    const event = await AppEvent.find(params.id)
    if (!event) return response.notFound()
    // AI matching logic stub
    return response.ok({ message: 'AI matching initiated', matches: [] })
  }

  /**
   * Join an event as the current user. This chooses the first available task with an open slot
   * and creates an assignment. Requires authentication.
   */
  public async join({ params, auth, response }: HttpContextContract) {
    if (!auth.user) return response.unauthorized()

    const event = await AppEvent.find(params.id)
    if (!event) return response.notFound()

    // load tasks and assignments to find available slot
    const tasks = await event.related('tasks').query().preload('assignments')

    // find a task with available slots; if slotCount is 0 or undefined treat as no slots
    let chosenTask = tasks.find((t: any) => {
      const required = Number(t.slotCount ?? t.slot_count ?? 0) || 0
      const assigned = Array.isArray(t.assignments) ? t.assignments.length : 0
      // if slot count is zero, it either means no explicit slots or unlimited — allow signup
      if (!required) return true
      return assigned < required
    })

    // If no tasks exist or none with open slots, fall back to adding a placeholder assignment
    // by creating a minimal task for this event (so we can track signups)
    const Assignment = await import('App/Models/Assignment')
    if (!chosenTask) {
      // create a lightweight task so we can attach an assignment
      const Task = await import('App/Models/Task')
      const t = await Task.default.create({
        eventId: event.id,
        title: `Auto-generated signup for ${event.title}`
      })
      chosenTask = t
    }

    // prevent duplicates
    const existing = await Assignment.default
      .query()
      .where('task_id', chosenTask.id)
      .where('user_id', auth.user.id)
      .first()
    if (existing) return response.ok({ message: 'Already joined' })

    // create assignment. Volunteer-initiated signups should use the assignments enum 'accepted'
    const assignment = await Assignment.default.create({
      taskId: chosenTask.id,
      userId: auth.user.id,
      assignedBy: auth.user.id,
      status: 'accepted'
    })

    return response.created(assignment)
  }
}
