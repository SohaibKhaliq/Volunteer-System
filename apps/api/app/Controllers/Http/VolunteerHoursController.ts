import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import VolunteerHour from 'App/Models/VolunteerHour'
import AuditLog from 'App/Models/AuditLog'
import Database from '@ioc:Adonis/Lucid/Database'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class VolunteerHoursController {
  public async index({ request, response }: HttpContextContract) {
    const { user_id } = request.qs()

    let query = VolunteerHour.query().preload('user').preload('event').orderBy('date', 'desc')

    if (user_id) {
      query = query.where('user_id', Number(user_id))
    }
    const hours = await query

    // Normalize Lucid models into plain objects for the frontend
    const mapped = hours.map((h) => {
      const attrs: any = (h as any).$attributes ?? (h as any).$original ?? h.toJSON()

      // user may be a Lucid relation with internals
      const rawUser = (h as any).$preloaded?.user ?? (h as any).user ?? attrs.user ?? null
      const userSrc = rawUser ? (rawUser.$attributes ?? rawUser.$original ?? rawUser) : null

      const rawEvent = (h as any).$preloaded?.event ?? (h as any).event ?? attrs.event ?? null
      const eventSrc = rawEvent ? (rawEvent.$attributes ?? rawEvent.$original ?? rawEvent) : null

      return {
        id: attrs.id,
        date: attrs.date ? (attrs.date.toString?.() ?? attrs.date) : attrs.date,
        hours: attrs.hours,
        status: attrs.status,
        createdAt: attrs.createdAt ?? attrs.created_at,
        updatedAt: attrs.updatedAt ?? attrs.updated_at,
        user: userSrc
          ? {
              id: userSrc.id,
              email: userSrc.email,
              firstName: userSrc.firstName ?? userSrc.first_name,
              lastName: userSrc.lastName ?? userSrc.last_name
            }
          : null,
        event: eventSrc
          ? {
              id: eventSrc.id,
              title: eventSrc.title
            }
          : null
      }
    })

    return response.ok(mapped)
  }

  public async update({ auth, params, request, response }: HttpContextContract) {
    const record = await VolunteerHour.find(params.id)
    if (!record) return response.notFound()
    const previousStatus = record.status
    record.merge(request.only(['status']))
    await record.save()
    // return a normalized shape
    const rec = record.toJSON() as any

    // Log this action so admins can audit status changes
    try {
      const user = auth.user!
      // try to resolve organization for this volunteer (first match)
      let orgId: number | null = null
      try {
        const row: any = await Database.from('organization_volunteers')
          .where('user_id', rec.user?.id ?? rec.user_id)
          .first()
        if (row) orgId = row.organization_id
      } catch {}

      await AuditLog.create({
        userId: user.id,
        action: 'volunteer_hours_status_changed',
        details: JSON.stringify({
          previousStatus,
          newStatus: rec.status,
          hourId: rec.id,
          organizationId: orgId
        })
      })
    } catch (e) {
      // swallow logging errors
    }

    return response.ok({ id: rec.id, status: rec.status })
  }

  public async bulkUpdate({ auth, request, response }: HttpContextContract) {
    const { ids, status } = request.only(['ids', 'status'])
    await VolunteerHour.query().whereIn('id', ids).update({ status })

    // Log bulk change
    try {
      const user = auth.user!
      // try to resolve organizations for the given ids (limited)
      let orgIds: number[] = []
      try {
        const rows: any[] = await Database.from('volunteer_hours')
          .whereIn('id', ids)
          .join(
            'organization_volunteers',
            'organization_volunteers.user_id',
            'volunteer_hours.user_id'
          )
          .distinct('organization_volunteers.organization_id as organization_id')

        orgIds = rows.map((r) => r.organization_id)
      } catch {}

      await AuditLog.create({
        userId: user.id,
        action: 'volunteer_hours_bulk_update',
        details: JSON.stringify({ ids, newStatus: status, organizationIds: orgIds })
      })
    } catch (e) {
      // ignore logging error
    }

    return response.ok({ message: 'Bulk update successful' })
  }
}
