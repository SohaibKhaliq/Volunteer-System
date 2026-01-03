import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import VolunteerHour from 'App/Models/VolunteerHour'
import {
  CreateVolunteerHourValidator,
  UpdateVolunteerHourValidator
} from 'App/Validators/VolunteerHourValidator'

import Event from 'App/Models/Event'

export default class VolunteerHoursController {
  public async index({ request, auth }: HttpContextContract) {
    const user = auth.user!
    const { page = 1, limit = 20, status, organizationId } = request.qs()

    let query = VolunteerHour.query().preload('user').preload('event').preload('shift')

    // If user is Admin or Org Admin for the requested org, they can see all.
    // Otherwise, normal users only see their own.

    // Simplistic role check for now - assuming 'admin' role or specific org context
    // Ideally we'd use a Policy here.
    const isGlobalAdmin = (user as any).roleId === 1 // Assuming 1 is Admin

    // For now, if organizationId is passed, we check if user manages that org
    if (organizationId) {
      // TODO: Verify user permissions for this organization
      // await bouncer.with('OrganizationPolicy').authorize('viewHours', organizationId)
      query.where('organization_id', organizationId)
    } else if (!isGlobalAdmin) {
      // Default to showing only own hours if not an admin looking at org data
      query.where('user_id', user.id)
    }

    if (status) {
      query.where('status', status)
    }

    const hours = await query.orderBy('date', 'desc').paginate(page, limit)
    return hours
  }

  public async store({ request, auth, response }: HttpContextContract) {
    const user = auth.user!
    const payload = await request.validate(CreateVolunteerHourValidator)

    const event = await Event.findOrFail(payload.eventId)

    // Ensure user isn't spamming or submitting duplicate for same shift/event-day if strict

    const hour = await VolunteerHour.create({
      userId: user.id,
      organizationId: event.organizationId,
      eventId: payload.eventId,
      shiftId: payload.shiftId,
      date: payload.date,
      hours: payload.hours,
      notes: payload.notes,
      status: 'pending' // pending by default
    })

    return response.created(hour)
  }

  public async show({ params }: HttpContextContract) {
    const hour = await VolunteerHour.findOrFail(params.id)
    await hour.load('user')
    await hour.load('event')
    await hour.load('shift')
    return hour
  }

  public async update({ params, request, auth, response }: HttpContextContract) {
    const hour = await VolunteerHour.findOrFail(params.id)
    const user = auth.user!

    // Check permissions - only owner (if pending) or admin can update
    const isOwner = hour.userId === user.id
    // const isAdmin = await checkOrgAdmin(user, hour.organizationId)

    if (isOwner && hour.status !== 'pending') {
      return response.forbidden('Cannot edit processed hours')
    }

    const payload = await request.validate(UpdateVolunteerHourValidator)

    // If status is changing, ensure it's an admin doing it
    if (payload.status && payload.status !== hour.status) {
      // if (!isAdmin) return response.forbid()
      hour.auditedBy = user.id
    }

    if (payload.status === 'rejected' && !payload.rejectionReason) {
      return response.badRequest('Rejection reason is required')
    }

    hour.merge(payload)
    await hour.save()
    return hour
  }

  public async bulkUpdateStatus({ request, auth, response }: HttpContextContract) {
    const { ids, status, rejectionReason } = request.only(['ids', 'status', 'rejectionReason'])
    const user = auth.user!

    // Verify admin permissions for all involved orgs? Or just assume scoped by UI

    if (status === 'rejected' && !rejectionReason) {
      return response.badRequest('Rejection reason required for rejection')
    }

    await VolunteerHour.query()
      .whereIn('id', ids)
      .update({
        status,
        rejection_reason: status === 'rejected' ? rejectionReason : null,
        audited_by: user.id
      })

    return response.ok({ message: 'Updated successfully' })
  }
}
