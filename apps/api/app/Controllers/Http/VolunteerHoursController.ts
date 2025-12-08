import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import VolunteerHour from 'App/Models/VolunteerHour'
import AuditLog from 'App/Models/AuditLog'
import Notification from 'App/Models/Notification'
import Achievement from 'App/Models/Achievement'
import UserAchievement from 'App/Models/UserAchievement'
import Database from '@ioc:Adonis/Lucid/Database'

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

    // Send notification to volunteer when hours are approved
    if (record.status === 'Approved' && previousStatus !== 'Approved') {
      try {
        await Notification.create({
          userId: record.userId,
          type: 'hours_approved',
          payload: JSON.stringify({
            volunteerHourId: record.id,
            hours: record.hours,
            date: record.date
          })
        })

        // Check for achievement milestones (10, 25, 50, 100, 500, 1000 hours)
        await this.checkAndAwardAchievements(record.userId)
      } catch (err) {
        console.warn('Failed to send hours approved notification or award achievements:', err)
      }
    }

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

      await AuditLog.safeCreate({
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

  /**
   * Check total approved hours and award milestone achievements
   */
  private async checkAndAwardAchievements(userId: number) {
    try {
      // Calculate total approved hours
      const result = await VolunteerHour.query()
        .where('user_id', userId)
        .where('status', 'Approved')
        .sum('hours as total')

      const totalHours = Number(result[0]?.$extras?.total || 0)

      // Define achievement thresholds (in hours)
      const milestones = [
        {
          hours: 10,
          key: 'hours_10',
          title: '10 Hours',
          description: 'Completed 10 volunteer hours'
        },
        {
          hours: 25,
          key: 'hours_25',
          title: '25 Hours',
          description: 'Completed 25 volunteer hours'
        },
        {
          hours: 50,
          key: 'hours_50',
          title: '50 Hours',
          description: 'Completed 50 volunteer hours'
        },
        {
          hours: 100,
          key: 'hours_100',
          title: '100 Hours',
          description: 'Completed 100 volunteer hours'
        },
        {
          hours: 500,
          key: 'hours_500',
          title: '500 Hours',
          description: 'Completed 500 volunteer hours'
        },
        {
          hours: 1000,
          key: 'hours_1000',
          title: '1000 Hours',
          description: 'Completed 1000 volunteer hours'
        }
      ]

      for (const milestone of milestones) {
        if (totalHours >= milestone.hours) {
          // Check if achievement exists
          let achievement = await Achievement.query().where('key', milestone.key).first()

          if (!achievement) {
            // Create achievement if it doesn't exist
            achievement = await Achievement.create({
              key: milestone.key,
              title: milestone.title,
              description: milestone.description,
              criteria: JSON.stringify({ hours: milestone.hours }),
              isEnabled: true
            })
          }

          // Check if user already has this achievement
          const existing = await UserAchievement.query()
            .where('user_id', userId)
            .where('achievement_id', achievement.id)
            .first()

          if (!existing) {
            // Award achievement
            await UserAchievement.create({
              userId,
              achievementId: achievement.id,
              awardedAt: DateTime.now()
            })

            // Send notification
            await Notification.create({
              userId,
              type: 'achievement_earned',
              payload: JSON.stringify({
                achievementId: achievement.id,
                achievementTitle: achievement.title,
                achievementDescription: achievement.description
              })
            })
          }
        }
      }
    } catch (err) {
      console.warn('Failed to check and award achievements:', err)
    }
  }

  public async bulkUpdate({ auth, request, response }: HttpContextContract) {
    const { ids, status } = request.only(['ids', 'status'])
    await VolunteerHour.query().whereIn('id', ids).update({ status })

    // If approving hours, send notifications and check achievements
    if (status === 'Approved') {
      try {
        const hours = await VolunteerHour.query().whereIn('id', ids)
        const userIds = [...new Set(hours.map((h) => h.userId))]

        for (const userId of userIds) {
          // Send notification
          const userHours = hours.filter((h) => h.userId === userId)
          const totalHours = userHours.reduce((sum, h) => sum + h.hours, 0)

          await Notification.create({
            userId,
            type: 'hours_approved',
            payload: JSON.stringify({
              count: userHours.length,
              totalHours
            })
          })

          // Check and award achievements
          await this.checkAndAwardAchievements(userId)
        }
      } catch (err) {
        console.warn('Failed to send bulk approval notifications or award achievements:', err)
      }
    }

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

      await AuditLog.safeCreate({
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
