import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import AppEvent from 'App/Models/Event'
import Application from '@ioc:Adonis/Core/Application'
import fs from 'fs'

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

      const isOrgContext = request.url().startsWith('/organization')

      // If user is Admin and NOT in org context, they can see everything.
      // Otherwise (Regular user OR Admin in org context), apply filters.
      if (auth.user.isAdmin && !isOrgContext) {
        // Admin viewing global events: Show all (no filter)
      } else {
        // When calling the namespaced route used by the organization panel
        // (/organization/events) we expect the authenticated user to be a
        // member of an organization. If they're not, return Not Found to
        // match the dashboard/compliance behavior.
        if (isOrgContext) {
          if (!member) return response.notFound({ message: 'User is not part of any organization' })
          query.where('organization_id', member.organizationId)
        } else if (member) {
          query.where('organization_id', member.organizationId)
        }
      }
    }

    // add filters
    if (q) {
      query.where((builder) => {
        builder
          .where('title', 'like', `%${q}%`)
          .orWhere('description', 'like', `%${q}%`)
          .orWhere('location', 'like', `%${q}%`)
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
    const payload = await Promise.all(
      events.map(async (ev) => {
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
        if (
          typeof latVal !== 'undefined' &&
          typeof lngVal !== 'undefined' &&
          latVal !== null &&
          lngVal !== null
        ) {
          evJson.coordinates = [Number(latVal), Number(lngVal)]
        } else if (evJson.metadata && evJson.metadata.coordinates) {
          evJson.coordinates = evJson.metadata.coordinates
        }

        try {
          const urls = await (ev as any).resolveMediaUrls()
          evJson.image = urls.image
          evJson.banner = urls.banner
          evJson.image_thumb = urls.image_thumb ?? null
        } catch (e) {
          // ignore
        }

        return evJson
      })
    )

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

    // handle optional media uploads (image/banner)
    try {
      const imageFile = request.file('image')
      if (imageFile) {
        await imageFile.moveToDisk('local', { dirname: 'events' })
        const filename = imageFile.fileName
        payload.image = `events/${filename}`

        // generate thumbnail for image
        try {
          const tmpRoot = Application.tmpPath('uploads')
          const dest = `${tmpRoot}/events/${filename}`
          const thumbDir = `${tmpRoot}/events/thumbs`
          if (!fs.existsSync(thumbDir)) fs.mkdirSync(thumbDir, { recursive: true })
          const thumbPath = `${thumbDir}/${filename}`
          const maybeSharp = await import('sharp').catch(() => null)
          const sharpLib = maybeSharp ? (maybeSharp.default ?? maybeSharp) : null
          if (sharpLib) {
            await sharpLib(dest).resize(800, 450, { fit: 'cover' }).toFile(thumbPath)
          }
        } catch (e) {
          // ignore
        }
      }

      const bannerFile = request.file('banner')
      if (bannerFile) {
        await bannerFile.moveToDisk('local', { dirname: 'events' })
        const filename = bannerFile.fileName
        payload.banner = `events/${filename}`
      }
    } catch (err) {
      // Log but don't block creation
      // eslint-disable-next-line no-console
      console.warn('Failed to save media files for event:', err)
    }

    const event = await AppEvent.create(payload)

    // resolve media urls to include in response
    try {
      const urls = await event.resolveMediaUrls()
      const out: any = event.toJSON()
      out.image = urls.image
      out.banner = urls.banner
      out.image_thumb = urls.image_thumb ?? null
      return response.created(out)
    } catch (e) {
      return response.created(event)
    }
  }

  public async show({ auth, params, response }: HttpContextContract) {
    const event = await AppEvent.query()
      .where('id', params.id)
      .preload('organization')
      .preload('tasks', (taskQuery) => taskQuery.preload('assignments'))
      .first()
    if (!event) return response.notFound()

    const evJson: any = event.toJSON()

    // Check application/assignment status for the current user
    let userApplicationStatus: string | null = null
    if (auth.user) {
      const Assignment = (await import('App/Models/Assignment')).default
      const assignment = await Assignment.query()
        .whereHas('task', (q) => q.where('event_id', event.id))
        .where('user_id', auth.user.id)
        .first()

      if (assignment) {
        userApplicationStatus = assignment.status // map directly to our frontend-friendly status
      }
    }

    const assigned = (event.tasks || []).reduce(
      (sum: number, t: any) => sum + (Array.isArray(t.assignments) ? t.assignments.length : 0),
      0
    )
    evJson.spots = { filled: assigned }
    evJson.capacity = event.capacity ?? event.capacity
    evJson.userApplicationStatus = userApplicationStatus

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

    // handle optional media uploads (image/banner) during update
    try {
      const imageFile = request.file('image')
      if (imageFile) {
        await imageFile.moveToDisk('local', { dirname: 'events' })
        const filename = imageFile.fileName
        normalized.image = `events/${filename}`

        // generate thumbnail for image
        try {
          const tmpRoot = Application.tmpPath('uploads')
          const dest = `${tmpRoot}/events/${filename}`
          const thumbDir = `${tmpRoot}/events/thumbs`
          if (!fs.existsSync(thumbDir)) fs.mkdirSync(thumbDir, { recursive: true })
          const thumbPath = `${thumbDir}/${filename}`
          const maybeSharp = await import('sharp').catch(() => null)
          const sharpLib = maybeSharp ? (maybeSharp.default ?? maybeSharp) : null
          if (sharpLib) {
            await sharpLib(dest).resize(800, 450, { fit: 'cover' }).toFile(thumbPath)
          }
        } catch (e) {
          // ignore
        }
      }

      const bannerFile = request.file('banner')
      if (bannerFile) {
        await bannerFile.moveToDisk('local', { dirname: 'events' })
        const filename = bannerFile.fileName
        normalized.banner = `events/${filename}`
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('Failed to save media files for event (update):', err)
    }

    event.merge(normalized)
    await event.save()

    try {
      const urls = await event.resolveMediaUrls()
      const out: any = event.toJSON()
      out.image = urls.image
      out.banner = urls.banner
      out.image_thumb = urls.image_thumb ?? null
      return response.ok(out)
    } catch (e) {
      return response.ok(event)
    }
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

    // Load tasks to get required skills
    await event.load('tasks', (q) => q.preload('assignments'))
    const tasks = event.tasks
    const assignedUserIds = new Set<number>()

    // Collect all unique required skills from all tasks
    const requiredSkills = new Set<string>()
    tasks.forEach((t) => {
      // track already assigned users to exclude them
      t.assignments.forEach((a) => assignedUserIds.add(a.userId))

      if (t.requiredSkills) {
        let skills: string[] = []
        if (Array.isArray(t.requiredSkills)) {
          skills = t.requiredSkills
        } else if (typeof t.requiredSkills === 'string') {
          skills = t.requiredSkills.split(',').map((s) => s.trim())
        }
        skills.forEach((s) => requiredSkills.add(s.toLowerCase()))
      }
    })

    // Fetch active volunteers
    const User = (await import('App/Models/User')).default
    const candidates = await User.query().where('volunteer_status', 'active').preload('assignments') // to check past experience

    // Filter and Score
    const matches = candidates
      .filter((u) => !assignedUserIds.has(u.id)) // Exclude already assigned
      .map((u) => {
        let score = 0
        const reasons: string[] = []

        // 1. Skill Match (+10 per skill)
        const userSkills = u.skills.map((s) => s.toLowerCase())
        const matchingSkills = userSkills.filter((s) => requiredSkills.has(s))
        if (matchingSkills.length > 0) {
          score += matchingSkills.length * 10
          reasons.push(`Matches skills: ${matchingSkills.join(', ')}`)
        }

        // 2. Recent Activity (+5 if active in last 30 days)
        if (u.lastLoginAt) {
          const daysSinceLogin = Math.floor(
            (Date.now() - new Date(u.lastLoginAt.toString()).getTime()) / (1000 * 60 * 60 * 24)
          )
          if (daysSinceLogin <= 30) {
            score += 5
            reasons.push('Recently active')
          }
        }

        // 3. Experience (+1 per past assignment, max 10)
        const experience = u.assignments.length
        if (experience > 0) {
          const points = Math.min(experience, 10)
          score += points
          reasons.push(`${experience} past assignments`)
        }

        return {
          user: {
            id: u.id,
            name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
            email: u.email,
            skills: u.skills
          },
          score,
          reasons
        }
      })
      .filter((m) => m.score > 0) // Only return candidates with some score
      .sort((a, b) => b.score - a.score) // Sort by highest score
      .slice(0, 10) // Top 10

    return response.ok({
      message: `Found ${matches.length} matching volunteers`,
      matches
    })
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
    const { AssignmentStatus } = await import('App/Constants/assignmentStatus')
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
      status: AssignmentStatus.Accepted
    })

    return response.created(assignment)
  }

  /**
   * Withdraw from an event. Deletes the assignment for the current user.
   */
  public async withdraw({ params, auth, response }: HttpContextContract) {
    if (!auth.user) return response.unauthorized()

    // Find the assignment through the tasks of this event
    const Assignment = (await import('App/Models/Assignment')).default
    const assignment = await Assignment.query()
      .whereHas('task', (q) => q.where('event_id', params.id))
      .where('user_id', auth.user.id)
      .first()

    if (!assignment) {
      return response.notFound({ message: 'No active assignment found for this event' })
    }

    await assignment.delete()

    return response.ok({ message: 'Successfully withdrawn from event' })
  }
}
